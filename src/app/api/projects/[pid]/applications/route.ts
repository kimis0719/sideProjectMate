import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { pid: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;

    const project = await Project.findOne({ pid: Number(pid) });
    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (project.author.toString() !== session.user._id) {
      return NextResponse.json({ success: false, message: '지원자 목록을 볼 권한이 없습니다.' }, { status: 403 });
    }

    const applications = await Application.find({ projectId: project._id })
      .populate('applicantId', 'nName authorEmail');

    return NextResponse.json({ success: true, data: applications });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '지원자 목록을 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
