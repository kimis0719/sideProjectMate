import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechStack from '@/lib/models/TechStack';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// PUT /api/admin/tech-stacks/[id] — 기술 스택 수정
async function handlePut(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { name, category, logoUrl } = body;

    const updated = await TechStack.findByIdAndUpdate(
      params.id,
      { $set: { name, category, logoUrl } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: '기술 스택을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { success: false, message: '이미 존재하는 기술 스택 이름입니다.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: '기술 스택 수정 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tech-stacks/[id] — 기술 스택 삭제
async function handleDelete(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const deleted = await TechStack.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: '기술 스택을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: '기술 스택이 삭제되었습니다.' });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '기술 스택 삭제 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const PUT = withApiLogging(handlePut, '/api/admin/tech-stacks/[id]');
export const DELETE = withApiLogging(handleDelete, '/api/admin/tech-stacks/[id]');
