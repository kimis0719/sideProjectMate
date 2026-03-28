import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/users — 사용자 목록 (검색, 정렬, 페이지네이션)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { nName: { $regex: search, $options: 'i' } },
        { authorEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('nName authorEmail memberType delYn createdAt avatarUrl uid')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: { users, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: '사용자 목록을 불러오는 중 오류가 발생했습니다.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users — 사용자 일괄 상태 변경 (delYn)
export async function PATCH(request: NextRequest) {
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '사용자 일괄 처리 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
