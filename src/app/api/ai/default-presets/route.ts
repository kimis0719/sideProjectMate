import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiSettings from '@/lib/models/AiSettings';

export const dynamic = 'force-dynamic';

// GET /api/ai/default-presets — 기본 프리셋 목록 (로그인 유저 모두 접근 가능)
async function handleGet(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();
  const settings = await AiSettings.getInstance();

  return NextResponse.json({
    success: true,
    data: settings.defaultPresets || [],
  });
}

export const GET = withApiLogging(handleGet, '/api/ai/default-presets');
