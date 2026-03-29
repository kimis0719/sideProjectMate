import { NextResponse, NextRequest } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiPreset from '@/lib/models/AiPreset';

export const dynamic = 'force-dynamic';

// GET /api/ai/presets?projectId=123 — 프리셋 목록 (글로벌 + 프로젝트별)
async function handleGet(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const query = projectId
      ? { $or: [{ projectId: null }, { projectId: Number(projectId) }] }
      : { projectId: null };

    const presets = await AiPreset.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: presets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `프리셋 조회 실패: ${message}` },
      { status: 500 }
    );
  }
}

// POST /api/ai/presets — 프리셋 생성
async function handlePost(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { projectId, name, roleInstruction, description } = body;

    if (!name || !roleInstruction) {
      return NextResponse.json(
        { success: false, message: 'name과 roleInstruction은 필수입니다.' },
        { status: 400 }
      );
    }

    const preset = await AiPreset.create({
      projectId: projectId ?? null,
      name,
      roleInstruction,
      description: description ?? '',
      createdBy: session.user._id,
    });

    return NextResponse.json({ success: true, data: preset }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `프리셋 생성 실패: ${message}` },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/ai/presets');
export const POST = withApiLogging(handlePost, '/api/ai/presets');
