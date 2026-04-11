import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import HarnessCatalog from '@/lib/models/HarnessCatalog';

export const dynamic = 'force-dynamic';

// GET /api/ai/harness-catalog — 하네스 카탈로그 목록 조회 (filesCache 제외)
async function handleGet(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  const catalog = await HarnessCatalog.find(
    {},
    {
      harnessId: 1,
      name: 1,
      domain: 1,
      description: 1,
      tags: 1,
      techStacks: 1,
      agents: 1,
      skills: 1,
      architecturePattern: 1,
    }
  )
    .sort({ harnessId: 1 })
    .lean();

  return NextResponse.json({ success: true, data: catalog });
}

export const GET = withApiLogging(handleGet, '/api/ai/harness-catalog');
