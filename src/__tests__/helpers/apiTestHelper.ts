import { NextRequest } from 'next/server';
import { vi } from 'vitest';

/**
 * NextRequest Mock 객체를 생성합니다.
 *
 * @param url - 요청 URL (예: 'http://localhost:3000/api/wbs/tasks?pid=1')
 * @param options - method, body, headers 등
 * @returns NextRequest 객체
 */
export function createMockNextRequest(
  url: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): NextRequest {
  const { method = 'GET', body, headers = {} } = options || {};

  const init: RequestInit & { signal?: AbortSignal } = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

/**
 * getServerSession을 인증된 상태로 Mock합니다.
 *
 * @param userId - 세션 유저 ID
 * @param memberType - 유저 타입 ('user' | 'admin')
 * @param extra - 추가 user 필드
 */
export function mockAuthenticated(
  userId: string,
  memberType: string = 'user',
  extra?: Record<string, unknown>
) {
  const session = {
    user: {
      _id: userId,
      name: 'TestUser',
      email: 'test@test.com',
      memberType,
      ...extra,
    },
    expires: '2099-12-31T23:59:59.999Z',
  };

  vi.mocked(getServerSessionMock).mockResolvedValue(session);
  return session;
}

/**
 * getServerSession을 미인증 상태로 Mock합니다.
 */
export function mockUnauthenticated() {
  vi.mocked(getServerSessionMock).mockResolvedValue(null);
}

// next-auth mock 참조 — 테스트 파일에서 vi.mock('next-auth') 후 사용
let getServerSessionMock: any;

/**
 * next-auth의 getServerSession mock 참조를 설정합니다.
 * 테스트 파일에서 vi.mock('next-auth') 호출 후 이 함수로 참조를 전달합니다.
 *
 * @param mockFn - vi.mock으로 생성된 getServerSession 함수
 */
export function setGetServerSessionMock(mockFn: any) {
  getServerSessionMock = mockFn;
}
