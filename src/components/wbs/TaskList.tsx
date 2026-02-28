'use client';

import { useState } from 'react';
import { Task } from '@/store/wbsStore';
import { checkAllScheduleConflicts } from '@/lib/utils/wbs/scheduleConflict';

interface TaskListProps {
    tasks: Task[];
    selectedTaskId: string | null;
    onTaskOpen: (task: Task) => void;    // 행 클릭 시 TaskPanel 열기
}

export default function TaskList({ tasks, selectedTaskId, onTaskOpen }: TaskListProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // 충돌 검사
    const allConflicts = checkAllScheduleConflicts(
        tasks.map((t) => ({
            id: t.id,
            title: t.title,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            assignee: { _id: t.assignee._id, nName: t.assignee.nName },
        }))
    );

    const conflictTaskIds = new Set<string>();
    for (const conflicts of Array.from(allConflicts.values())) {
        for (const c of conflicts) {
            for (const ct of c.conflictingTasks) {
                conflictTaskIds.add(ct.id);
            }
        }
    }

    const totalConflicts = Array.from(allConflicts.values()).reduce(
        (sum, conflicts) => sum + conflicts.length,
        0
    );

    const formatDate = (date: Date | string) =>
        new Date(date).toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
        });

    const getDuration = (start: Date | string, end: Date | string) =>
        Math.ceil(
            (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
        );

    const statusLabel: Record<string, string> = {
        todo: '대기',
        'in-progress': '진행 중',
        done: '완료',
    };

    const statusClass: Record<string, string> = {
        todo: 'bg-muted text-muted-foreground',
        'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            {/* 접기/펴기 헤더 */}
            <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <svg
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-medium text-foreground">
                        작업 목록 ({tasks.length}개
                        {totalConflicts > 0 && (
                            <span className="ml-1 text-orange-600 dark:text-orange-400">
                                · 충돌 {totalConflicts}건
                            </span>
                        )}
                        )
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {isExpanded ? '접기' : '펼치기'}
                </span>
            </button>

            {/* 테이블 (펼쳐진 경우만 표시) */}
            {isExpanded && (
                <div className="border-t border-border overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    작업명
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    단계
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    담당자
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    기간
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                                    진행률
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    상태
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        작업이 없습니다. 상단의 [+ 작업 추가] 버튼을 눌러보세요.
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => {
                                    const hasConflict = conflictTaskIds.has(task.id);
                                    return (
                                        <tr
                                            key={task.id}
                                            onClick={() => onTaskOpen(task)}
                                            className={`cursor-pointer transition-colors ${
                                                selectedTaskId === task.id
                                                    ? 'bg-primary/10'
                                                    : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            {/* 작업명 */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-sm font-medium text-foreground truncate">
                                                        {task.title}
                                                    </span>
                                                    {hasConflict && (
                                                        <span
                                                            title="일정 충돌"
                                                            className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                        >
                                                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            충돌
                                                        </span>
                                                    )}
                                                    {task.milestone && (
                                                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                            ★
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 단계 */}
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                    {task.phase || '기본'}
                                                </span>
                                            </td>

                                            {/* 담당자 */}
                                            <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                                                {task.assignee?.nName || '미정'}
                                            </td>

                                            {/* 기간 */}
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(task.startDate)} ~ {formatDate(task.endDate)}
                                                <span className="ml-1 text-muted-foreground/70">
                                                    ({getDuration(task.startDate, task.endDate)}일)
                                                </span>
                                            </td>

                                            {/* 진행률 — 정적 바 */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${task.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-8 text-right">
                                                        {task.progress}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 상태 */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                                        statusClass[task.status] || statusClass.todo
                                                    }`}
                                                >
                                                    {statusLabel[task.status] || '대기'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
