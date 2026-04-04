import { describe, it, expect } from 'vitest';

/**
 * TagInput 단위 테스트
 *
 * React 렌더링 없이 TagInput의 핵심 로직(태그 추가/중복방지/키 핸들링)을 검증합니다.
 */

// TagInput 내부 addTag 로직 재현
const addTag = (value: string[], tag: string, maxTags: number): string[] => {
  const trimmed = tag.trim();
  if (!trimmed || value.includes(trimmed) || value.length >= maxTags) return value;
  return [...value, trimmed];
};

// handleKeyDown에서 태그 추가 트리거 키 판별 로직 재현
const shouldAddTag = (key: string, inputValue: string, allowFreeInput: boolean): boolean => {
  return (
    (key === 'Enter' || (key === 'Tab' && inputValue.trim().length > 0)) &&
    allowFreeInput &&
    inputValue.trim().length > 0
  );
};

describe('TagInput — addTag 로직', () => {
  it('빈 문자열은 추가하지 않는다', () => {
    expect(addTag([], '', 5)).toEqual([]);
    expect(addTag([], '   ', 5)).toEqual([]);
  });

  it('정상 태그를 추가한다', () => {
    expect(addTag([], 'React', 5)).toEqual(['React']);
  });

  it('중복 태그는 추가하지 않는다', () => {
    expect(addTag(['React'], 'React', 5)).toEqual(['React']);
  });

  it('maxTags에 도달하면 추가하지 않는다', () => {
    expect(addTag(['a', 'b', 'c'], 'd', 3)).toEqual(['a', 'b', 'c']);
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(addTag([], '  Python  ', 5)).toEqual(['Python']);
  });
});

describe('TagInput — 키 입력 판별', () => {
  it('Enter 키 + 입력값이 있으면 true', () => {
    expect(shouldAddTag('Enter', 'React', true)).toBe(true);
  });

  it('Tab 키 + 입력값이 있으면 true', () => {
    expect(shouldAddTag('Tab', 'Vue', true)).toBe(true);
  });

  it('Tab 키 + 입력값이 비어있으면 false (기본 탭 동작 유지)', () => {
    expect(shouldAddTag('Tab', '', true)).toBe(false);
    expect(shouldAddTag('Tab', '   ', true)).toBe(false);
  });

  it('다른 키는 false', () => {
    expect(shouldAddTag('a', 'React', true)).toBe(false);
    expect(shouldAddTag('Escape', 'React', true)).toBe(false);
  });

  it('allowFreeInput이 false면 항상 false', () => {
    expect(shouldAddTag('Enter', 'React', false)).toBe(false);
    expect(shouldAddTag('Tab', 'React', false)).toBe(false);
  });
});

/**
 * 위자드 step canProceed 로직 테스트
 */
const canProceed = (
  step: number,
  data: {
    title: string;
    problemStatement: string;
    currentStage: string;
    executionStyle: string;
    weeklyHours: number;
  }
): boolean => {
  if (step === 1) return data.title.trim().length > 0 && data.problemStatement.trim().length > 0;
  if (step === 2) return !!data.currentStage && !!data.executionStyle && data.weeklyHours > 0;
  return true;
};

describe('NewProject 위자드 — canProceed 로직', () => {
  it('Step 1: 제목과 동기 모두 입력해야 통과', () => {
    expect(
      canProceed(1, {
        title: '',
        problemStatement: '',
        currentStage: '',
        executionStyle: '',
        weeklyHours: 0,
      })
    ).toBe(false);
    expect(
      canProceed(1, {
        title: '테스트',
        problemStatement: '',
        currentStage: '',
        executionStyle: '',
        weeklyHours: 0,
      })
    ).toBe(false);
    expect(
      canProceed(1, {
        title: '테스트',
        problemStatement: '동기',
        currentStage: '',
        executionStyle: '',
        weeklyHours: 0,
      })
    ).toBe(true);
  });

  it('Step 2: 단계, 실행방식, 주당시간 모두 필요', () => {
    expect(
      canProceed(2, {
        title: 't',
        problemStatement: 'p',
        currentStage: '',
        executionStyle: '',
        weeklyHours: 0,
      })
    ).toBe(false);
    expect(
      canProceed(2, {
        title: 't',
        problemStatement: 'p',
        currentStage: 'idea',
        executionStyle: 'balanced',
        weeklyHours: 0,
      })
    ).toBe(false);
    expect(
      canProceed(2, {
        title: 't',
        problemStatement: 'p',
        currentStage: 'idea',
        executionStyle: 'balanced',
        weeklyHours: 10,
      })
    ).toBe(true);
  });

  it('Step 3, 4: 항상 통과', () => {
    expect(
      canProceed(3, {
        title: '',
        problemStatement: '',
        currentStage: '',
        executionStyle: '',
        weeklyHours: 0,
      })
    ).toBe(true);
    expect(
      canProceed(4, {
        title: '',
        problemStatement: '',
        currentStage: '',
        executionStyle: '',
        weeklyHours: 0,
      })
    ).toBe(true);
  });
});
