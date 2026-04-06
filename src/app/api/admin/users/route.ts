import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — 사용자 목록 (검색, 정렬, 페이지네이션)
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { nName: { $regex: search, $options: 'i' } },
        { authorEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 1 : -1;
    const allowedSortFields = ['uid', 'createdAt', 'nName', 'authorEmail'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('nName authorEmail memberType delYn createdAt avatarUrl uid')
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: { users, total, page, limit } });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '사용자 목록을 불러오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users — 사용자 일괄 상태 변경 (delYn)
async function handlePatch(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { ids, delYn } = body;

    if (!Array.isArray(ids) || ids.length === 0 || typeof delYn !== 'boolean') {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 요청입니다. (ids 배열과 delYn 필수)' },
        { status: 400 }
      );
    }

    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { delYn } });

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount}명의 상태가 변경되었습니다.`,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '사용자 일괄 처리 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/users');
export const PATCH = withApiLogging(handlePatch, '/api/admin/users');
