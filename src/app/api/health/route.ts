import { NextResponse } from 'next/server';
import { getApiStats } from '@/lib/apiStats';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * API 성능 모니터링 대시보드
 * 서버 메모리에 누적된 API 응답시간 통계를 반환합니다.
 * 서버 재시작 시 리셋됩니다.
 */
export async function GET() {
  const stats = getApiStats();

  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      uptime: stats.uptime,
      totalRequests: stats.totalRequests,
      slowCount: stats.slowCount,
      routes: stats.routes,
    },
  });
}
