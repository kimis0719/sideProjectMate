import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/projects — 프로젝트 목록 (상태 필터, 페이지네이션)
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // 'recruiting' | 'in_progress' | 'completed' | 'paused'
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (status && ['recruiting', 'in_progress', 'completed', 'paused'].includes(status))
      query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    const allowedSortFields = ['pid', 'views', 'likeCount', 'createdAt', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      Project.find(query)
        .select('pid title status delYn views likeCount createdAt ownerId members')
        .populate('ownerId', 'nName authorEmail')
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: { projects, total, page, limit } });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 목록을 불러오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/projects — 프로젝트 일괄 비활성화/재활성화 (delYn)
async function handlePatch(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { pids, delYn } = body;

    if (!Array.isArray(pids) || pids.length === 0 || typeof delYn !== 'boolean') {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 요청입니다. (pids 배열과 delYn 필수)' },
        { status: 400 }
      );
    }

    const result = await Project.updateMany({ pid: { $in: pids } }, { $set: { delYn } });

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount}개 프로젝트의 상태가 변경되었습니다.`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 일괄 처리 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects — 프로젝트 일괄 영구 삭제
async function handleDelete(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { pids } = body;

    if (!Array.isArray(pids) || pids.length === 0) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 요청입니다. (pids 배열 필수)' },
        { status: 400 }
      );
    }

    const result = await Project.deleteMany({ pid: { $in: pids } });

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount}개 프로젝트가 삭제되었습니다.`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 일괄 삭제 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/projects');
export const DELETE = withApiLogging(handleDelete, '/api/admin/projects');
export const PATCH = withApiLogging(handlePatch, '/api/admin/projects');
