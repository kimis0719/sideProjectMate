/**
 * 일정 충돌 검사 유틸리티
 * 동일 작업자의 작업 일정이 겹치는지 검사하고 조정 방안을 제시합니다.
 */

export interface ConflictTask {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    assignee: {
        _id: string;
        nName: string;
    };
}

export interface ScheduleConflict {
    conflictingTasks: ConflictTask[];
    overlapDays: number;
    overlapStart: Date;
    overlapEnd: Date;
}

export interface AdjustmentSuggestion {
    type: 'delay' | 'parallel' | 'split';
    description: string;
    suggestedStartDate?: Date;
    suggestedEndDate?: Date;
}

/**
 * 두 날짜 범위가 겹치는지 확인
 */
export function isDateRangeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean {
    return start1 <= end2 && start2 <= end1;
}

/**
 * 겹치는 날짜 범위 계산
 */
export function getOverlapRange(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): { start: Date; end: Date; days: number } | null {
    if (!isDateRangeOverlap(start1, end1, start2, end2)) {
        return null;
    }

    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
    const overlapDays = Math.ceil(
        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    return {
        start: overlapStart,
        end: overlapEnd,
        days: overlapDays,
    };
}

/**
 * 특정 작업자의 일정 충돌 검사
 * @param newTask 새로 추가하거나 수정하려는 작업
 * @param existingTasks 기존 작업 목록
 * @param excludeTaskId 검사에서 제외할 작업 ID (수정 시 자기 자신 제외)
 */
export function checkScheduleConflict(
    newTask: ConflictTask,
    existingTasks: ConflictTask[],
    excludeTaskId?: string
): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // 같은 담당자의 작업만 필터링
    const sameAssigneeTasks = existingTasks.filter(
        (task) =>
            task.assignee._id === newTask.assignee._id &&
            task.id !== excludeTaskId &&
            task.id !== newTask.id
    );

    for (const existingTask of sameAssigneeTasks) {
        const overlap = getOverlapRange(
            new Date(newTask.startDate),
            new Date(newTask.endDate),
            new Date(existingTask.startDate),
            new Date(existingTask.endDate)
        );

        if (overlap) {
            conflicts.push({
                conflictingTasks: [existingTask],
                overlapDays: overlap.days,
                overlapStart: overlap.start,
                overlapEnd: overlap.end,
            });
        }
    }

    return conflicts;
}

/**
 * 작업 기간 계산 (일 단위)
 */
export function calculateTaskDuration(startDate: Date, endDate: Date): number {
    return Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
}

/**
 * 일정 조정 제안 생성
 */
export function generateAdjustmentSuggestions(
    newTask: ConflictTask,
    conflicts: ScheduleConflict[]
): AdjustmentSuggestion[] {
    if (conflicts.length === 0) {
        return [];
    }

    const suggestions: AdjustmentSuggestion[] = [];
    const taskDuration = calculateTaskDuration(
        new Date(newTask.startDate),
        new Date(newTask.endDate)
    );

    // 1. 지연 제안: 충돌하는 작업들이 끝난 후 시작
    const latestConflictEnd = conflicts.reduce((latest, conflict) => {
        const conflictEnd = new Date(conflict.overlapEnd);
        return conflictEnd > latest ? conflictEnd : latest;
    }, new Date(0));

    if (latestConflictEnd > new Date(0)) {
        const suggestedStart = new Date(latestConflictEnd);
        suggestedStart.setDate(suggestedStart.getDate() + 1);
        const suggestedEnd = new Date(suggestedStart);
        suggestedEnd.setDate(suggestedEnd.getDate() + taskDuration - 1);

        suggestions.push({
            type: 'delay',
            description: `충돌하는 작업 완료 후 시작 (${suggestedStart.toLocaleDateString('ko-KR')} ~ ${suggestedEnd.toLocaleDateString('ko-KR')})`,
            suggestedStartDate: suggestedStart,
            suggestedEndDate: suggestedEnd,
        });
    }

    // 2. 병렬 진행 제안 (경고만 표시)
    const totalOverlapDays = conflicts.reduce(
        (sum, conflict) => sum + conflict.overlapDays,
        0
    );

    suggestions.push({
        type: 'parallel',
        description: `병렬 진행 (총 ${totalOverlapDays}일 중복, 작업 효율 저하 가능)`,
    });

    // 3. 작업 분할 제안
    if (taskDuration > 3) {
        suggestions.push({
            type: 'split',
            description: `작업을 여러 단계로 분할하여 충돌 최소화`,
        });
    }

    return suggestions;
}

/**
 * 전체 프로젝트의 작업자별 일정 충돌 확인
 */
export function checkAllScheduleConflicts(
    tasks: ConflictTask[]
): Map<string, ScheduleConflict[]> {
    const conflictsByAssignee = new Map<string, ScheduleConflict[]>();

    // 작업자별로 그룹화
    const tasksByAssignee = new Map<string, ConflictTask[]>();
    for (const task of tasks) {
        const assigneeId = task.assignee._id;
        if (!tasksByAssignee.has(assigneeId)) {
            tasksByAssignee.set(assigneeId, []);
        }
        tasksByAssignee.get(assigneeId)!.push(task);
    }

    // 각 작업자별로 충돌 검사
    for (const [assigneeId, assigneeTasks] of Array.from(tasksByAssignee.entries())) {
        const conflicts: ScheduleConflict[] = [];

        for (let i = 0; i < assigneeTasks.length; i++) {
            for (let j = i + 1; j < assigneeTasks.length; j++) {
                const task1 = assigneeTasks[i];
                const task2 = assigneeTasks[j];

                const overlap = getOverlapRange(
                    new Date(task1.startDate),
                    new Date(task1.endDate),
                    new Date(task2.startDate),
                    new Date(task2.endDate)
                );

                if (overlap) {
                    conflicts.push({
                        conflictingTasks: [task1, task2],
                        overlapDays: overlap.days,
                        overlapStart: overlap.start,
                        overlapEnd: overlap.end,
                    });
                }
            }
        }

        if (conflicts.length > 0) {
            conflictsByAssignee.set(assigneeId, conflicts);
        }
    }

    return conflictsByAssignee;
}

/**
 * 충돌 심각도 계산 (0-100)
 * 높을수록 심각한 충돌
 */
export function calculateConflictSeverity(conflict: ScheduleConflict): number {
    // 겹치는 날짜가 많을수록 심각도 증가
    const daysFactor = Math.min(conflict.overlapDays * 10, 50);
    
    // 여러 작업과 충돌할수록 심각도 증가
    const tasksFactor = Math.min(conflict.conflictingTasks.length * 25, 50);
    
    return Math.min(daysFactor + tasksFactor, 100);
}
