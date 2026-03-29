import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Application from '@/lib/models/Application';
import Project from '@/lib/models/Project'; // populate를 위해 import
import { withApiLogging } from '@/lib/apiLogger';

async function handleGet(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();

    // 현재 로그인한 사용자가 지원한 모든 지원서를 찾음
    const myApplications = await Application.find({ applicantId: session.user._id })
      .sort({ createdAt: -1 })
      .populate('projectId', 'title pid')
      .lean();

    return NextResponse.json({ success: true, data: myApplications });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '내 지원 목록을 불러오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/applications');
