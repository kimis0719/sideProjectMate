import { describe, it, expect } from 'vitest';
import {
  getPredecessorTasks,
  getSuccessorTasks,
  validateDependencyConstraint,
  validateAllDependencies,
  detectCircularDependency,
  calculateCriticalPath,
  identifyParallelTasks,
  identifySerialTasks,
  getDependencyTypeDescription,
  type TaskDependency,
} from './taskDependency';
import {
  singleTask,
  linearChainTasks,
  parallelTasks,
  circularTasks,
  criticalPathTasks,
  fsViolationPair,
  ssValidPair,
} from '@/__tests__/fixtures/tasks';

// ─── 테스트 헬퍼 ──────────────────────────────────────────────────────────────
const d = (dateStr: string) => new Date(dateStr);

/** id로 linearChainTasks에서 작업을 찾는 헬퍼 */
const findLinear = (id: string) => linearChainTasks.find((t) => t.id === id)!;
const findParallel = (id: string) => parallelTasks.find((t) => t.id === id)!;
const findCritical = (id: string) => criticalPathTasks.find((t) => t.id === id)!;
const findCircular = (id: string) => circularTasks.find((t) => t.id === id)!;

// ═══════════════════════════════════════════════════════════════════════════════
describe('getPredecessorTasks', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('의존관계 없는 작업의 선행 작업 목록은 빈 배열이다', () => {
    const result = getPredecessorTasks(singleTask, [singleTask]);
    expect(result).toEqual([]);
  });

  it('전체 작업 목록이 빈 배열이면 빈 배열을 반환한다', () => {
    const result = getPredecessorTasks(singleTask, []);
    expect(result).toEqual([]);
  });

  it('FS 의존관계의 선행 작업을 반환한다', () => {
    const taskDev = findLinear('task-dev');
    const taskPlan = findLinear('task-plan');

    const result = getPredecessorTasks(taskDev, linearChainTasks);

    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe('task-plan');
    expect(result[0].type).toBe('FS');
    expect(result[0].task).toEqual(taskPlan);
  });

  it('SS 의존관계의 선행 작업을 반환한다', () => {
    const taskParallelA = findParallel('task-parallel-a');
    const result = getPredecessorTasks(taskParallelA, parallelTasks);

    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe('task-main');
    expect(result[0].type).toBe('SS');
  });

  it('FF 의존관계의 선행 작업을 반환한다', () => {
    const taskParallelB = findParallel('task-parallel-b');
    const result = getPredecessorTasks(taskParallelB, parallelTasks);

    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe('task-main');
    expect(result[0].type).toBe('FF');
  });

  it('여러 선행 작업을 모두 반환한다 (cp-4는 cp-2, cp-3에 의존)', () => {
    const cp4 = findCritical('cp-4');
    const result = getPredecessorTasks(cp4, criticalPathTasks);

    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.task.id);
    expect(ids).toContain('cp-2');
    expect(ids).toContain('cp-3');
  });

  it('의존관계에 적힌 taskId가 실제 목록에 없으면 해당 항목은 무시한다', () => {
    const taskWithGhostDep: TaskDependency = {
      id: 'ghost-task',
      title: '유령 의존관계',
      startDate: d('2024-01-05'),
      endDate: d('2024-01-10'),
      dependencies: [{ taskId: 'non-existent-id', type: 'FS' }],
    };

    const result = getPredecessorTasks(taskWithGhostDep, [taskWithGhostDep]);
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('getSuccessorTasks', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('후행 작업이 없으면 빈 배열을 반환한다', () => {
    const result = getSuccessorTasks(singleTask, [singleTask]);
    expect(result).toEqual([]);
  });

  it('전체 작업 목록이 빈 배열이면 빈 배열을 반환한다', () => {
    const result = getSuccessorTasks(singleTask, []);
    expect(result).toEqual([]);
  });

  it('FS 의존관계의 후행 작업을 반환한다', () => {
    const taskPlan = findLinear('task-plan');
    const result = getSuccessorTasks(taskPlan, linearChainTasks);

    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe('task-dev');
    expect(result[0].type).toBe('FS');
  });

  it('마지막 작업(후행 없음)은 빈 배열을 반환한다', () => {
    const taskTest = findLinear('task-test');
    const result = getSuccessorTasks(taskTest, linearChainTasks);
    expect(result).toEqual([]);
  });

  it('SS 의존관계의 후행 작업을 반환한다', () => {
    const taskMain = findParallel('task-main');
    const result = getSuccessorTasks(taskMain, parallelTasks);

    const types = result.map((r) => r.type);
    expect(types).toContain('SS');
    expect(types).toContain('FF');
  });

  it('여러 후행 작업을 모두 반환한다 (cp-1의 후행: cp-2, cp-3)', () => {
    const cp1 = findCritical('cp-1');
    const result = getSuccessorTasks(cp1, criticalPathTasks);

    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.task.id);
    expect(ids).toContain('cp-2');
    expect(ids).toContain('cp-3');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('validateDependencyConstraint', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('FS (Finish-to-Start)', () => {
    it('선행 작업 종료 후 시작하면 유효하다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-11'),
        endDate: d('2024-01-20'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'FS');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('선행 작업 종료 전에 시작하면 유효하지 않다', () => {
      const result = validateDependencyConstraint(
        fsViolationPair.task,
        fsViolationPair.predecessor,
        'FS'
      );
      expect(result.valid).toBe(false);
      expect(result.message).toContain('FS');
    });

    it('경계값: taskStart === predEnd이면 유효하다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-10'),
        endDate: d('2024-01-20'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'FS');
      expect(result.valid).toBe(true);
    });
  });

  describe('SS (Start-to-Start)', () => {
    it('선행 작업과 동시에 시작하면 유효하다', () => {
      const result = validateDependencyConstraint(ssValidPair.task, ssValidPair.predecessor, 'SS');
      expect(result.valid).toBe(true);
    });

    it('선행 작업 이후에 시작해도 유효하다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-05'),
        endDate: d('2024-01-15'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'SS');
      expect(result.valid).toBe(true);
    });

    it('선행 작업보다 먼저 시작하면 유효하지 않다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-05'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-15'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'SS');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('SS');
    });
  });

  describe('FF (Finish-to-Finish)', () => {
    it('선행 작업과 동시에 종료하면 유효하다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'FF');
      expect(result.valid).toBe(true);
    });

    it('선행 작업보다 늦게 종료하면 유효하다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-15'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'FF');
      expect(result.valid).toBe(true);
    });

    it('선행 작업보다 일찍 종료하면 유효하지 않다', () => {
      const pred: TaskDependency = {
        id: 'p',
        title: '선행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-15'),
        dependencies: [],
      };
      const succ: TaskDependency = {
        id: 's',
        title: '후행',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      };
      const result = validateDependencyConstraint(succ, pred, 'FF');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('FF');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('validateAllDependencies', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('의존관계 없는 작업의 결과는 빈 배열이다', () => {
    const result = validateAllDependencies(singleTask, [singleTask]);
    expect(result).toEqual([]);
  });

  it('유효한 FS 의존관계 → [{ valid: true }]', () => {
    const taskDev = findLinear('task-dev');
    const result = validateAllDependencies(taskDev, linearChainTasks);

    expect(result).toHaveLength(1);
    expect(result[0].valid).toBe(true);
  });

  it('FS 위반인 경우 → [{ valid: false, message: string }]', () => {
    const allTasks = [fsViolationPair.predecessor, fsViolationPair.task];
    const result = validateAllDependencies(fsViolationPair.task, allTasks);

    expect(result).toHaveLength(1);
    expect(result[0].valid).toBe(false);
    expect(typeof result[0].message).toBe('string');
  });

  it('여러 의존관계가 있는 작업은 의존관계 수만큼 결과를 반환한다 (cp-4: 2개)', () => {
    const cp4 = findCritical('cp-4');
    const result = validateAllDependencies(cp4, criticalPathTasks);

    expect(result).toHaveLength(2);
    result.forEach((r) => expect(r.valid).toBe(true));
  });

  it('전체 작업 목록이 빈 배열이면 빈 배열을 반환한다', () => {
    const task: TaskDependency = {
      id: 't',
      title: '작업',
      startDate: d('2024-01-05'),
      endDate: d('2024-01-10'),
      dependencies: [{ taskId: 'non-existent', type: 'FS' }],
    };
    const result = validateAllDependencies(task, []);
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('detectCircularDependency', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('의존관계 없는 단일 작업 → 순환 없음', () => {
    const result = detectCircularDependency(singleTask, [singleTask]);
    expect(result.hasCircular).toBe(false);
    expect(result.cycle).toBeUndefined();
  });

  it('전체 작업 목록이 빈 배열 → 순환 없음', () => {
    const result = detectCircularDependency(singleTask, []);
    expect(result.hasCircular).toBe(false);
  });

  it('선형 체인(A→B→C) → 순환 없음', () => {
    const taskPlan = findLinear('task-plan');
    const result = detectCircularDependency(taskPlan, linearChainTasks);
    expect(result.hasCircular).toBe(false);
  });

  it('A→B→C→A 3단계 순환 → 순환 감지', () => {
    const taskA = findCircular('task-circular-a');
    const result = detectCircularDependency(taskA, circularTasks);

    expect(result.hasCircular).toBe(true);
    expect(result.cycle).toBeDefined();
    expect(result.cycle!.length).toBeGreaterThanOrEqual(3);
  });

  it('순환 시 cycle 배열에 시작 노드가 처음과 끝에 포함된다', () => {
    const taskA = findCircular('task-circular-a');
    const result = detectCircularDependency(taskA, circularTasks);

    expect(result.cycle).toBeDefined();
    // 순환 경로: [A, B, C, A] 형태로 시작과 끝이 같은 노드
    expect(result.cycle!.at(-1)).toBe(result.cycle![0]);
  });

  it('2단계 순환 (A→B→A) → 순환 감지', () => {
    const taskA: TaskDependency = {
      id: 'two-A',
      title: 'A',
      startDate: d('2024-01-01'),
      endDate: d('2024-01-05'),
      dependencies: [{ taskId: 'two-B', type: 'FS' }], // A depends on B
    };
    const taskB: TaskDependency = {
      id: 'two-B',
      title: 'B',
      startDate: d('2024-01-06'),
      endDate: d('2024-01-10'),
      dependencies: [{ taskId: 'two-A', type: 'FS' }], // B depends on A
    };

    const result = detectCircularDependency(taskA, [taskA, taskB]);

    expect(result.hasCircular).toBe(true);
    expect(result.cycle).toContain('two-A');
    expect(result.cycle).toContain('two-B');
  });

  it('자기 자신을 참조하는 작업 → 순환 감지', () => {
    const selfRefTask: TaskDependency = {
      id: 'self',
      title: '자기 참조',
      startDate: d('2024-01-01'),
      endDate: d('2024-01-05'),
      dependencies: [{ taskId: 'self', type: 'FS' }],
    };

    const result = detectCircularDependency(selfRefTask, [selfRefTask]);
    expect(result.hasCircular).toBe(true);
  });

  it('병렬 작업(SS/FF)은 순환 없음', () => {
    const taskMain = findParallel('task-main');
    const result = detectCircularDependency(taskMain, parallelTasks);
    expect(result.hasCircular).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('calculateCriticalPath', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('빈 배열 → 빈 배열', () => {
    expect(calculateCriticalPath([])).toEqual([]);
  });

  it('반환값은 TaskDependency 배열이다', () => {
    const result = calculateCriticalPath(linearChainTasks);
    expect(Array.isArray(result)).toBe(true);
    result.forEach((task) => {
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('startDate');
      expect(task).toHaveProperty('endDate');
      expect(task).toHaveProperty('dependencies');
    });
  });

  it('단일 마일스톤 작업(startDate=endDate)은 크리티컬 패스에 포함된다', () => {
    // 알고리즘: earliest === latest인 작업이 크리티컬 패스
    // 마일스톤: latestStart=endDate, earliestStart=startDate → startDate=endDate면 equal
    const milestone: TaskDependency = {
      id: 'ms',
      title: '마일스톤',
      startDate: d('2024-01-25'),
      endDate: d('2024-01-25'),
      dependencies: [],
    };

    const result = calculateCriticalPath([milestone]);
    expect(result).toContainEqual(milestone);
  });

  it('시작일과 종료일이 다른 단일 작업 → 크리티컬 패스에 포함되지 않는다', () => {
    // 알고리즘 특성: 일반 작업(startDate ≠ endDate)은 earliest ≠ latest
    const result = calculateCriticalPath([singleTask]);
    expect(result).not.toContainEqual(singleTask);
  });

  it('크리티컬 패스에 포함된 작업은 원본 tasks 목록 내의 객체이다', () => {
    const tasks = [...linearChainTasks];
    const result = calculateCriticalPath(tasks);
    result.forEach((cpTask) => {
      expect(tasks.some((t) => t.id === cpTask.id)).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('identifyParallelTasks', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('빈 배열 → 빈 Map', () => {
    const result = identifyParallelTasks([]);
    expect(result.size).toBe(0);
  });

  it('의존관계 없는 단일 작업 → 빈 Map', () => {
    const result = identifyParallelTasks([singleTask]);
    expect(result.size).toBe(0);
  });

  it('FS만 있는 체인 → 빈 Map (SS/FF만 병렬로 인식)', () => {
    const result = identifyParallelTasks(linearChainTasks);
    expect(result.size).toBe(0);
  });

  it('SS 의존관계가 있으면 병렬 그룹을 생성한다', () => {
    const result = identifyParallelTasks(parallelTasks);
    expect(result.has('task-main')).toBe(true);
  });

  it('FF 의존관계도 병렬 그룹에 포함된다', () => {
    const result = identifyParallelTasks(parallelTasks);
    const group = result.get('task-main');
    expect(group).toBeDefined();
    const ids = group!.map((t) => t.id);
    expect(ids).toContain('task-parallel-b'); // FF 의존관계
  });

  it('SS/FF 혼합: 그룹에 선행 작업 + 모든 병렬 후행 작업이 포함된다', () => {
    const result = identifyParallelTasks(parallelTasks);
    const group = result.get('task-main')!;
    const ids = group.map((t) => t.id);

    expect(ids).toContain('task-main'); // 선행 작업 (그룹 키)
    expect(ids).toContain('task-parallel-a'); // SS
    expect(ids).toContain('task-parallel-b'); // FF
  });

  it('그룹의 첫 번째 요소는 선행 작업(그룹 키)이다', () => {
    const result = identifyParallelTasks(parallelTasks);
    const group = result.get('task-main')!;
    expect(group[0].id).toBe('task-main');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('identifySerialTasks', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('빈 배열 → 빈 배열', () => {
    expect(identifySerialTasks([])).toEqual([]);
  });

  it('의존관계 없는 단일 작업 → 빈 배열', () => {
    const result = identifySerialTasks([singleTask]);
    expect(result).toEqual([]);
  });

  it('FS 선형 체인(A→B→C) → 1개의 체인 반환', () => {
    const result = identifySerialTasks(linearChainTasks);
    expect(result).toHaveLength(1);
  });

  it('선형 체인의 순서가 올바르다 (기획→개발→테스트)', () => {
    const result = identifySerialTasks(linearChainTasks);
    const chain = result[0];

    expect(chain[0].id).toBe('task-plan');
    expect(chain[1].id).toBe('task-dev');
    expect(chain[2].id).toBe('task-test');
  });

  it('체인 길이가 올바르다', () => {
    const result = identifySerialTasks(linearChainTasks);
    expect(result[0]).toHaveLength(3);
  });

  it('SS/FF만 있는 경우 → 빈 배열 (FS만 직렬로 인식)', () => {
    // task-main → task-parallel-a (SS), task-parallel-b (FF) 만 있는 경우
    const onlySsAndFf: TaskDependency[] = [
      {
        id: 'root',
        title: '루트',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-10'),
        dependencies: [],
      },
      {
        id: 'child',
        title: '자식',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-08'),
        dependencies: [{ taskId: 'root', type: 'SS' }],
      },
    ];
    const result = identifySerialTasks(onlySsAndFf);
    expect(result).toEqual([]);
  });

  it('의존관계 없는 여러 독립 작업 → 빈 배열', () => {
    const independentTasks: TaskDependency[] = [
      {
        id: 'i1',
        title: '작업1',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-05'),
        dependencies: [],
      },
      {
        id: 'i2',
        title: '작업2',
        startDate: d('2024-01-01'),
        endDate: d('2024-01-05'),
        dependencies: [],
      },
    ];
    const result = identifySerialTasks(independentTasks);
    expect(result).toEqual([]);
  });

  it('복합 시나리오: FS 체인에서 직렬 체인을 올바르게 추출한다', () => {
    // criticalPathTasks: cp-1 → cp-2 → cp-4 (FS), cp-1 → cp-3 → (cp-4 but cp-4 already in chain)
    const result = identifySerialTasks(criticalPathTasks);
    expect(result.length).toBeGreaterThan(0);
    // 모든 체인은 2개 이상의 작업을 포함한다
    result.forEach((chain) => expect(chain.length).toBeGreaterThanOrEqual(2));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('getDependencyTypeDescription', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  it('FS 타입의 설명 문자열을 반환한다', () => {
    const result = getDependencyTypeDescription('FS');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('Finish-to-Start');
  });

  it('SS 타입의 설명 문자열을 반환한다', () => {
    const result = getDependencyTypeDescription('SS');
    expect(typeof result).toBe('string');
    expect(result).toContain('Start-to-Start');
  });

  it('FF 타입의 설명 문자열을 반환한다', () => {
    const result = getDependencyTypeDescription('FF');
    expect(typeof result).toBe('string');
    expect(result).toContain('Finish-to-Finish');
  });

  it('각 타입의 설명이 서로 다르다', () => {
    const fs = getDependencyTypeDescription('FS');
    const ss = getDependencyTypeDescription('SS');
    const ff = getDependencyTypeDescription('FF');

    expect(fs).not.toBe(ss);
    expect(ss).not.toBe(ff);
    expect(fs).not.toBe(ff);
  });
});
