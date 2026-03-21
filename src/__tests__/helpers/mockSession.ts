import { vi } from 'vitest';

/**
 * Mock next-auth 세션 객체 생성
 *
 * @param overrides - 기본 세션에 덮어쓸 필드
 * @returns 가짜 next-auth Session 객체
 *
 * 사용 예:
 *   const session = createMockSession({ user: { _id: 'custom-id' } });
 */
export const createMockSession = (overrides?: Record<string, any>) => ({
  user: {
    _id: 'user-alice-001',
    name: 'Alice',
    email: 'alice@example.com',
    image: 'https://example.com/alice.png',
    memberType: 'MEM',
    ...overrides?.user,
  },
  expires: '2099-12-31T23:59:59.999Z',
  ...overrides,
});

/**
 * next-auth의 getServerSession을 Mock하는 헬퍼
 *
 * 사용 예:
 *   mockGetServerSession(createMockSession());
 *   // 또는 미인증 상태
 *   mockGetServerSession(null);
 */
export const mockGetServerSession = (session: ReturnType<typeof createMockSession> | null) => {
  vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve(session)),
  }));
};
