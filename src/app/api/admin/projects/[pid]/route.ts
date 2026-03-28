import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/projects/[pid] — 프로젝트 상세 조회
export async function GET(_request: NextRequest, { params }: { params: { pid: string } }) {
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
      .populate('author', 'nName authorEmail avatarUrl')
      .populate('tags', 'name logoUrl category');

    if (!project) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 정보 조회 중 오류가 발생했습니다.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/projects/[pid] — 프로젝트 비활성화/재활성화
export async function PATCH(request: NextRequest, { params }: { params: { pid: string } }) {
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

    const body = await request.json();
    const { delYn } = body;

    if (typeof delYn !== 'boolean') {
      return NextResponse.json(
        { success: false, message: '변경할 필드가 없습니다. (delYn)' },
        { status: 400 }
      );
    }

    const updated = await Project.findOneAndUpdate({ pid }, { $set: { delYn } }, { new: true })
      .populate('author', 'nName authorEmail avatarUrl')
      .populate('tags', 'name logoUrl category');

    if (!updated) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 상태 변경 중 오류가 발생했습니다.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[pid] — 프로젝트 강제 삭제 (pid 기준)
export async function DELETE(_request: NextRequest, { params }: { params: { pid: string } }) {
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

    const deleted = await Project.findOneAndDelete({ pid });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `프로젝트 #${pid}가 삭제되었습니다.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트 삭제 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
