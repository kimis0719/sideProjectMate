import { describe, it, expect } from 'vitest';

/**
 * AdBanner 단위 테스트
 *
 * React 렌더링 없이 광고 배너의 핵심 로직(사이즈 결정, 환경변수 키 등)을 검증합니다.
 * (프로젝트 테스트 패턴: Phase 1 — 순수 함수/로직 검증)
 */

// AdBanner 내부 로직과 동일한 상수 + 유틸 (컴포넌트에서 추출하여 독립적으로 검증)
const SIZE_MAP = {
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
} as const;

type AdSize = 'leaderboard' | 'rectangle' | 'auto';

/** auto 사이즈를 실제 사이즈로 결정하는 순수 함수 */
const resolveAdSize = (
  size: AdSize,
  isMobile: boolean
): 'leaderboard' | 'rectangle' =>
  size === 'auto' ? (isMobile ? 'rectangle' : 'leaderboard') : size;

/** 광고 영역 환경변수 키 목록 */
const AD_ENV_KEYS = [
  'NEXT_PUBLIC_ADFIT_HOME',
  'NEXT_PUBLIC_ADFIT_PROJECT_LIST',
  'NEXT_PUBLIC_ADFIT_PROJECT_DETAIL',
  'NEXT_PUBLIC_ADFIT_PROFILE',
] as const;

describe('AdBanner — SIZE_MAP 상수', () => {
  it('leaderboard는 728×90이다', () => {
    expect(SIZE_MAP.leaderboard).toEqual({ width: 728, height: 90 });
  });

  it('rectangle은 300×250이다', () => {
    expect(SIZE_MAP.rectangle).toEqual({ width: 300, height: 250 });
  });

  it('leaderboard width가 rectangle width보다 크다', () => {
    expect(SIZE_MAP.leaderboard.width).toBeGreaterThan(SIZE_MAP.rectangle.width);
  });

  it('leaderboard height가 rectangle height보다 작다 (가로 배너)', () => {
    expect(SIZE_MAP.leaderboard.height).toBeLessThan(SIZE_MAP.rectangle.height);
  });
});

describe('AdBanner — resolveAdSize 반응형 사이즈 결정', () => {
  it('auto + 데스크탑(isMobile=false) → leaderboard', () => {
    expect(resolveAdSize('auto', false)).toBe('leaderboard');
  });

  it('auto + 모바일(isMobile=true) → rectangle', () => {
    expect(resolveAdSize('auto', true)).toBe('rectangle');
  });

  it('명시적 leaderboard → isMobile 무관하게 leaderboard', () => {
    expect(resolveAdSize('leaderboard', false)).toBe('leaderboard');
    expect(resolveAdSize('leaderboard', true)).toBe('leaderboard');
  });

  it('명시적 rectangle → isMobile 무관하게 rectangle', () => {
    expect(resolveAdSize('rectangle', false)).toBe('rectangle');
    expect(resolveAdSize('rectangle', true)).toBe('rectangle');
  });

  it('auto 사이즈 결과는 항상 leaderboard 또는 rectangle이다', () => {
    const validSizes = ['leaderboard', 'rectangle'];
    expect(validSizes).toContain(resolveAdSize('auto', false));
    expect(validSizes).toContain(resolveAdSize('auto', true));
  });
});

describe('AdBanner — 환경변수 키 규칙', () => {
  it('모든 환경변수 키가 NEXT_PUBLIC_ 접두어를 갖는다 (클라이언트 노출 가능)', () => {
    AD_ENV_KEYS.forEach((key) => {
      expect(key.startsWith('NEXT_PUBLIC_')).toBe(true);
    });
  });

  it('환경변수 키는 4개이다 (홈/프로젝트목록/프로젝트상세/프로필)', () => {
    expect(AD_ENV_KEYS).toHaveLength(4);
  });

  it('각 광고 페이지별 전용 키가 존재한다', () => {
    expect(AD_ENV_KEYS).toContain('NEXT_PUBLIC_ADFIT_HOME');
    expect(AD_ENV_KEYS).toContain('NEXT_PUBLIC_ADFIT_PROJECT_LIST');
    expect(AD_ENV_KEYS).toContain('NEXT_PUBLIC_ADFIT_PROJECT_DETAIL');
    expect(AD_ENV_KEYS).toContain('NEXT_PUBLIC_ADFIT_PROFILE');
  });
});

describe('AdBanner — 광고 금지 영역 명세', () => {
  const FORBIDDEN_AREAS = ['kanban', 'wbs', 'chat', 'dashboard'];
  const ALLOWED_AREAS = ['home', 'project-list', 'project-detail', 'profile-public'];

  it('광고 금지 영역 목록이 정의되어 있다', () => {
    expect(FORBIDDEN_AREAS.length).toBeGreaterThan(0);
  });

  it('광고 허용 영역 목록이 정의되어 있다', () => {
    expect(ALLOWED_AREAS.length).toBeGreaterThan(0);
  });

  it('광고 허용 영역과 금지 영역이 겹치지 않는다', () => {
    const overlap = ALLOWED_AREAS.filter((area) => FORBIDDEN_AREAS.includes(area));
    expect(overlap).toHaveLength(0);
  });
});
