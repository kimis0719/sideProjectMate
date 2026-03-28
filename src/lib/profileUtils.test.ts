import { describe, it, expect } from 'vitest';
import { calculateProfileCompleteness } from './profileUtils';
import {
  emptyProfile,
  fullProfile,
  avatarOnlyProfile,
  shortIntroProfile,
} from '@/__tests__/fixtures/users';

// ═══════════════════════════════════════════════════════════════════════════════
describe('calculateProfileCompleteness', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('전체 케이스', () => {
    it('빈 프로필의 완성도는 0이다', () => {
      expect(calculateProfileCompleteness(emptyProfile)).toBe(0);
    });

    it('모든 항목을 채운 프로필의 완성도는 100이다', () => {
      expect(calculateProfileCompleteness(fullProfile)).toBe(100);
    });
  });

  describe('Basic Info (30점)', () => {
    it('아바타 URL이 있으면 15점을 부여한다', () => {
      expect(calculateProfileCompleteness(avatarOnlyProfile)).toBe(15);
    });

    it('아바타 URL이 없으면 0점이다', () => {
      expect(calculateProfileCompleteness({ avatarUrl: '' })).toBe(0);
    });

    it('position이 있으면 10점을 부여한다', () => {
      expect(calculateProfileCompleteness({ position: '개발자' })).toBe(10);
    });

    it('position이 빈 문자열이면 0점이다', () => {
      expect(calculateProfileCompleteness({ position: '' })).toBe(0);
    });

    it('career가 있으면 5점을 부여한다', () => {
      expect(calculateProfileCompleteness({ career: '3년차' })).toBe(5);
    });

    it('career가 빈 문자열이면 0점이다', () => {
      expect(calculateProfileCompleteness({ career: '' })).toBe(0);
    });

    it('아바타 + position + career 합산 30점이다', () => {
      expect(
        calculateProfileCompleteness({
          avatarUrl: 'https://example.com/a.png',
          position: '개발자',
          career: '3년차',
        })
      ).toBe(30);
    });
  });

  describe('Content (40점)', () => {
    it('소개글이 10자 초과이면 20점을 부여한다', () => {
      // 정확히 11자 → > 10 만족
      expect(calculateProfileCompleteness({ introduction: '12345678901' })).toBe(20);
    });

    it('소개글이 정확히 10자이면 점수를 부여하지 않는다 (> 10 기준)', () => {
      expect(calculateProfileCompleteness({ introduction: '1234567890' })).toBe(0);
    });

    it('소개글이 10자 미만이면 점수를 부여하지 않는다', () => {
      expect(calculateProfileCompleteness(shortIntroProfile)).toBe(15); // avatarUrl만 15점
    });

    it('소개글이 없으면 0점이다', () => {
      expect(calculateProfileCompleteness({ introduction: '' })).toBe(0);
    });

    it('techTags가 1개 이상이면 20점을 부여한다', () => {
      expect(calculateProfileCompleteness({ techTags: ['React'] })).toBe(20);
    });

    it('techTags가 빈 배열이면 0점이다', () => {
      expect(calculateProfileCompleteness({ techTags: [] })).toBe(0);
    });

    it('소개글(20) + techTags(20) 합산 40점이다', () => {
      expect(
        calculateProfileCompleteness({
          introduction: '10자를 초과하는 소개글입니다.',
          techTags: ['React', 'TypeScript'],
        })
      ).toBe(40);
    });
  });

  describe('Activity & Links (30점)', () => {
    it('socialLinks.github가 있으면 소셜 15점을 부여한다', () => {
      expect(
        calculateProfileCompleteness({
          socialLinks: { github: 'https://github.com/user' },
        })
      ).toBe(15);
    });

    it('socialLinks.blog가 있으면 소셜 15점을 부여한다', () => {
      expect(
        calculateProfileCompleteness({
          socialLinks: { blog: 'https://velog.io/@user' },
        })
      ).toBe(15);
    });

    it('socialLinks.solvedAc가 있으면 소셜 15점을 부여한다', () => {
      expect(
        calculateProfileCompleteness({
          socialLinks: { solvedAc: 'username' },
        })
      ).toBe(15);
    });

    it('portfolioLinks가 있으면 소셜 15점을 부여한다', () => {
      expect(
        calculateProfileCompleteness({
          portfolioLinks: ['https://portfolio.com'],
        })
      ).toBe(15);
    });

    it('소셜 링크가 하나도 없으면 0점이다', () => {
      expect(
        calculateProfileCompleteness({
          socialLinks: {},
          portfolioLinks: [],
        })
      ).toBe(0);
    });

    it('소셜 링크가 여러 개여도 15점이 최대이다 (중복 부여 없음)', () => {
      expect(
        calculateProfileCompleteness({
          socialLinks: {
            github: 'https://github.com/user',
            blog: 'https://velog.io/@user',
            solvedAc: 'user',
          },
          portfolioLinks: ['https://portfolio.com'],
        })
      ).toBe(15); // 여러 개여도 15점 한 번
    });

    it('schedule이 있으면 15점을 부여한다', () => {
      expect(
        calculateProfileCompleteness({
          schedule: [new Date('2024-01-01')],
        })
      ).toBe(15);
    });

    it('schedule이 빈 배열이면 0점이다', () => {
      expect(calculateProfileCompleteness({ schedule: [] })).toBe(0);
    });

    it('소셜(15) + schedule(15) 합산 30점이다', () => {
      expect(
        calculateProfileCompleteness({
          socialLinks: { github: 'https://github.com/user' },
          schedule: [new Date('2024-01-01')],
        })
      ).toBe(30);
    });
  });

  describe('최대값 제한', () => {
    it('반환값은 100을 초과하지 않는다', () => {
      const result = calculateProfileCompleteness(fullProfile);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('반환값은 항상 0 이상이다', () => {
      expect(calculateProfileCompleteness(emptyProfile)).toBeGreaterThanOrEqual(0);
    });
  });
});
