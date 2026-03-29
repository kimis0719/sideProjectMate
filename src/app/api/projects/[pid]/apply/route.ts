import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import Notification from '@/lib/models/Notification';
import { headers } from 'next/headers';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handlePost(request: Request, { params }: { params: { pid: string } }) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const applicantId = session.user._id;

    const project = await Project.findOne({ pid: Number(pid) });
    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (project.author.toString() === applicantId) {
      return NextResponse.json(
        { success: false, message: '자신의 프로젝트에는 지원할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { role, message } = await request.json();
    if (!role || !message) {
      return NextResponse.json(
        { success: false, message: '지원 역할과 메시지를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const targetRole = project.members.find(
      (m: { role: string; current: number; max: number }) => m.role === role
    );
    if (!targetRole) {
      return NextResponse.json(
        { success: false, message: '모집하지 않는 역할입니다.' },
        { status: 400 }
      );
    }

    const existingApplication = await Application.findOne({
      projectId: project._id,
      applicantId,
      role,
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: '이미 해당 역할에 지원했습니다.' },
        { status: 409 }
      );
    }

    await Application.create({
      projectId: project._id,
      applicantId,
      role,
      message,
    });

    await Notification.create({
      recipient: project.author,
      sender: applicantId,
      type: 'new_applicant',
      project: project._id,
    });

    return NextResponse.json(
      { success: true, message: '프로젝트에 성공적으로 지원했습니다.' },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '지원 처리 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const POST = withApiLogging(handlePost, '/api/projects/[pid]/apply');
