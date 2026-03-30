import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handlePost(request: Request, { params }: { params: { pid: string } }) {
  headers();
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user._id) {
      return NextResponse.json(
        { success: false, message: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { pid } = params;

    const project = await Project.findOne({ pid: Number(pid) });

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Phase 1: likes 배열 → likeCount 숫자. 토글 방식은 Phase 5에서 재설계
    const updatedProject = (await Project.findByIdAndUpdate(
      project._id,
      { $inc: { likeCount: 1 } },
      { new: true }
    )
      .select('likeCount')
      .lean()) as { likeCount?: number } | null;

    return NextResponse.json({
      success: true,
      data: { likeCount: updatedProject?.likeCount ?? 0 },
      message: '좋아요를 눌렀습니다.',
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePost, '/api/projects/[pid]/like');
