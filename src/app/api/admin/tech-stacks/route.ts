import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechStack from '@/lib/models/TechStack';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/tech-stacks — 전체 기술 스택 목록 (카테고리 필터)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const query = category ? { category } : {};
    const techStacks = await TechStack.find(query).sort({ category: 1, name: 1 });

    return NextResponse.json({ success: true, data: techStacks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '기술 스택을 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/tech-stacks — 새 기술 스택 추가
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { name, category, logoUrl } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, message: 'name과 category는 필수 항목입니다.' },
        { status: 400 }
      );
    }

    const newStack = await TechStack.create({ name, category, logoUrl });

    return NextResponse.json({ success: true, data: newStack }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: '이미 존재하는 기술 스택 이름입니다.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: '기술 스택 생성 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
