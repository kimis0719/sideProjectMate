import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import Notification from '@/lib/models/Notification';

export async function PUT(
  request: Request,
  { params }: { params: { appId: string } }
) {
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
      const roleToUpdate = application.role;
      const memberToUpdate = project.members.find((m: any) => m.role === roleToUpdate);

      if (memberToUpdate && memberToUpdate.current < memberToUpdate.max) {
        memberToUpdate.current += 1;
        await project.save();
      } else {
        return NextResponse.json({ success: false, message: '해당 역할의 정원이 모두 찼습니다.' }, { status: 409 });
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
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { appId } = params;

    const application = await Application.findById(appId).populate('projectId');
    if (!application) {
      return NextResponse.json({ success: false, message: '지원서를 찾을 수 없습니다.' }, { status: 404 });
    }

    const project = application.projectId as any;
    const isOwner = project.author.toString() === session.user._id;
    const isApplicant = application.applicantId.toString() === session.user._id;

    // 인가: 지원자 본인이거나 프로젝트 작성자만 삭제 가능
    if (!isApplicant && !isOwner) {
      return NextResponse.json({ success: false, message: '지원서를 삭제할 권한이 없습니다.' }, { status: 403 });
    }

    // 이미 수락된 지원서는 작성자도 취소 불가 (별도 멤버 관리 기능 필요)
    if (application.status === 'accepted') {
      return NextResponse.json({ success: false, message: '이미 수락된 지원은 취소/삭제할 수 없습니다.' }, { status: 400 });
    }

    await Application.findByIdAndDelete(appId);

    return NextResponse.json({ success: true, message: '지원서가 삭제되었습니다.' });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '지원서 삭제 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
