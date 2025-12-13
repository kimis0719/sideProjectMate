/**
 * 작업 의존관계 유틸리티
 * 작업 간의 선행/후행 관계를 식별하고 관리하는 함수들을 제공합니다.
 */

import type { DependencyType, IDependency } from '@/lib/models/wbs/TaskModel';

export interface TaskDependency {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    dependencies: {
        taskId: string;
        type: DependencyType;
    }[];
}

/**
 * 특정 작업의 선행 작업 목록 조회
 * @param task 조회할 작업
 * @param allTasks 전체 작업 목록
 */
export function getPredecessorTasks(
    task: TaskDependency,
    allTasks: TaskDependency[]
): Array<{ task: TaskDependency; type: DependencyType }> {
    const predecessors: Array<{ task: TaskDependency; type: DependencyType }> = [];

    for (const dep of task.dependencies) {
        const predecessorTask = allTasks.find(t => t.id === dep.taskId);
        if (predecessorTask) {
            predecessors.push({
                task: predecessorTask,
                type: dep.type,
            });
        }
    }

    return predecessors;
}

/**
 * 특정 작업의 후행 작업 목록 조회
 * @param task 조회할 작업
 * @param allTasks 전체 작업 목록
 */
export function getSuccessorTasks(
    task: TaskDependency,
    allTasks: TaskDependency[]
): Array<{ task: TaskDependency; type: DependencyType }> {
    const successors: Array<{ task: TaskDependency; type: DependencyType }> = [];

    for (const otherTask of allTasks) {
        for (const dep of otherTask.dependencies) {
            if (dep.taskId === task.id) {
                successors.push({
                    task: otherTask,
                    type: dep.type,
                });
            }
        }
    }

    return successors;
}

/**
 * 작업 간 의존관계 타입에 따른 제약 조건 검증
 */
export function validateDependencyConstraint(
    task: TaskDependency,
    predecessor: TaskDependency,
    dependencyType: DependencyType
): { valid: boolean; message?: string } {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const predStart = new Date(predecessor.startDate);
    const predEnd = new Date(predecessor.endDate);

    switch (dependencyType) {
        case 'FS': // Finish-to-Start: 선행 작업이 끝나야 후행 작업 시작
            if (taskStart < predEnd) {
                return {
                    valid: false,
                    message: `"${task.title}"은(는) "${predecessor.title}"이(가) 완료된 후에 시작되어야 합니다. (FS)`,
                };
            }
            break;

        case 'SS': // Start-to-Start: 선행 작업 시작과 동시에 후행 작업 시작 가능
            if (taskStart < predStart) {
                return {
                    valid: false,
                    message: `"${task.title}"은(는) "${predecessor.title}"과(와) 동시 또는 이후에 시작되어야 합니다. (SS)`,
                };
            }
            break;

        case 'FF': // Finish-to-Finish: 선행 작업과 후행 작업이 동시에 끝나야 함
            if (taskEnd < predEnd) {
                return {
                    valid: false,
                    message: `"${task.title}"은(는) "${predecessor.title}"과(와) 동시 또는 이후에 완료되어야 합니다. (FF)`,
                };
            }
            break;
    }

    return { valid: true };
}

/**
 * 모든 의존관계 제약 조건 검증
 */
export function validateAllDependencies(
    task: TaskDependency,
    allTasks: TaskDependency[]
): Array<{ valid: boolean; message?: string }> {
    const results: Array<{ valid: boolean; message?: string }> = [];
    const predecessors = getPredecessorTasks(task, allTasks);

    for (const { task: pred, type } of predecessors) {
        results.push(validateDependencyConstraint(task, pred, type));
    }

    return results;
}

/**
 * 병렬 진행 가능한 작업 식별
 * SS 또는 FF 타입의 의존관계를 가진 작업들은 병렬 진행 가능
 */
export function identifyParallelTasks(
    tasks: TaskDependency[]
): Map<string, TaskDependency[]> {
    const parallelGroups = new Map<string, TaskDependency[]>();

    for (const task of tasks) {
        const predecessors = getPredecessorTasks(task, tasks);
        const parallelPreds = predecessors.filter(
            ({ type }) => type === 'SS' || type === 'FF'
        );

        if (parallelPreds.length > 0) {
            for (const { task: pred } of parallelPreds) {
                const groupKey = pred.id;
                if (!parallelGroups.has(groupKey)) {
                    parallelGroups.set(groupKey, [pred]);
                }
                parallelGroups.get(groupKey)!.push(task);
            }
        }
    }

    return parallelGroups;
}

/**
 * 직렬 진행 작업 식별
 * FS 타입의 의존관계를 가진 작업들은 직렬 진행
 */
export function identifySerialTasks(
    tasks: TaskDependency[]
): Array<TaskDependency[]> {
    const serialChains: Array<TaskDependency[]> = [];
    const visited = new Set<string>();

    for (const task of tasks) {
        if (visited.has(task.id)) continue;

        const chain: TaskDependency[] = [task];
        visited.add(task.id);

        // 후행 작업 추적 (FS 타입만)
        let current = task;
        while (true) {
            const successors = getSuccessorTasks(current, tasks);
            const fsSuccessor = successors.find(({ type }) => type === 'FS');

            if (!fsSuccessor || visited.has(fsSuccessor.task.id)) break;

            chain.push(fsSuccessor.task);
            visited.add(fsSuccessor.task.id);
            current = fsSuccessor.task;
        }

        if (chain.length > 1) {
            serialChains.push(chain);
        }
    }

    return serialChains;
}

/**
 * 순환 의존성 검사
 * 작업 A -> B -> C -> A와 같은 순환 참조를 감지
 */
export function detectCircularDependency(
    task: TaskDependency,
    allTasks: TaskDependency[],
    visited: Set<string> = new Set(),
    path: string[] = []
): { hasCircular: boolean; cycle?: string[] } {
    if (visited.has(task.id)) {
        const cycleStart = path.indexOf(task.id);
        return {
            hasCircular: true,
            cycle: [...path.slice(cycleStart), task.id],
        };
    }

    visited.add(task.id);
    path.push(task.id);

    const successors = getSuccessorTasks(task, allTasks);
    for (const { task: successor } of successors) {
        const result = detectCircularDependency(
            successor,
            allTasks,
            new Set(visited),
            [...path]
        );
        if (result.hasCircular) {
            return result;
        }
    }

    return { hasCircular: false };
}

/**
 * 크리티컬 패스 계산
 * 프로젝트 완료까지 가장 긴 경로 (지연 시 전체 일정에 영향)
 */
export function calculateCriticalPath(
    tasks: TaskDependency[]
): TaskDependency[] {
    const taskEarliestStart = new Map<string, Date>();
    const taskLatestStart = new Map<string, Date>();

    // Forward pass: 최조 시작 시간 계산
    const sortedTasks = topologicalSort(tasks);
    for (const task of sortedTasks) {
        const predecessors = getPredecessorTasks(task, tasks);
        let earliestStart = new Date(task.startDate);

        for (const { task: pred, type } of predecessors) {
            const predStart = taskEarliestStart.get(pred.id) || new Date(pred.startDate);
            const predEnd = new Date(pred.endDate);

            if (type === 'FS' && predEnd > earliestStart) {
                earliestStart = predEnd;
            }
        }

        taskEarliestStart.set(task.id, earliestStart);
    }

    // Backward pass: 최지 시작 시간 계산
    const projectEnd = new Date(
        Math.max(...tasks.map(t => new Date(t.endDate).getTime()))
    );

    for (let i = sortedTasks.length - 1; i >= 0; i--) {
        const task = sortedTasks[i];
        const successors = getSuccessorTasks(task, tasks);
        let latestStart = new Date(projectEnd);

        if (successors.length === 0) {
            latestStart = new Date(task.endDate);
        } else {
            for (const { task: succ, type } of successors) {
                const succLatest = taskLatestStart.get(succ.id) || new Date(succ.startDate);

                if (type === 'FS' && succLatest < latestStart) {
                    latestStart = succLatest;
                }
            }
        }

        taskLatestStart.set(task.id, latestStart);
    }

    // Critical path: earliest === latest인 작업들
    const criticalPath: TaskDependency[] = [];
    for (const task of tasks) {
        const earliest = taskEarliestStart.get(task.id);
        const latest = taskLatestStart.get(task.id);

        if (earliest && latest && earliest.getTime() === latest.getTime()) {
            criticalPath.push(task);
        }
    }

    return criticalPath;
}

/**
 * 위상 정렬 (Topological Sort)
 * 의존관계에 따라 작업을 정렬
 */
function topologicalSort(tasks: TaskDependency[]): TaskDependency[] {
    const sorted: TaskDependency[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    function visit(task: TaskDependency) {
        if (temp.has(task.id)) return; // 순환 감지
        if (visited.has(task.id)) return;

        temp.add(task.id);

        const predecessors = getPredecessorTasks(task, tasks);
        for (const { task: pred } of predecessors) {
            visit(pred);
        }

        temp.delete(task.id);
        visited.add(task.id);
        sorted.push(task);
    }

    for (const task of tasks) {
        if (!visited.has(task.id)) {
            visit(task);
        }
    }

    return sorted;
}

/**
 * 의존관계 타입 설명 반환
 */
export function getDependencyTypeDescription(type: DependencyType): string {
    switch (type) {
        case 'FS':
            return 'Finish-to-Start (선행 작업 완료 후 시작)';
        case 'SS':
            return 'Start-to-Start (동시 시작 가능)';
        case 'FF':
            return 'Finish-to-Finish (동시 완료)';
    }
}
