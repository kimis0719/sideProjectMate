import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Application from '@/lib/models/Application';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// 현재 사용자의 특정 프로젝트 지원 여부 확인 API
export async function GET(
    request: Request,
    { params }: { params: { pid: string } }
) {
    headers();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        await dbConnect();
        const { pid } = params;

        // pid로 프로젝트 _id 찾기
        const project = await Project.findOne({ pid: Number(pid) });
        if (!project) {
            return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 해당 프로젝트에 대한 사용자의 지원 내역 조회
        const application = await Application.findOne({
            projectId: project._id,
            applicantId: session.user._id,
        });

        return NextResponse.json({
            success: true,
            applied: !!application, // 지원 내역 존재 여부
            data: application,
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: '지원 내역 확인 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
