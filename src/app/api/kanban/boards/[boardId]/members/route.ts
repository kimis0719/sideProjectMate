import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Board from '@/lib/models/kanban/BoardModel';
import Project from '@/lib/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 프로젝트 멤버 조회 API (GET /api/kanban/boards/[boardId]/members)
 * 해당 보드가 속한 프로젝트의 멤버 리스트를 반환합니다.
 */
export async function GET(
    request: Request,
    { params }: { params: { boardId: string } }
) {
    try {
        await dbConnect();
        const { boardId } = params;

        // 1. 세션 확인
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. 보드 조회하여 PID 획득
        const board = await Board.findById(boardId);
        if (!board) {
            return NextResponse.json({ error: 'Board not found' }, { status: 404 });
        }

        // 3. 프로젝트 및 멤버 조회
        // Project 모델의 virtual populate 'projectMembers'를 사용하거나,
        // 직접 ProjectMember 컬렉션을 조회할 수도 있지만,
        // Project 모델 조회 시 populate 옵션을 사용하는 것이 효율적일 수 있음.
        // 기존 /api/projects/[pid] 참조.

        const project = await Project.findOne({ pid: board.pid })
            .populate({
                path: 'projectMembers',
                populate: {
                    path: 'userId', // User 모델 populate
                    select: 'nName authorEmail position' // 필요한 필드만 선택
                }
            });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 4. 멤버 데이터 가공
        // project.projectMembers는 가상 필드로 populate 된 상태
        // (타입스크립트 이슈가 있을 수 있어 any로 캐스팅하거나 방어코드 작성)
        const members = (project as any).projectMembers?.map((pm: any) => ({
            _id: pm.userId._id, // User ID (assigneeId로 사용될 값)
            nName: pm.userId.nName,
            email: pm.userId.authorEmail,
            position: pm.userId.position,
            role: pm.role // Member role (editor, viewer etc)
        })) || [];

        return NextResponse.json({ success: true, members });

    } catch (error) {
        console.error('Failed to fetch board members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
