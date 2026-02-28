import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommonCode from '@/lib/models/CommonCode';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// PUT /api/admin/common-codes/[id] — 공통 코드 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { label, order, isActive, groupName } = body;

    const updated = await CommonCode.findByIdAndUpdate(
      params.id,
      { $set: { label, order, isActive, groupName } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: '코드를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '공통 코드 수정 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/common-codes/[id] — 공통 코드 삭제
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const deleted = await CommonCode.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: '코드를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '공통 코드가 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '공통 코드 삭제 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
