import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommonCodeGroup from '@/lib/models/CommonCodeGroup';
import CommonCode from '@/lib/models/CommonCode';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// PUT /api/admin/common-codes/groups/[id] — 그룹 수정
async function handlePut(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();
  const body = await request.json();
  const { groupName, order, isActive } = body;

  const updated = await CommonCodeGroup.findByIdAndUpdate(
    params.id,
    { $set: { groupName, order, isActive } },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return NextResponse.json(
      { success: false, message: '그룹을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}

// DELETE /api/admin/common-codes/groups/[id] — 그룹 삭제 (하위 코드 없을 때만)
async function handleDelete(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();

  const group = await CommonCodeGroup.findById(params.id);
  if (!group) {
    return NextResponse.json(
      { success: false, message: '그룹을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 하위 코드가 있으면 삭제 불가
  const codeCount = await CommonCode.countDocuments({ group: group.group });
  if (codeCount > 0) {
    return NextResponse.json(
      {
        success: false,
        message: `하위 코드가 ${codeCount}개 있어 삭제할 수 없습니다. 먼저 코드를 삭제해주세요.`,
      },
      { status: 400 }
    );
  }

  await CommonCodeGroup.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true, message: '그룹이 삭제되었습니다.' });
}

export const PUT = withApiLogging(handlePut, '/api/admin/common-codes/groups/[id]');
export const DELETE = withApiLogging(handleDelete, '/api/admin/common-codes/groups/[id]');
