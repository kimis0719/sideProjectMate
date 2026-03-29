import { NextResponse } from 'next/server';
import { recordApiCall } from '@/lib/apiStats';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiHandler = (...args: any[]) => Promise<NextResponse>;

/**
 * API Route 래퍼 — 응답시간 측정 + Server-Timing 헤더 삽입 + 메모리 집계
 * 500ms 초과 시 [SLOW API] 경고 로그 출력
 *
 * 환경변수 API_LOGGING=false 로 비활성화 가능 (기본값: 활성화)
 */
export function withApiLogging<T extends ApiHandler>(handler: T, routeName: string): T {
  const wrapped = async (...args: Parameters<T>): Promise<NextResponse> => {
    // 비활성화 시 원본 핸들러를 바로 실행
    if (process.env.API_LOGGING === 'false') {
      return handler(...args);
    }

    const request = args[0] as Request;
    const method = request?.method || 'UNKNOWN';
    const start = performance.now();
    try {
      const response = await handler(...args);
      const duration = performance.now() - start;

      recordApiCall(routeName, method, duration);

      // eslint-disable-next-line no-console
      if (duration > 500) {
        console.warn(`[SLOW API] ${method} ${routeName} — ${duration.toFixed(0)}ms`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[API] ${method} ${routeName} — ${duration.toFixed(0)}ms`);
      }

      response.headers.set('Server-Timing', `api;dur=${duration.toFixed(0)}`);
      return response;
    } catch (error) {
      const duration = performance.now() - start;
      recordApiCall(routeName, method, duration);
      // eslint-disable-next-line no-console
      console.error(`[API ERROR] ${method} ${routeName} — ${duration.toFixed(0)}ms`, error);
      throw error;
    }
  };
  return wrapped as T;
}
