/**
 * API 응답시간 메모리 집계 모듈
 * 서버 프로세스가 살아있는 동안 모든 API 호출을 누적 집계합니다.
 * 서버 재시작 시 리셋됩니다.
 */

interface RouteStat {
  count: number;
  totalMs: number;
  maxMs: number;
  slowCount: number; // 500ms 초과 횟수
}

const SLOW_THRESHOLD_MS = 500;

// 서버 프로세스 메모리에 유지되는 집계 데이터
const stats = new Map<string, RouteStat>();
const serverStartTime = Date.now();
let totalRequests = 0;

export function recordApiCall(routeName: string, method: string, durationMs: number) {
  const key = `${method} ${routeName}`;
  totalRequests++;

  const existing = stats.get(key) || { count: 0, totalMs: 0, maxMs: 0, slowCount: 0 };
  existing.count++;
  existing.totalMs += durationMs;
  if (durationMs > existing.maxMs) existing.maxMs = durationMs;
  if (durationMs > SLOW_THRESHOLD_MS) existing.slowCount++;

  stats.set(key, existing);
}

export function getApiStats() {
  const routes = Array.from(stats.entries())
    .map(([route, stat]) => ({
      route,
      avgMs: Math.round(stat.totalMs / stat.count),
      maxMs: Math.round(stat.maxMs),
      count: stat.count,
      slowCount: stat.slowCount,
    }))
    .sort((a, b) => b.avgMs - a.avgMs); // 느린 순서대로 정렬

  const uptimeMs = Date.now() - serverStartTime;
  const uptimeMinutes = Math.floor(uptimeMs / 60000);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const remainingMinutes = uptimeMinutes % 60;

  return {
    uptime: uptimeHours > 0 ? `${uptimeHours}시간 ${remainingMinutes}분` : `${uptimeMinutes}분`,
    totalRequests,
    slowCount: routes.reduce((sum, r) => sum + r.slowCount, 0),
    routes,
  };
}
