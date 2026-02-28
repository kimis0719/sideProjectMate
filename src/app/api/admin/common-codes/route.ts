import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommonCode from '@/lib/models/CommonCode';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/common-codes — 전체 공통 코드 목록 (그룹별 조회 가능)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    const query = group ? { group } : {};
    const codes = await CommonCode.find(query).sort({ group: 1, order: 1 });

    return NextResponse.json({ success: true, data: codes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '공통 코드를 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/common-codes — 새 공통 코드 추가
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { group, groupName, code, label, order, isActive } = body;

    if (!group || !groupName || !code || !label) {
      return NextResponse.json(
        { success: false, message: 'group, groupName, code, label은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    const newCode = await CommonCode.create({
      group,
      groupName,
      code,
      label,
      order: order ?? 0,
      isActive: isActive ?? true,
    });

    return NextResponse.json({ success: true, data: newCode }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: '동일한 그룹에 같은 코드가 이미 존재합니다.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: '공통 코드 생성 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
