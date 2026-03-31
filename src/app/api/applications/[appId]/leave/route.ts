import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Application from '@/lib/models/Application';
import Project, { IProject } from '@/lib/models/Project';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handlePatch(request: Request, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();
  const { appId } = params;

  const application = await Application.findById(appId).populate('projectId');
  if (!application) {
    return NextResponse.json(
      { success: false, message: '지원서를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 본인만 탈퇴 가능
  if (application.applicantId.toString() !== session.user._id) {
    return NextResponse.json(
      { success: false, message: '본인의 지원만 탈퇴할 수 있습니다.' },
      { status: 403 }
    );
  }

  if (application.status !== 'accepted') {
    return NextResponse.json(
      { success: false, message: '수락된 지원만 탈퇴할 수 있습니다.' },
      { status: 400 }
    );
  }

  const project = application.projectId as IProject;

  // 1. Application status → withdrawn
  application.status = 'withdrawn';
  await application.save();

  // 2. Project members에서 제거
  await Project.updateOne(
    { _id: project._id },
    { $pull: { members: { userId: application.applicantId } } }
  );

  return NextResponse.json({ success: true, message: '프로젝트에서 탈퇴했습니다.' });
}

export const PATCH = withApiLogging(handlePatch, '/api/applications/[appId]/leave');
