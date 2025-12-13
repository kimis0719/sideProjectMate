import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Application from '@/lib/models/Application';
import Project from '@/lib/models/Project';
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

    // pid로 프로젝트 조회 후 해당 projectId(ObjectId)로 지원자 목록 조회
    const project = await Project.findOne({ pid: Number(pid) });
    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const applications = await Application.find({ projectId: project._id })
      .sort({ createdAt: -1 })
      .populate('applicantId', 'nName authorEmail');

    // 응답 단순화: 필요한 필드만 반환
    const data = applications.map((app: any) => ({
      _id: app._id.toString(),
      status: app.status,
      role: app.role,
      createdAt: app.createdAt,
      applicant: {
        _id: app.applicantId?._id?.toString(),
        nName: app.applicantId?.nName || app.applicantId?.authorEmail,
        email: app.applicantId?.authorEmail,
      },
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트 지원자 조회 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
