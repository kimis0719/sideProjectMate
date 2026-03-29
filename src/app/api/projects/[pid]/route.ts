import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';
import ProjectMember from '@/lib/models/ProjectMember';
import User from '@/lib/models/User';
import TechStack from '@/lib/models/TechStack';
import Notification from '@/lib/models/Notification';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, { params }: { params: { pid: string } }) {
  headers();
  try {
    await dbConnect();
    const { pid } = params;
    const pidNum = Number(pid);

    if (!pid || isNaN(pidNum)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }

    const project = await Project.findOneAndUpdate(
      { pid: pidNum },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate(
        'author',
        'nName authorEmail position career status introduction socialLinks githubStats techTags level avatarUrl'
      )
      .populate('tags')
      .populate({
        path: 'projectMembers',
        strictPopulate: false,
        populate: {
          path: 'userId',
          select:
            'nName authorEmail position career status introduction socialLinks githubStats techTags level avatarUrl',
        },
      })
      .lean();

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    console.error(`[API ERROR: GET /api/projects/${params.pid}]`, error);
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

async function handlePut(request: Request, { params }: { params: { pid: string } }) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const pidNum = Number(pid);
    if (isNaN(pidNum)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }
    const project = await Project.findOne({ pid: pidNum });

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (project.author.toString() !== session.user._id) {
      return NextResponse.json(
        { success: false, message: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updatedProject = await Project.findByIdAndUpdate(project._id, body, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 수정 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function handleDelete(request: Request, { params }: { params: { pid: string } }) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const pidNum = Number(pid);
    if (isNaN(pidNum)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }
    const project = await Project.findOne({ pid: pidNum });

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (project.author.toString() !== session.user._id) {
      return NextResponse.json(
        { success: false, message: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    await Project.findByIdAndDelete(project._id);

    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 삭제 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ✨ [PATCH] 프로젝트 상태 및 개요 부분 업데이트
async function handlePatch(request: Request, { params }: { params: { pid: string } }) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const pidNum = Number(pid);
    if (isNaN(pidNum)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }
    const project = await Project.findOne({ pid: pidNum });

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자 권한 체크
    if (project.author.toString() !== session.user._id) {
      return NextResponse.json(
        { success: false, message: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, overview } = body; // 업데이트할 필드만 추출

    // 상태값 유효성 검사 (변경 시에만)
    if (status && !['01', '02', '03'].includes(status)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 상태 값입니다.' },
        { status: 400 }
      );
    }

    // 업데이트 객체 구성
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (overview !== undefined) updateData.overview = overview; // 빈 문자열 허용

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: '변경할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const prevStatus = project.status;

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // 프로젝트 완료(→'03') 전환 시 팀원들에게 리뷰 요청 알림 발송
    if (status === '03' && prevStatus !== '03') {
      try {
        const activeMembers = await ProjectMember.find({
          projectId: project._id,
          status: 'active',
        }).lean();

        // 팀원 userId 목록 (프로젝트 작성자 포함, 중복 제거)
        const recipientIds = new Set<string>();
        activeMembers.forEach((m) => recipientIds.add(m.userId.toString()));
        recipientIds.add(project.author.toString());
        // 알림 발신자(status 변경자) 본인은 제외
        recipientIds.delete(session.user._id);

        if (recipientIds.size > 0) {
          const notifications = Array.from(recipientIds).map((recipientId) => ({
            recipient: recipientId,
            sender: session.user._id,
            type: 'review_request' as const,
            project: project._id,
          }));
          await Notification.insertMany(notifications, { ordered: false });
        }
      } catch (notifError) {
        // 알림 발송 실패는 프로젝트 상태 변경에 영향을 주지 않음
        console.error('[PATCH /api/projects] 리뷰 요청 알림 발송 오류:', notifError);
      }
    }

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error: unknown) {
    console.error(`[API ERROR: PATCH /api/projects/${params.pid}]`, error);
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 수정 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/projects/[pid]');
export const PUT = withApiLogging(handlePut, '/api/projects/[pid]');
export const DELETE = withApiLogging(handleDelete, '/api/projects/[pid]');
export const PATCH = withApiLogging(handlePatch, '/api/projects/[pid]');
