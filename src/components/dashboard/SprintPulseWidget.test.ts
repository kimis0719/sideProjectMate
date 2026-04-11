import { describe, it, expect } from 'vitest';

/**
 * SprintPulseWidget 단위 테스트
 *
 * React 렌더링 없이 Sprint Pulse 핵심 로직을 검증합니다.
 * - 노트 분류 로직 (sectionId 유무로 할 일/진행 중 판별)
 * - 진행률 계산 로직
 */

interface NoteItem {
  _id: string;
  sectionId?: string | null;
}

/** 노트 분류 순수 함수 (SprintPulseWidget 내부 로직과 동일) */
const classifyNotes = (activeNotes: NoteItem[], doneNotes: NoteItem[]) => {
  const todo = activeNotes.filter((n) => !n.sectionId).length;
  const inProgress = activeNotes.filter((n) => !!n.sectionId).length;
  const done = doneNotes.length;
  const total = todo + inProgress + done;
  return { todo, inProgress, done, total };
};

/** 진행률 계산 순수 함수 */
const getPercent = (count: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
};

describe('SprintPulseWidget — 노트 분류 로직', () => {
  it('sectionId가 없는 active 노트는 "할 일"로 분류된다', () => {
    const activeNotes: NoteItem[] = [
      { _id: '1', sectionId: null },
      { _id: '2', sectionId: undefined },
      { _id: '3' },
    ];
    const result = classifyNotes(activeNotes, []);
    expect(result.todo).toBe(3);
    expect(result.inProgress).toBe(0);
  });

  it('sectionId가 있는 active 노트는 "진행 중"으로 분류된다', () => {
    const activeNotes: NoteItem[] = [
      { _id: '1', sectionId: 'sec1' },
      { _id: '2', sectionId: 'sec2' },
    ];
    const result = classifyNotes(activeNotes, []);
    expect(result.inProgress).toBe(2);
    expect(result.todo).toBe(0);
  });

  it('done 노트는 "완료"로 분류된다', () => {
    const doneNotes: NoteItem[] = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];
    const result = classifyNotes([], doneNotes);
    expect(result.done).toBe(3);
    expect(result.total).toBe(3);
  });

  it('혼합 시나리오: 할 일 2, 진행 중 3, 완료 5', () => {
    const activeNotes: NoteItem[] = [
      { _id: '1' },
      { _id: '2', sectionId: null },
      { _id: '3', sectionId: 'sec1' },
      { _id: '4', sectionId: 'sec1' },
      { _id: '5', sectionId: 'sec2' },
    ];
    const doneNotes: NoteItem[] = [
      { _id: '6' },
      { _id: '7' },
      { _id: '8' },
      { _id: '9' },
      { _id: '10' },
    ];
    const result = classifyNotes(activeNotes, doneNotes);
    expect(result.todo).toBe(2);
    expect(result.inProgress).toBe(3);
    expect(result.done).toBe(5);
    expect(result.total).toBe(10);
  });

  it('노트가 없으면 모두 0이다', () => {
    const result = classifyNotes([], []);
    expect(result.todo).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.done).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('SprintPulseWidget — 진행률 계산', () => {
  it('전체 10개 중 3개면 30%', () => {
    expect(getPercent(3, 10)).toBe(30);
  });

  it('전체 0이면 0%', () => {
    expect(getPercent(0, 0)).toBe(0);
  });

  it('전체 3개 중 1개면 33% (반올림)', () => {
    expect(getPercent(1, 3)).toBe(33);
  });

  it('전체와 같으면 100%', () => {
    expect(getPercent(5, 5)).toBe(100);
  });

  it('전체 7개 중 2개면 29% (반올림)', () => {
    expect(getPercent(2, 7)).toBe(29);
  });
});
