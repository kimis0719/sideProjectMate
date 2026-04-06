import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommonCode from '@/lib/models/CommonCode';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// PUT /api/admin/common-codes/[id] — 공통 코드 수정
async function handlePut(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { code, label, order, isActive, groupName } = body;

    const updated = await CommonCode.findByIdAndUpdate(
      params.id,
      { $set: { code, label, order, isActive, groupName } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: '코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '공통 코드 수정 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/common-codes/[id] — 공통 코드 삭제
async function handleDelete(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const deleted = await CommonCode.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: '코드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '공통 코드가 삭제되었습니다.' });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '공통 코드 삭제 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const PUT = withApiLogging(handlePut, '/api/admin/common-codes/[id]');
export const DELETE = withApiLogging(handleDelete, '/api/admin/common-codes/[id]');
