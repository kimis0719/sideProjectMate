'use client';

import { Task } from '@/store/wbsStore';

/**
 * TaskList 컴포넌트 Props 타입
 */
interface TaskListProps {
    tasks: Task[];                          // 표시할 작업 목록
    selectedTaskId: string | null;          // 현재 선택된 작업 ID
    onTaskSelect: (taskId: string) => void; // 작업 선택 이벤트
    onTaskEdit: (task: Task) => void;       // 작업 수정 이벤트
    onTaskDelete: (taskId: string) => void; // 작업 삭제 이벤트
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
export default function TaskList({ tasks, selectedTaskId, onTaskSelect, onTaskEdit, onTaskDelete }: TaskListProps) {
    // 상태별 배지 색상 반환
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'done':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                작업명
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                담당자
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                시작일
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                종료일
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                진행률
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                상태
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                작업
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    작업이 없습니다. 새 작업을 추가해보세요!
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task) => (
                                <tr
                                    key={task.id}
                                    onClick={() => onTaskSelect(task.id)}
                                    className={`cursor-pointer transition-colors ${selectedTaskId === task.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    {/* 작업명 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {task.title}
                                        </div>
                                        {task.description && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                                                {task.description}
                                            </div>
                                        )}
                                    </td>

                                    {/* 담당자 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {task.assignee?.nName || '미정'}
                                        </div>
                                    </td>

                                    {/* 시작일 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {formatDate(task.startDate)}
                                        </div>
                                    </td>

                                    {/* 종료일 */}
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {formatDate(task.endDate)}
                                        </div>
                                    </td>

                                    {/* 진행률 */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[80px]">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${task.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[35px]">
                                                {task.progress}%
                                            </span>
                                        </div>
                                    </td>

                                    {/* 상태 */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(task.status)}`}>
                                            {getStatusText(task.status)}
                                        </span>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('정말 이 작업을 삭제하시겠습니까?')) {
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
