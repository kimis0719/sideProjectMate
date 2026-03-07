/**
 * 테스트용 Mock WBS 태스크 데이터
 *
 * 두 가지 형태의 fixture를 제공합니다:
 *  - TaskDependency: taskDependency.ts 유틸 함수 테스트용 (id, dependencies)
 *  - ConflictTask:   scheduleConflict.ts 유틸 함수 테스트용 (id, assignee)
 */
import type { TaskDependency } from '@/lib/utils/wbs/taskDependency';
import type { ConflictTask } from '@/lib/utils/wbs/scheduleConflict';

// ─── 날짜 헬퍼 ────────────────────────────────────────────────────────────────
const d = (dateStr: string): Date => new Date(dateStr);

// ─── 담당자 상수 (ConflictTask용) ─────────────────────────────────────────────
export const ASSIGNEES = {
  alice: { _id: 'user-alice', nName: '앨리스' },
  bob:   { _id: 'user-bob',   nName: '밥' },
  carol: { _id: 'user-carol', nName: '캐롤' },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TaskDependency Fixtures  (taskDependency.ts 테스트용)
// ═══════════════════════════════════════════════════════════════════════════════

/** 의존관계 없는 독립 단일 작업 */
export const singleTask: TaskDependency = {
  id: 'task-solo',
  title: '독립 작업',
  startDate: d('2024-01-01'),
  endDate: d('2024-01-05'),
  dependencies: [],
};

/**
 * 선형 의존관계 체인 (FS): 기획 → 개발 → 테스트
 * 기획이 끝나야 개발 시작, 개발이 끝나야 테스트 시작
 */
export const linearChainTasks: TaskDependency[] = [
  {
    id: 'task-plan',
    title: '기획',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-07'),
    dependencies: [],
  },
  {
    id: 'task-dev',
    title: '개발',
    startDate: d('2024-01-08'),
    endDate: d('2024-01-20'),
    dependencies: [{ taskId: 'task-plan', type: 'FS' }],
  },
  {
    id: 'task-test',
    title: '테스트',
    startDate: d('2024-01-21'),
    endDate: d('2024-01-25'),
    dependencies: [{ taskId: 'task-dev', type: 'FS' }],
  },
];

/**
 * 병렬 실행 가능한 작업 (SS / FF 의존관계)
 * task-B: task-A와 동시 시작 가능 (SS)
 * task-C: task-A와 동시 종료 (FF)
 */
export const parallelTasks: TaskDependency[] = [
  {
    id: 'task-main',
    title: '메인 작업',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    dependencies: [],
  },
  {
    id: 'task-parallel-a',
    title: '병렬 작업 A (SS)',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-08'),
    dependencies: [{ taskId: 'task-main', type: 'SS' }],
  },
  {
    id: 'task-parallel-b',
    title: '병렬 작업 B (FF)',
    startDate: d('2024-01-05'),
    endDate: d('2024-01-10'),
    dependencies: [{ taskId: 'task-main', type: 'FF' }],
  },
];

/**
 * 순환 의존관계: task-A → task-B → task-C → task-A
 * detectCircularDependency 테스트용
 *
 * 의존관계 방향 (각 task의 dependencies 필드):
 *   task-B.dependencies = [task-A] → task-A의 후행 작업: task-B
 *   task-C.dependencies = [task-B] → task-B의 후행 작업: task-C
 *   task-A.dependencies = [task-C] → task-C의 후행 작업: task-A (순환!)
 */
export const circularTasks: TaskDependency[] = [
  {
    id: 'task-circular-a',
    title: '순환 작업 A',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-05'),
    dependencies: [{ taskId: 'task-circular-c', type: 'FS' }], // C에 의존
  },
  {
    id: 'task-circular-b',
    title: '순환 작업 B',
    startDate: d('2024-01-06'),
    endDate: d('2024-01-10'),
    dependencies: [{ taskId: 'task-circular-a', type: 'FS' }], // A에 의존
  },
  {
    id: 'task-circular-c',
    title: '순환 작업 C',
    startDate: d('2024-01-11'),
    endDate: d('2024-01-15'),
    dependencies: [{ taskId: 'task-circular-b', type: 'FS' }], // B에 의존
  },
];

/**
 * FS 제약 위반 케이스: task-B가 task-A보다 먼저 시작
 * validateDependencyConstraint 실패 케이스 테스트용
 */
export const fsViolationPair: { task: TaskDependency; predecessor: TaskDependency } = {
  predecessor: {
    id: 'task-pred',
    title: '선행 작업',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    dependencies: [],
  },
  task: {
    id: 'task-succ',
    title: '후행 작업 (FS 위반)',
    startDate: d('2024-01-05'), // 선행 작업 종료(1/10) 이전에 시작
    endDate: d('2024-01-15'),
    dependencies: [{ taskId: 'task-pred', type: 'FS' }],
  },
};

/**
 * SS 제약 만족 케이스: 동시 시작
 */
export const ssValidPair: { task: TaskDependency; predecessor: TaskDependency } = {
  predecessor: {
    id: 'task-ss-pred',
    title: 'SS 선행 작업',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    dependencies: [],
  },
  task: {
    id: 'task-ss-succ',
    title: 'SS 후행 작업 (동시 시작)',
    startDate: d('2024-01-01'), // 선행과 같은 날 시작 → 유효
    endDate: d('2024-01-08'),
    dependencies: [{ taskId: 'task-ss-pred', type: 'SS' }],
  },
};

/**
 * 복합 시나리오: 선형 + 병렬 혼합
 * 크리티컬 패스 계산 테스트용
 */
export const criticalPathTasks: TaskDependency[] = [
  {
    id: 'cp-1',
    title: '요구사항 분석',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-05'),
    dependencies: [],
  },
  {
    id: 'cp-2',
    title: '백엔드 개발 (긴 경로)',
    startDate: d('2024-01-06'),
    endDate: d('2024-01-20'),
    dependencies: [{ taskId: 'cp-1', type: 'FS' }],
  },
  {
    id: 'cp-3',
    title: '프론트 개발 (짧은 경로)',
    startDate: d('2024-01-06'),
    endDate: d('2024-01-12'),
    dependencies: [{ taskId: 'cp-1', type: 'FS' }],
  },
  {
    id: 'cp-4',
    title: '통합 테스트',
    startDate: d('2024-01-21'),
    endDate: d('2024-01-25'),
    dependencies: [
      { taskId: 'cp-2', type: 'FS' },
      { taskId: 'cp-3', type: 'FS' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ConflictTask Fixtures  (scheduleConflict.ts 테스트용)
// ═══════════════════════════════════════════════════════════════════════════════

/** 동일 담당자 + 날짜 겹침 → 충돌 발생 */
export const conflictingTasks: ConflictTask[] = [
  {
    id: 'conflict-1',
    title: '앨리스 작업 A',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    assignee: ASSIGNEES.alice,
  },
  {
    id: 'conflict-2',
    title: '앨리스 작업 B',
    startDate: d('2024-01-08'), // 1/1~1/10과 3일 겹침
    endDate: d('2024-01-15'),
    assignee: ASSIGNEES.alice,
  },
];

/** 동일 담당자 + 날짜 겹치지 않음 → 충돌 없음 */
export const nonConflictingTasks: ConflictTask[] = [
  {
    id: 'noconflict-1',
    title: '앨리스 작업 A',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    assignee: ASSIGNEES.alice,
  },
  {
    id: 'noconflict-2',
    title: '앨리스 작업 B',
    startDate: d('2024-01-11'), // 딱 붙어있지만 겹치지 않음
    endDate: d('2024-01-20'),
    assignee: ASSIGNEES.alice,
  },
];

/** 다른 담당자 + 날짜 겹침 → 충돌 아님 */
export const differentAssigneeTasks: ConflictTask[] = [
  {
    id: 'diff-1',
    title: '앨리스 작업',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-15'),
    assignee: ASSIGNEES.alice,
  },
  {
    id: 'diff-2',
    title: '밥 작업',
    startDate: d('2024-01-05'),
    endDate: d('2024-01-20'),
    assignee: ASSIGNEES.bob,
  },
];

/** 정확히 같은 날짜 범위인 두 작업 (경계값) */
export const exactSameDateTasks: ConflictTask[] = [
  {
    id: 'same-1',
    title: '앨리스 작업 A',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    assignee: ASSIGNEES.alice,
  },
  {
    id: 'same-2',
    title: '앨리스 작업 B',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    assignee: ASSIGNEES.alice,
  },
];

/** 하루짜리 작업 두 개가 같은 날 (경계값) */
export const oneDayTasks: ConflictTask[] = [
  {
    id: 'oneday-1',
    title: '앨리스 하루 작업 A',
    startDate: d('2024-01-05'),
    endDate: d('2024-01-05'),
    assignee: ASSIGNEES.alice,
  },
  {
    id: 'oneday-2',
    title: '앨리스 하루 작업 B',
    startDate: d('2024-01-05'),
    endDate: d('2024-01-05'),
    assignee: ASSIGNEES.alice,
  },
];

/**
 * 혼합 시나리오: 앨리스는 충돌, 밥은 충돌 없음
 * checkAllScheduleConflicts 테스트용
 */
export const mixedAssigneeTasks: ConflictTask[] = [
  // 앨리스 - 충돌 발생
  {
    id: 'mixed-alice-1',
    title: '앨리스 작업 1',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-10'),
    assignee: ASSIGNEES.alice,
  },
  {
    id: 'mixed-alice-2',
    title: '앨리스 작업 2',
    startDate: d('2024-01-08'),
    endDate: d('2024-01-15'),
    assignee: ASSIGNEES.alice,
  },
  // 밥 - 충돌 없음
  {
    id: 'mixed-bob-1',
    title: '밥 작업 1',
    startDate: d('2024-01-01'),
    endDate: d('2024-01-15'),
    assignee: ASSIGNEES.bob,
  },
  {
    id: 'mixed-bob-2',
    title: '밥 작업 2',
    startDate: d('2024-02-01'),
    endDate: d('2024-02-10'),
    assignee: ASSIGNEES.bob,
  },
];
