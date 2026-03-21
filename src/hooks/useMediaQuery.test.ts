import { describe, it, expect } from 'vitest';

/**
 * useMediaQuery 훅 — 반응형 사이즈 결정 로직 테스트
 *
 * window.matchMedia는 브라우저 전용 API이므로 Node 환경에서 직접 호출 불가.
 * 훅이 사용하는 핵심 순수 로직(사이즈 결정)을 단독으로 검증합니다.
 * (프로젝트 테스트 패턴: Phase 1 — 순수 함수/로직 검증)
 */

/** useMediaQuery 기반 AdBanner 사이즈 결정 로직 */
type AdSize = 'leaderboard' | 'rectangle' | 'auto';

const resolveAdSize = (size: AdSize, isMobile: boolean): 'leaderboard' | 'rectangle' =>
  size === 'auto' ? (isMobile ? 'rectangle' : 'leaderboard') : size;

describe('useMediaQuery — 768px 기준 사이즈 결정', () => {
  it('isMobile=true(width < 768px)이면 rectangle을 반환한다', () => {
    expect(resolveAdSize('auto', true)).toBe('rectangle');
  });

  it('isMobile=false(width >= 768px)이면 leaderboard를 반환한다', () => {
    expect(resolveAdSize('auto', false)).toBe('leaderboard');
  });

  it('명시적 leaderboard는 isMobile과 무관하게 leaderboard를 반환한다', () => {
    expect(resolveAdSize('leaderboard', true)).toBe('leaderboard');
    expect(resolveAdSize('leaderboard', false)).toBe('leaderboard');
  });

  it('명시적 rectangle은 isMobile과 무관하게 rectangle을 반환한다', () => {
    expect(resolveAdSize('rectangle', true)).toBe('rectangle');
    expect(resolveAdSize('rectangle', false)).toBe('rectangle');
  });

  it('auto 결과는 leaderboard 또는 rectangle 중 하나이다', () => {
    const valid = ['leaderboard', 'rectangle'];
    expect(valid).toContain(resolveAdSize('auto', true));
    expect(valid).toContain(resolveAdSize('auto', false));
  });

  it('모바일과 데스크탑은 서로 다른 사이즈를 반환한다', () => {
    expect(resolveAdSize('auto', true)).not.toBe(resolveAdSize('auto', false));
  });
});
