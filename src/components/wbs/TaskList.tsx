'use client';

import { useState } from 'react';
import { Task } from '@/store/wbsStore';
import { checkAllScheduleConflicts, calculateConflictSeverity } from '@/lib/utils/wbs/scheduleConflict';
import { useModal } from '@/hooks/useModal';

/**
 * TaskList 컴포넌트 Props 타입
 */
interface TaskListProps {
    tasks: Task[];                          // 표시할 작업 목록
    selectedTaskId: string | null;          // 현재 선택된 작업 ID
    onTaskSelect: (taskId: string) => void; // 작업 선택 이벤트
    onTaskEdit: (task: Task) => void;       // 작업 수정 이벤트
    onTaskDelete: (taskId: string) => void; // 작업 삭제 이벤트
    onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void; // 작업 빠른 업데이트 이벤트
}

/**
 * TaskList 컴포넌트
 * 작업 목록을 테이블 형태로 표시하는 컴포넌트
 * 
 * 주요 기능:
 * - 작업명, 담당자, 시작일, 종료일, 진행률, 상태 표시
 * - 각 행 클릭 시 해당 작업 선택 (간트차트에서 하이라이트)
 * - 수정/삭제 버튼
 */
export default function TaskList({ tasks, selectedTaskId, onTaskSelect, onTaskEdit, onTaskDelete, onTaskUpdate }: TaskListProps) {
    const { confirm } = useModal();
    // 전체 작업의 충돌 검사
    const allConflicts = checkAllScheduleConflicts(
        tasks.map(task => ({
            id: task.id,
            title: task.title,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate),
            assignee: {
                _id: task.assignee._id,
                nName: task.assignee.nName,
            },
        }))
    );

    // 특정 작업이 충돌이 있는지 확인
    const hasConflict = (taskId: string): boolean => {
        for (const conflicts of Array.from(allConflicts.values())) {
            for (const conflict of conflicts) {
                if (conflict.conflictingTasks.some((t: { id: string }) => t.id === taskId)) {
                    return true;
                }
            }
        }
        return false;
    };

    // 상태별 배지 색상 반환
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'done':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    // 상태 텍스트 반환
    const getStatusText = (status: string) => {
        switch (status) {
            case 'done':
                return '완료';
            case 'in-progress':
                return '진행 중';
            default:
                return '대기';
        }
    };

    // 날짜 포맷팅 (YYYY-MM-DD)
    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                작업명
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                단계/그룹
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                담당자
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                시작일
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                종료일
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                소요기간
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                진행률
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                상태
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                작업
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                                    작업이 없습니다. 새 작업을 추가해보세요!
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task) => (
                                <tr
                                    key={task.id}
                                    onClick={() => onTaskSelect(task.id)}
                                    className={`cursor-pointer transition-colors ${selectedTaskId === task.id
                                        ? 'bg-primary/10'
                                        : 'hover:bg-muted/50'
                                        }`}
                                >
                                    {/* 작업명 */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-foreground">
                                                {task.title}
                                            </div>
                                            {hasConflict(task.id) && (
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" title="일정 충돌">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    충돌
                                                </span>
                                            )}
                                            {task.milestone && (
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 2l2.5 7.5H20l-6 4.5 2.5 7.5L10 17l-6.5 4.5L6 14 0 9.5h7.5z" />
                                                    </svg>
                                                    마일스톤
                                                </span>
                                            )}
                                        </div>
                                        {task.description && (
                                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                                                {task.description}
                                            </div>
                                        )}
                                    </td>

                                    {/* 단계/그룹명 */}
                                    <td className="px-4 py-3">
                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                            {task.phase || '기본'}
                                        </span>
                                    </td>

                                    {/* 담당자 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-foreground">
                                            {task.assignee?.nName || '미정'}
                                        </div>
                                    </td>

                                    {/* 시작일 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-foreground">
                                            {formatDate(task.startDate)}
                                        </div>
                                    </td>

                                    {/* 종료일 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-foreground">
                                            {formatDate(task.endDate)}
                                        </div>
                                    </td>

                                    {/* 소요기간 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-foreground">
                                            {Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))}일
                                        </div>
                                    </td>

                                    {/* 진행률 */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="5"
                                                value={task.progress}
                                                onChange={(e) => {
                                                    const newProgress = parseInt(e.target.value);
                                                    onTaskUpdate?.(task.id, { progress: newProgress });
                                                }}
                                                className="flex-1 max-w-[80px] cursor-pointer"
                                                title={`진행률: ${task.progress}%`}
                                            />
                                            <span className="text-xs text-muted-foreground min-w-[35px] font-medium">
                                                {task.progress}%
                                            </span>
                                        </div>
                                    </td>

                                    {/* 상태 */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTaskUpdate?.(task.id, { status: 'todo' });
                                                }}
                                                className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${task.status === 'todo'
                                                    ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }`}
                                                title="대기"
                                            >
                                                대기
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTaskUpdate?.(task.id, { status: 'in-progress' });
                                                }}
                                                className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${task.status === 'in-progress'
                                                    ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900'
                                                    }`}
                                                title="진행 중"
                                            >
                                                진행
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTaskUpdate?.(task.id, { status: 'done', progress: 100 });
                                                }}
                                                className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${task.status === 'done'
                                                    ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900'
                                                    }`}
                                                title="완료"
                                            >
                                                완료
                                            </button>
                                        </div>
                                    </td>

                                    {/* 작업 버튼 */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTaskEdit(task);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const ok = await confirm('작업 삭제', '정말 이 작업을 삭제하시겠습니까?');
                                                    if (ok) {
                                                        onTaskDelete(task.id);
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
