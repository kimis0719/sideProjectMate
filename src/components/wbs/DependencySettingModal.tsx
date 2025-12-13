/**
 * 의존관계 타입 설정 모달 컴포넌트
 * 간트차트에서 작업을 선택했을 때 의존관계 타입을 설정할 수 있는 모달을 표시합니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/store/wbsStore';
import type { DependencyType } from '@/lib/models/wbs/TaskModel';

interface DependencySettingModalProps {
    isOpen: boolean;
    selectedTask: Task | null;
    allTasks: Task[];
    onClose: () => void;
    onSaveDependency: (taskId: string, dependencies: Array<{ taskId: string; type: DependencyType }>) => Promise<void>;
}

export default function DependencySettingModal({
    isOpen,
    selectedTask,
    allTasks,
    onClose,
    onSaveDependency,
}: DependencySettingModalProps) {
    const [dependencies, setDependencies] = useState<Array<{ taskId: string; type: DependencyType }>>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 모달이 열릴 때 선택된 작업의 의존관계 로드
    useEffect(() => {
        if (isOpen && selectedTask) {
            const deps = selectedTask.dependencies?.map(d => ({
                taskId: typeof d === 'string' ? d : (d as any).taskId || String(d),
                type: (typeof d === 'object' && d !== null && 'type' in d ? (d as any).type : 'FS') as DependencyType,
            })) || [];
            setDependencies(deps);
            setError(null);
        }
    }, [isOpen, selectedTask]);

    const handleAddDependency = () => {
        const availableTasks = allTasks.filter(
            t => t.id !== selectedTask?.id && !dependencies.find(d => d.taskId === t.id)
        );

        if (availableTasks.length > 0) {
            setDependencies([...dependencies, { taskId: availableTasks[0].id, type: 'FS' }]);
        }
    };

    const handleRemoveDependency = (index: number) => {
        setDependencies(dependencies.filter((_, i) => i !== index));
    };

    const handleTypeChange = (index: number, type: DependencyType) => {
        const newDeps = [...dependencies];
        newDeps[index].type = type;
        setDependencies(newDeps);
    };

    const handleTaskChange = (index: number, taskId: string) => {
        const newDeps = [...dependencies];
        newDeps[index].taskId = taskId;
        setDependencies(newDeps);
    };

    const handleSave = async () => {
        if (!selectedTask) return;

        setIsSaving(true);
        setError(null);

        try {
            await onSaveDependency(selectedTask.id, dependencies);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : '의존관계 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !selectedTask) return null;

    const availableTasks = allTasks.filter(
        t => t.id !== selectedTask.id && !dependencies.find(d => d.taskId === t.id)
    );

    return (
        <>
            {/* 배경 오버레이 */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* 모달 */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* 헤더 */}
                    <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                의존관계 설정
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                작업: <span className="font-semibold">{selectedTask.title}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 내용 */}
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* 의존관계 리스트 */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                선행 작업 ({dependencies.length})
                            </h3>

                            {dependencies.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                                    선행 작업이 없습니다.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {dependencies.map((dep, idx) => {
                                        const depTask = allTasks.find(t => t.id === dep.taskId);
                                        return (
                                            <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <select
                                                        value={dep.taskId}
                                                        onChange={(e) => handleTaskChange(idx, e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                                                    >
                                                        <option value={dep.taskId}>{depTask?.title || '알 수 없는 작업'}</option>
                                                        {allTasks
                                                            .filter(t => t.id !== selectedTask.id && t.id !== dep.taskId && !dependencies.find(d => d.taskId === t.id))
                                                            .map(t => (
                                                                <option key={t.id} value={t.id}>
                                                                    {t.title}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>

                                                <select
                                                    value={dep.type}
                                                    onChange={(e) => handleTypeChange(idx, e.target.value as DependencyType)}
                                                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                                                >
                                                    <option value="FS">FS</option>
                                                    <option value="SS">SS</option>
                                                    <option value="FF">FF</option>
                                                </select>

                                                <button
                                                    onClick={() => handleRemoveDependency(idx)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 선행 작업 추가 */}
                        {availableTasks.length > 0 && (
                            <button
                                onClick={handleAddDependency}
                                className="w-full px-4 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                            >
                                + 선행 작업 추가
                            </button>
                        )}

                        {/* 의존관계 타입 설명 */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                                의존관계 타입
                            </h4>
                            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                                <div>
                                    <span className="font-medium">FS (Finish-to-Start)</span>: 선행 작업 완료 후 현재 작업 시작
                                </div>
                                <div>
                                    <span className="font-medium">SS (Start-to-Start)</span>: 선행 작업과 동시에 현재 작업 시작 가능
                                </div>
                                <div>
                                    <span className="font-medium">FF (Finish-to-Finish)</span>: 선행 작업과 동시에 현재 작업 완료
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 푸터 */}
                    <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium"
                        >
                            {isSaving ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
