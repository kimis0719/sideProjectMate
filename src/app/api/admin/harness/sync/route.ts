import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';
import dbConnect from '@/lib/mongodb';
import { syncHarnessCatalog } from '@/lib/utils/harness/syncFromGithub';

export const dynamic = 'force-dynamic';

// POST /api/admin/harness/sync — GitHub에서 harness-100 카탈로그 동기화
async function handlePost(_request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();

  const result = await syncHarnessCatalog();

  return NextResponse.json({
    success: true,
    data: {
      synced: result.synced,
      errors: result.errors,
      message: `${result.synced}개 하네스 동기화 완료${result.errors.length > 0 ? `, ${result.errors.length}개 오류` : ''}`,
    },
  });
}

export const POST = withApiLogging(handlePost, '/api/admin/harness/sync');
