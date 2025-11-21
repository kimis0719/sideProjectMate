import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import Notification from '@/lib/models/Notification';
import ProjectMember from '@/lib/models/ProjectMember';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { appId: string } }
) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { appId } = params;
    const { status } = await request.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: '잘못된 상태 값입니다.' }, { status: 400 });
    }

    const application = await Application.findById(appId).populate('projectId');
    if (!application) {
      return NextResponse.json({ success: false, message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
    }

    const project = application.projectId as any;

    if (project.author.toString() !== session.user._id) {
      return NextResponse.json({ success: false, message: '지원서를 처리할 권한이 없습니다.' }, { status: 403 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ success: false, message: '이미 처리된 지원서입니다.' }, { status: 400 });
    }

    application.status = status;
    await application.save();

    if (status === 'accepted') {
      // ProjectMember로 추가
      // userId를 사용하여 멤버 등록
      await ProjectMember.create({
        projectId: project._id,
        userId: application.applicantId,
        role: application.role,
        status: 'active',
      });

      // 프로젝트의 members 배열에서 해당 역할의 current 값 증가
      const memberIndex = project.members.findIndex((m: any) => m.role === application.role);
      if (memberIndex !== -1) {
        project.members[memberIndex].current += 1;
        await project.save();
      }
    }

    await Notification.create({
      recipient: application.applicantId,
      sender: session.user._id,
      type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
      project: project._id,
    });

    return NextResponse.json({ success: true, data: application });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '지원서 처리 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { appId: string } }
) {
  // ... (DELETE 핸들러는 변경 없음)
}
