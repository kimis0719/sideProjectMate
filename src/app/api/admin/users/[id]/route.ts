import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/users/[id] — 사용자 상태 변경 (delYn, memberType)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const allowedFields: Record<string, any> = {};
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
      return NextResponse.json({ success: false, message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '사용자 정보 변경 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
