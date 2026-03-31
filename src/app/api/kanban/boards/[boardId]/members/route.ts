import { NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import dbConnect from '@/lib/dbConnect';
import Board from '@/lib/models/kanban/BoardModel';
import Project from '@/lib/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 프로젝트 멤버 조회 API (GET /api/kanban/boards/[boardId]/members)
 * 해당 보드가 속한 프로젝트의 멤버 리스트를 반환합니다.
 */
async function handleGet(request: Request, { params }: { params: { boardId: string } }) {
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
    const project = await Project.findOne({ pid: board.pid })
      .populate({
        path: 'members.userId',
        select: 'nName authorEmail position avatarUrl',
      })
      .lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 4. 멤버 데이터 가공
    interface PopulatedMember {
      userId: {
        _id: string;
        nName: string;
        authorEmail: string;
        position: string;
        avatarUrl: string;
      };
      role: string;
    }

    const projectData = project as unknown as { members?: PopulatedMember[] };
    const members = (projectData.members || [])
      .filter((pm) => pm.userId)
      .map((pm) => ({
        _id: pm.userId._id,
        nName: pm.userId.nName,
        email: pm.userId.authorEmail,
        position: pm.userId.position,
        avatarUrl: pm.userId.avatarUrl,
        role: pm.role,
      }));

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Failed to fetch board members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withApiLogging(handleGet, '/api/kanban/boards/[boardId]/members');
