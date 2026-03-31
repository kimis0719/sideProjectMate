import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommonCodeGroup from '@/lib/models/CommonCodeGroup';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/common-codes/groups — 전체 그룹 목록
async function handleGet() {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();
  const groups = await CommonCodeGroup.find().sort({ order: 1 }).lean();
  return NextResponse.json({ success: true, data: groups });
}

// POST /api/admin/common-codes/groups — 신규 그룹 생성
async function handlePost(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();
  const { group, groupName, order, isActive } = await request.json();

  if (!group || !groupName) {
    return NextResponse.json(
      { success: false, message: 'group과 groupName은 필수입니다.' },
      { status: 400 }
    );
  }

  const existing = await CommonCodeGroup.findOne({ group });
  if (existing) {
    return NextResponse.json(
      { success: false, message: '이미 존재하는 그룹 코드입니다.' },
      { status: 409 }
    );
  }

  const created = await CommonCodeGroup.create({
    group,
    groupName,
    order: order ?? 0,
    isActive: isActive ?? true,
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}

export const GET = withApiLogging(handleGet, '/api/admin/common-codes/groups');
export const POST = withApiLogging(handlePost, '/api/admin/common-codes/groups');
