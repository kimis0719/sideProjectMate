import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id] — 사용자 상세 조회
async function handleGet(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const user = await User.findById(params.id).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '사용자 정보 조회 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] — 사용자 상태 변경 (delYn, memberType)
async function handlePatch(request: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { delYn, memberType } = body;

    // 자기 자신의 권한/상태는 변경 불가
    if (params.id === session!.user!._id) {
      return NextResponse.json(
        { success: false, message: '자신의 계정은 변경할 수 없습니다.' },
        { status: 400 }
      );
    }

    const allowedFields: Record<string, unknown> = {};
    if (typeof delYn === 'boolean') allowedFields.delYn = delYn;
    if (memberType === 'user' || memberType === 'admin') allowedFields.memberType = memberType;

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json(
        { success: false, message: '변경할 필드가 없습니다. (delYn, memberType)' },
        { status: 400 }
      );
    }

    const updated = await User.findByIdAndUpdate(
      params.id,
      { $set: allowedFields },
      { new: true }
    ).select('nName authorEmail memberType delYn createdAt uid');

    if (!updated) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '사용자 정보 변경 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/users/[id]');
export const PATCH = withApiLogging(handlePatch, '/api/admin/users/[id]');
