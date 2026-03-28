import { describe, it, expect } from 'vitest';
import { getIconSlug, getSkillCategory, CATEGORY_ORDER } from './iconUtils';

// ═══════════════════════════════════════════════════════════════════════════════
describe('getIconSlug', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('명시적 매핑 변환', () => {
    it("'C++'을 'cpp'로 변환한다", () => {
      expect(getIconSlug('C++')).toBe('cpp');
    });

    it("'c#'을 'cs'로 변환한다", () => {
      expect(getIconSlug('c#')).toBe('cs');
    });

    it("'Vue.js'를 'vue'로 변환한다", () => {
      expect(getIconSlug('Vue.js')).toBe('vue');
    });

    it("'Next.js'를 'nextjs'로 변환한다", () => {
      expect(getIconSlug('Next.js')).toBe('nextjs');
    });

    it("'nextjs'를 'nextjs'로 변환한다 (self-mapping)", () => {
      expect(getIconSlug('nextjs')).toBe('nextjs');
    });

    it("'React Native'를 'react'로 변환한다", () => {
      expect(getIconSlug('React Native')).toBe('react');
    });

    it("'Spring Boot'를 'spring'으로 변환한다", () => {
      expect(getIconSlug('Spring Boot')).toBe('spring');
    });

    it("'Node.js'를 'nodejs'로 변환한다", () => {
      expect(getIconSlug('Node.js')).toBe('nodejs');
    });

    it("'Socket.io'는 아이콘이 없어 'nodejs'로 대체된다", () => {
      expect(getIconSlug('Socket.io')).toBe('nodejs');
    });

    it("'html5'를 'html'로 변환한다", () => {
      expect(getIconSlug('html5')).toBe('html');
    });

    it("'css3'를 'css'로 변환한다", () => {
      expect(getIconSlug('css3')).toBe('css');
    });

    it("'TailwindCSS'를 'tailwind'로 변환한다", () => {
      expect(getIconSlug('TailwindCSS')).toBe('tailwind');
    });

    it("'Tailwind CSS'(공백 포함)를 'tailwind'로 변환한다", () => {
      expect(getIconSlug('Tailwind CSS')).toBe('tailwind');
    });

    it("'postgres'를 'postgresql'로 변환한다", () => {
      expect(getIconSlug('postgres')).toBe('postgresql');
    });

    it("'mongoose'를 'mongodb'로 변환한다", () => {
      expect(getIconSlug('mongoose')).toBe('mongodb');
    });

    it("'mongo'를 'mongodb'로 변환한다", () => {
      expect(getIconSlug('mongo')).toBe('mongodb');
    });
  });

  describe('대소문자 무시', () => {
    it('입력이 대문자여도 올바른 슬러그를 반환한다 (C++)', () => {
      expect(getIconSlug('C++')).toBe('cpp');
    });

    it('매핑 키는 lowercase로 비교하므로 대소문자 혼용을 허용한다', () => {
      expect(getIconSlug('NEXT.JS')).toBe('nextjs');
    });
  });

  describe('fallback 동작 (매핑에 없는 이름)', () => {
    it('매핑에 없는 이름은 공백과 점을 제거한 소문자로 반환한다', () => {
      // 'React' → 'react' (공백/점 없음, 소문자화)
      expect(getIconSlug('React')).toBe('react');
    });

    it('공백이 포함된 미매핑 이름은 공백 제거 후 반환한다', () => {
      // 'Unknown Tech' → 'unknowntech'
      expect(getIconSlug('Unknown Tech')).toBe('unknowntech');
    });

    it('점이 포함된 미매핑 이름은 점 제거 후 반환한다', () => {
      // 'some.lib' → 'somelib'
      expect(getIconSlug('some.lib')).toBe('somelib');
    });

    it('완전히 알 수 없는 이름은 소문자로 반환한다', () => {
      expect(getIconSlug('Docker')).toBe('docker');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('getSkillCategory', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('Languages 분류', () => {
    it("'JavaScript'를 'Languages'로 분류한다", () => {
      expect(getSkillCategory('JavaScript')).toBe('Languages');
    });

    it("'TypeScript'를 'Languages'로 분류한다", () => {
      expect(getSkillCategory('TypeScript')).toBe('Languages');
    });

    it("'Python'을 'Languages'로 분류한다", () => {
      expect(getSkillCategory('Python')).toBe('Languages');
    });

    it("'C#'을 'Languages'로 분류한다 (# 유지)", () => {
      expect(getSkillCategory('C#')).toBe('Languages');
    });

    it("'Kotlin'을 'Languages'로 분류한다", () => {
      expect(getSkillCategory('Kotlin')).toBe('Languages');
    });
  });

  describe('Frameworks & Libs 분류', () => {
    it("'React'를 'Frameworks & Libs'로 분류한다", () => {
      expect(getSkillCategory('React')).toBe('Frameworks & Libs');
    });

    it("'Next.js'를 'Frameworks & Libs'로 분류한다 (점 제거 → nextjs)", () => {
      expect(getSkillCategory('Next.js')).toBe('Frameworks & Libs');
    });

    it("'React Native'를 'Frameworks & Libs'로 분류한다 (공백 제거)", () => {
      expect(getSkillCategory('React Native')).toBe('Frameworks & Libs');
    });

    it("'Spring Boot'를 'Frameworks & Libs'로 분류한다", () => {
      expect(getSkillCategory('Spring Boot')).toBe('Frameworks & Libs');
    });

    it("'Vue'를 'Frameworks & Libs'로 분류한다", () => {
      expect(getSkillCategory('Vue')).toBe('Frameworks & Libs');
    });
  });

  describe('Tools & Infra 분류', () => {
    it("'Docker'를 'Tools & Infra'로 분류한다", () => {
      expect(getSkillCategory('Docker')).toBe('Tools & Infra');
    });

    it("'GitHub'를 'Tools & Infra'로 분류한다", () => {
      expect(getSkillCategory('GitHub')).toBe('Tools & Infra');
    });

    it("'AWS'를 'Tools & Infra'로 분류한다", () => {
      expect(getSkillCategory('AWS')).toBe('Tools & Infra');
    });
  });

  describe('Database 분류', () => {
    it("'MongoDB'를 'Database'로 분류한다", () => {
      expect(getSkillCategory('MongoDB')).toBe('Database');
    });

    it("'PostgreSQL'을 'Database'로 분류한다", () => {
      expect(getSkillCategory('PostgreSQL')).toBe('Database');
    });

    it("'MySQL'을 'Database'로 분류한다", () => {
      expect(getSkillCategory('MySQL')).toBe('Database');
    });
  });

  describe('Other 분류 (매핑 없음)', () => {
    it('완전히 알 수 없는 기술은 Other로 분류한다', () => {
      expect(getSkillCategory('UnknownTech9999')).toBe('Other');
    });

    it("'Node.js'는 카테고리 목록에 없어 Other로 분류된다", () => {
      // 'Node.js' → 'nodejs' → languages/frameworks/tools/databases 모두 없음
      expect(getSkillCategory('Node.js')).toBe('Other');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('CATEGORY_ORDER', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('5개의 카테고리 순서를 정의한다', () => {
    expect(CATEGORY_ORDER).toHaveLength(5);
  });

  it("'Languages'가 첫 번째이다", () => {
    expect(CATEGORY_ORDER[0]).toBe('Languages');
  });

  it("'Other'가 마지막이다", () => {
    expect(CATEGORY_ORDER.at(-1)).toBe('Other');
  });
});
