import { NextResponse, NextRequest } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiPreset from '@/lib/models/AiPreset';

export const dynamic = 'force-dynamic';

// PATCH /api/ai/presets/[id] — 프리셋 수정
async function handlePatch(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { name, roleInstruction, description } = body;

    const preset = await AiPreset.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name }),
        ...(roleInstruction && { roleInstruction }),
        ...(description !== undefined && { description }),
      },
      { new: true }
    );

    if (!preset) {
      return NextResponse.json(
        { success: false, message: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: preset });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `프리셋 수정 실패: ${message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/presets/[id] — 프리셋 삭제
async function handleDelete(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const preset = await AiPreset.findByIdAndDelete(params.id);

    if (!preset) {
      return NextResponse.json(
        { success: false, message: '프리셋을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `프리셋 삭제 실패: ${message}` },
      { status: 500 }
    );
  }
}

export const PATCH = withApiLogging(handlePatch, '/api/ai/presets/[id]');
export const DELETE = withApiLogging(handleDelete, '/api/ai/presets/[id]');
