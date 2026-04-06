import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';
import { logAdminAction, getClientIp } from '@/lib/utils/adminAuditLog';

export const dynamic = 'force-dynamic';

// GET /api/admin/projects/[pid] — 프로젝트 상세 조회
async function handleGet(_request: NextRequest, { params }: { params: { pid: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const pid = parseInt(params.pid, 10);

    if (isNaN(pid)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }

    const project = await Project.findOne({ pid })
      .populate('ownerId', 'nName authorEmail avatarUrl')
      .lean();

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 정보 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/projects/[pid] — 프로젝트 비활성화/재활성화
async function handlePatch(request: NextRequest, { params }: { params: { pid: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const pid = parseInt(params.pid, 10);

    if (isNaN(pid)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { delYn } = body;

    if (typeof delYn !== 'boolean') {
      return NextResponse.json(
        { success: false, message: '변경할 필드가 없습니다. (delYn)' },
        { status: 400 }
      );
    }

    const updated = await Project.findOneAndUpdate(
      { pid },
      { $set: { delYn } },
      { new: true }
    ).populate('ownerId', 'nName authorEmail avatarUrl');

    if (!updated) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    logAdminAction({
      adminId: session!.user._id,
      adminEmail: session!.user.email ?? '',
      action: delYn ? 'project.deactivate' : 'project.activate',
      targetType: 'project',
      targetId: String(pid),
      targetLabel: updated.title,
      detail: `delYn: ${!delYn} → ${delYn}`,
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 상태 변경 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[pid] — 프로젝트 강제 삭제 (pid 기준)
async function handleDelete(request: NextRequest, { params }: { params: { pid: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const pid = parseInt(params.pid, 10);

    if (isNaN(pid)) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 프로젝트 ID입니다.' },
        { status: 400 }
      );
    }

    const deleted = await Project.findOneAndDelete({ pid });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    logAdminAction({
      adminId: session!.user._id,
      adminEmail: session!.user.email ?? '',
      action: 'project.delete',
      targetType: 'project',
      targetId: String(pid),
      targetLabel: deleted.title,
      detail: '영구 삭제',
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: `프로젝트 #${pid}가 삭제되었습니다.` });
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

export const GET = withApiLogging(handleGet, '/api/admin/projects/[pid]');
export const DELETE = withApiLogging(handleDelete, '/api/admin/projects/[pid]');
export const PATCH = withApiLogging(handlePatch, '/api/admin/projects/[pid]');
