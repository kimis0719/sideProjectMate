import { describe, it, expect } from 'vitest';
import {
  isDateRangeOverlap,
  getOverlapRange,
  checkScheduleConflict,
  calculateTaskDuration,
  generateAdjustmentSuggestions,
  checkAllScheduleConflicts,
  calculateConflictSeverity,
  type ConflictTask,
  type ScheduleConflict,
} from './scheduleConflict';
import {
  ASSIGNEES,
  conflictingTasks,
  nonConflictingTasks,
  differentAssigneeTasks,
  exactSameDateTasks,
  oneDayTasks,
  mixedAssigneeTasks,
} from '@/__tests__/fixtures/tasks';

// ─── 테스트 헬퍼 ──────────────────────────────────────────────────────────────
const d = (dateStr: string) => new Date(dateStr);

/** calculateConflictSeverity 테스트용 ScheduleConflict 생성 헬퍼 */
const makeConflict = (overlapDays: number, taskCount: number): ScheduleConflict => ({
  conflictingTasks: Array.from({ length: taskCount }, (_, i) => ({
    id: `mock-task-${i}`,
    title: `작업 ${i + 1}`,
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    assignee: ASSIGNEES.alice,
  })),
  overlapDays,
  overlapStart: d('2024-01-01'),
  overlapEnd: d('2024-01-10'),
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('isDateRangeOverlap', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('날짜가 겹치면 true를 반환한다', () => {
    // 1/1~1/10 과 1/5~1/15 → 5일 겹침
    expect(isDateRangeOverlap(d('2024-01-01'), d('2024-01-10'), d('2024-01-05'), d('2024-01-15'))).toBe(true);
  });

  it('날짜가 겹치지 않으면 false를 반환한다', () => {
    // 1/1~1/10 과 1/11~1/20 → 겹침 없음
    expect(isDateRangeOverlap(d('2024-01-01'), d('2024-01-10'), d('2024-01-11'), d('2024-01-20'))).toBe(false);
  });

  it('경계값: end1 === start2이면 겹치는 것으로 판단한다', () => {
    // 1/1~1/10 과 1/10~1/20 → 1/10이 경계에서 일치 → true
    expect(isDateRangeOverlap(d('2024-01-01'), d('2024-01-10'), d('2024-01-10'), d('2024-01-20'))).toBe(true);
  });

  it('경계값: end1 < start2이면 겹치지 않는다', () => {
    // 1/1~1/9 와 1/10~1/20 → false
    expect(isDateRangeOverlap(d('2024-01-01'), d('2024-01-09'), d('2024-01-10'), d('2024-01-20'))).toBe(false);
  });

  it('정확히 같은 날짜 범위는 겹친다', () => {
    expect(isDateRangeOverlap(d('2024-01-01'), d('2024-01-10'), d('2024-01-01'), d('2024-01-10'))).toBe(true);
  });

  it('하루짜리 작업 두 개가 같은 날이면 겹친다', () => {
    expect(isDateRangeOverlap(d('2024-01-05'), d('2024-01-05'), d('2024-01-05'), d('2024-01-05'))).toBe(true);
  });

  it('하루짜리 작업 두 개가 다른 날이면 겹치지 않는다', () => {
    expect(isDateRangeOverlap(d('2024-01-05'), d('2024-01-05'), d('2024-01-06'), d('2024-01-06'))).toBe(false);
  });

  it('한 범위가 다른 범위를 완전히 포함하면 겹친다', () => {
    // 1/1~1/20이 1/5~1/10을 완전히 포함
    expect(isDateRangeOverlap(d('2024-01-01'), d('2024-01-20'), d('2024-01-05'), d('2024-01-10'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('getOverlapRange', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('겹치지 않는 범위는 null을 반환한다', () => {
    const result = getOverlapRange(d('2024-01-01'), d('2024-01-10'), d('2024-01-11'), d('2024-01-20'));
    expect(result).toBeNull();
  });

  it('겹치는 범위의 시작일을 올바르게 반환한다', () => {
    // 1/1~1/10 과 1/8~1/15 → 겹침 1/8~1/10
    const result = getOverlapRange(d('2024-01-01'), d('2024-01-10'), d('2024-01-08'), d('2024-01-15'));
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(d('2024-01-08'));
  });

  it('겹치는 범위의 종료일을 올바르게 반환한다', () => {
    const result = getOverlapRange(d('2024-01-01'), d('2024-01-10'), d('2024-01-08'), d('2024-01-15'));
    expect(result!.end).toEqual(d('2024-01-10'));
  });

  it('겹치는 일수를 올바르게 계산한다 (1/8~1/10 = 3일)', () => {
    // conflictingTasks fixture와 동일한 구조
    const result = getOverlapRange(d('2024-01-01'), d('2024-01-10'), d('2024-01-08'), d('2024-01-15'));
    expect(result!.days).toBe(3); // 8일, 9일, 10일
  });

  it('정확히 같은 날짜 범위는 전체 기간이 겹침이다', () => {
    const result = getOverlapRange(d('2024-01-01'), d('2024-01-10'), d('2024-01-01'), d('2024-01-10'));
    expect(result).not.toBeNull();
    expect(result!.start).toEqual(d('2024-01-01'));
    expect(result!.end).toEqual(d('2024-01-10'));
  });

  it('하루짜리 작업이 같은 날이면 겹침 일수는 1이다', () => {
    const result = getOverlapRange(d('2024-01-05'), d('2024-01-05'), d('2024-01-05'), d('2024-01-05'));
    expect(result).not.toBeNull();
    expect(result!.days).toBe(1);
  });

  it('경계 겹침 (end1 === start2): 겹침 일수는 1이다', () => {
    // 1/1~1/10 과 1/10~1/20 → 겹침은 1/10 하루
    const result = getOverlapRange(d('2024-01-01'), d('2024-01-10'), d('2024-01-10'), d('2024-01-20'));
    expect(result).not.toBeNull();
    expect(result!.days).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('calculateTaskDuration', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('하루짜리 작업(startDate = endDate)의 기간은 1이다', () => {
    expect(calculateTaskDuration(d('2024-01-05'), d('2024-01-05'))).toBe(1);
  });

  it('10일짜리 작업의 기간은 10이다 (1/1~1/10)', () => {
    expect(calculateTaskDuration(d('2024-01-01'), d('2024-01-10'))).toBe(10);
  });

  it('8일짜리 작업의 기간은 8이다 (1/8~1/15)', () => {
    // conflictingTasks[1]의 기간: 8일~15일 = 8일
    expect(calculateTaskDuration(d('2024-01-08'), d('2024-01-15'))).toBe(8);
  });

  it('한 달짜리 작업의 기간은 31이다 (1월)', () => {
    expect(calculateTaskDuration(d('2024-01-01'), d('2024-01-31'))).toBe(31);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('checkScheduleConflict', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('기존 목록이 빈 배열이면 충돌이 없다', () => {
    const result = checkScheduleConflict(conflictingTasks[0], []);
    expect(result).toEqual([]);
  });

  it('동일 담당자 + 날짜 겹침 → 충돌을 반환한다', () => {
    // 앨리스 작업 A에 대해, 기존에 앨리스 작업 B가 날짜가 겹침
    const newTask = conflictingTasks[0];   // 앨리스 1/1~1/10
    const existing = [conflictingTasks[1]]; // 앨리스 1/8~1/15

    const result = checkScheduleConflict(newTask, existing);
    expect(result).toHaveLength(1);
  });

  it('충돌 결과에 겹치는 작업 정보가 포함된다', () => {
    const newTask = conflictingTasks[0];
    const existing = [conflictingTasks[1]];

    const [conflict] = checkScheduleConflict(newTask, existing);
    expect(conflict.conflictingTasks).toHaveLength(1);
    expect(conflict.conflictingTasks[0].id).toBe('conflict-2');
  });

  it('충돌 결과에 겹치는 일수가 포함된다', () => {
    const newTask = conflictingTasks[0]; // 1/1~1/10
    const existing = [conflictingTasks[1]]; // 1/8~1/15 → 겹침 3일

    const [conflict] = checkScheduleConflict(newTask, existing);
    expect(conflict.overlapDays).toBe(3);
  });

  it('동일 담당자 + 날짜 겹치지 않음 → 충돌 없음', () => {
    const newTask = nonConflictingTasks[0]; // 앨리스 1/1~1/10
    const existing = [nonConflictingTasks[1]]; // 앨리스 1/11~1/20

    const result = checkScheduleConflict(newTask, existing);
    expect(result).toEqual([]);
  });

  it('다른 담당자 + 날짜 겹침 → 충돌 아님', () => {
    // 앨리스 작업을 newTask로, 밥 작업이 existingTasks에 있어도 충돌 없음
    const newTask = differentAssigneeTasks[0]; // 앨리스
    const existing = [differentAssigneeTasks[1]]; // 밥

    const result = checkScheduleConflict(newTask, existing);
    expect(result).toEqual([]);
  });

  it('excludeTaskId로 자기 자신을 제외한다', () => {
    // 기존 목록에 자기 자신이 있더라도 excludeId로 제외하면 충돌 없음
    const task = conflictingTasks[0];
    const existing = [task, conflictingTasks[1]];

    // task 자신을 제외하면 conflictingTasks[1]만 검사 → 충돌 있음
    const withSelf = checkScheduleConflict(task, existing);
    const withoutSelf = checkScheduleConflict(task, existing, task.id);

    // 자기 자신(conflict-1)은 원래 newTask.id와 같아 항상 제외됨
    // excludeTaskId는 목록 내 다른 항목을 추가로 제외하는 목적
    expect(withSelf).toHaveLength(withoutSelf.length);
  });

  it('excludeTaskId가 지정된 작업은 충돌 검사에서 제외된다', () => {
    // 앨리스 작업 3개: A(1/1~1/10), B(1/8~1/15), C(1/5~1/20)
    const taskA: ConflictTask = {
      id: 'ex-A', title: 'A', startDate: d('2024-01-01'), endDate: d('2024-01-10'), assignee: ASSIGNEES.alice,
    };
    const taskB: ConflictTask = {
      id: 'ex-B', title: 'B', startDate: d('2024-01-08'), endDate: d('2024-01-15'), assignee: ASSIGNEES.alice,
    };
    const taskC: ConflictTask = {
      id: 'ex-C', title: 'C', startDate: d('2024-01-05'), endDate: d('2024-01-20'), assignee: ASSIGNEES.alice,
    };

    // B를 exclude하면 C만 검사 → A와 C가 겹침 → 충돌 1건
    const result = checkScheduleConflict(taskA, [taskB, taskC], 'ex-B');
    expect(result).toHaveLength(1);
    expect(result[0].conflictingTasks[0].id).toBe('ex-C');
  });

  it('정확히 같은 날짜 범위는 충돌로 감지된다', () => {
    const newTask = exactSameDateTasks[0];
    const existing = [exactSameDateTasks[1]];

    const result = checkScheduleConflict(newTask, existing);
    expect(result).toHaveLength(1);
  });

  it('하루짜리 작업이 같은 날이면 충돌로 감지된다', () => {
    const newTask = oneDayTasks[0];
    const existing = [oneDayTasks[1]];

    const result = checkScheduleConflict(newTask, existing);
    expect(result).toHaveLength(1);
    expect(result[0].overlapDays).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('generateAdjustmentSuggestions', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('충돌이 없으면 빈 배열을 반환한다', () => {
    const result = generateAdjustmentSuggestions(conflictingTasks[0], []);
    expect(result).toEqual([]);
  });

  it('충돌이 있으면 delay 제안을 포함한다', () => {
    const newTask = conflictingTasks[1]; // 앨리스 1/8~1/15
    const conflicts = checkScheduleConflict(newTask, [conflictingTasks[0]]);

    const suggestions = generateAdjustmentSuggestions(newTask, conflicts);
    const delayTypes = suggestions.map(s => s.type);
    expect(delayTypes).toContain('delay');
  });

  it('충돌이 있으면 parallel 제안을 포함한다', () => {
    const newTask = conflictingTasks[1];
    const conflicts = checkScheduleConflict(newTask, [conflictingTasks[0]]);

    const suggestions = generateAdjustmentSuggestions(newTask, conflicts);
    const types = suggestions.map(s => s.type);
    expect(types).toContain('parallel');
  });

  it('작업 기간이 3일 초과면 split 제안도 포함한다', () => {
    // conflictingTasks[1]의 기간: 1/8~1/15 = 8일 → 3 초과
    const newTask = conflictingTasks[1];
    const conflicts = checkScheduleConflict(newTask, [conflictingTasks[0]]);

    const suggestions = generateAdjustmentSuggestions(newTask, conflicts);
    const types = suggestions.map(s => s.type);
    expect(types).toContain('split');
  });

  it('작업 기간이 3일 이하면 split 제안이 없다', () => {
    const shortTask: ConflictTask = {
      id: 'short', title: '짧은 작업', startDate: d('2024-01-08'), endDate: d('2024-01-10'),
      assignee: ASSIGNEES.alice, // 3일 작업
    };
    const conflicts = checkScheduleConflict(shortTask, [conflictingTasks[0]]);

    const suggestions = generateAdjustmentSuggestions(shortTask, conflicts);
    const types = suggestions.map(s => s.type);
    expect(types).not.toContain('split');
  });

  it('delay 제안의 시작일은 충돌 종료일 다음 날이다', () => {
    const newTask = conflictingTasks[1]; // 1/8~1/15, 충돌 overlapEnd=1/10
    const conflicts = checkScheduleConflict(newTask, [conflictingTasks[0]]);

    const suggestions = generateAdjustmentSuggestions(newTask, conflicts);
    const delaySuggestion = suggestions.find(s => s.type === 'delay');

    expect(delaySuggestion?.suggestedStartDate).toBeDefined();
    // overlapEnd(1/10) + 1 = 1/11
    expect(delaySuggestion!.suggestedStartDate!.getDate()).toBe(11);
  });

  it('각 제안에 description이 포함된다', () => {
    const newTask = conflictingTasks[1];
    const conflicts = checkScheduleConflict(newTask, [conflictingTasks[0]]);

    const suggestions = generateAdjustmentSuggestions(newTask, conflicts);
    suggestions.forEach(s => {
      expect(typeof s.description).toBe('string');
      expect(s.description.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('checkAllScheduleConflicts', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('빈 배열 → 빈 Map', () => {
    const result = checkAllScheduleConflicts([]);
    expect(result.size).toBe(0);
  });

  it('단일 작업 → 충돌 없음 (빈 Map)', () => {
    const result = checkAllScheduleConflicts([conflictingTasks[0]]);
    expect(result.size).toBe(0);
  });

  it('동일 담당자 날짜 겹침 → 해당 담당자 ID 키로 충돌 기록', () => {
    const result = checkAllScheduleConflicts(conflictingTasks);

    expect(result.has(ASSIGNEES.alice._id)).toBe(true);
  });

  it('동일 담당자 날짜 겹침 → 충돌 목록이 비어 있지 않다', () => {
    const result = checkAllScheduleConflicts(conflictingTasks);
    const aliceConflicts = result.get(ASSIGNEES.alice._id)!;

    expect(aliceConflicts.length).toBeGreaterThan(0);
  });

  it('동일 담당자 날짜 안 겹침 → Map에 포함되지 않는다', () => {
    const result = checkAllScheduleConflicts(nonConflictingTasks);
    expect(result.size).toBe(0);
  });

  it('다른 담당자 날짜 겹침 → Map에 포함되지 않는다', () => {
    const result = checkAllScheduleConflicts(differentAssigneeTasks);
    expect(result.size).toBe(0);
  });

  it('혼합 시나리오: 앨리스는 충돌, 밥은 충돌 없음 → 앨리스만 Map에 포함', () => {
    const result = checkAllScheduleConflicts(mixedAssigneeTasks);

    expect(result.has(ASSIGNEES.alice._id)).toBe(true);
    expect(result.has(ASSIGNEES.bob._id)).toBe(false);
  });

  it('충돌 결과에 conflictingTasks 배열이 포함된다', () => {
    const result = checkAllScheduleConflicts(conflictingTasks);
    const aliceConflicts = result.get(ASSIGNEES.alice._id)!;

    aliceConflicts.forEach(conflict => {
      expect(Array.isArray(conflict.conflictingTasks)).toBe(true);
      expect(conflict.conflictingTasks.length).toBeGreaterThan(0);
    });
  });

  it('하루짜리 같은 날 작업 → 충돌로 감지된다', () => {
    const result = checkAllScheduleConflicts(oneDayTasks);
    expect(result.has(ASSIGNEES.alice._id)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('calculateConflictSeverity', () => {
// ═══════════════════════════════════════════════════════════════════════════════

  it('겹침 1일 + 충돌 작업 1개 → 심각도 35', () => {
    // daysFactor = min(1*10, 50) = 10, tasksFactor = min(1*25, 50) = 25
    const conflict = makeConflict(1, 1);
    expect(calculateConflictSeverity(conflict)).toBe(35);
  });

  it('겹침 5일 + 충돌 작업 1개 → 심각도 75', () => {
    // daysFactor = min(50, 50) = 50, tasksFactor = 25
    const conflict = makeConflict(5, 1);
    expect(calculateConflictSeverity(conflict)).toBe(75);
  });

  it('겹침 6일 이상이면 daysFactor는 50으로 고정된다', () => {
    const six = calculateConflictSeverity(makeConflict(6, 1));   // 50+25=75
    const ten = calculateConflictSeverity(makeConflict(10, 1));  // 50+25=75
    expect(six).toBe(ten); // 모두 daysFactor=50으로 cap
  });

  it('충돌 작업 2개 이상이면 tasksFactor는 50으로 고정된다', () => {
    const two   = calculateConflictSeverity(makeConflict(1, 2)); // 10+50=60
    const three = calculateConflictSeverity(makeConflict(1, 3)); // 10+50=60
    expect(two).toBe(three);
  });

  it('최대 심각도는 100을 초과하지 않는다', () => {
    // daysFactor=50(6일+), tasksFactor=50(2개+) → 합계 100
    const conflict = makeConflict(10, 5);
    expect(calculateConflictSeverity(conflict)).toBe(100);
  });

  it('겹침 2일 + 충돌 작업 1개 → 심각도 45', () => {
    // daysFactor = 20, tasksFactor = 25
    const conflict = makeConflict(2, 1);
    expect(calculateConflictSeverity(conflict)).toBe(45);
  });

  it('심각도는 0 이상이다', () => {
    const conflict = makeConflict(0, 1);
    expect(calculateConflictSeverity(conflict)).toBeGreaterThanOrEqual(0);
  });
});
