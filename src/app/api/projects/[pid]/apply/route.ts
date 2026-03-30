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

    if (project.ownerId.toString() === applicantId) {
      return NextResponse.json(
        { success: false, message: '자신의 프로젝트에는 지원할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { motivation, weeklyHours, message } = await request.json();
    if (!motivation || !weeklyHours) {
      return NextResponse.json(
        {
          success: false,
          message: '지원 동기(motivation)와 주당 참여 가능 시간(weeklyHours)을 입력해주세요.',
        },
        { status: 400 }
      );
    }

    if (motivation.length < 20) {
      return NextResponse.json(
        { success: false, message: '지원 동기는 최소 20자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const existingApplication = await Application.findOne({
      projectId: project._id,
      applicantId,
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: '이미 이 프로젝트에 지원했습니다.' },
        { status: 409 }
      );
    }

    await Application.create({
      projectId: project._id,
      applicantId,
      motivation,
      weeklyHours,
      message,
    });

    await Notification.create({
      recipient: project.ownerId,
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
