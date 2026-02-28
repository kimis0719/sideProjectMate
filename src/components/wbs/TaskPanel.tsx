'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/store/wbsStore';
import { useSession } from 'next-auth/react';
import {
    checkScheduleConflict,
    type ScheduleConflict,
    type ConflictTask,
} from '@/lib/utils/wbs/scheduleConflict';
import type { DependencyType } from '@/lib/models/wbs/TaskModel';
import { useModal } from '@/hooks/useModal';

type Member = {
    _id: string;
    nName: string;
    email?: string;
    role?: string;
};

export type TaskFormData = {
    title: string;
    description: string;
    assignee: string;
    startDate: string;
    endDate: string;
    status: 'todo' | 'in-progress' | 'done';
    progress: number;
    phase: string;
    milestone: boolean;
    dependencies: Array<{ taskId: string; type: DependencyType }>;
    pid: number;
};

type TaskPanelProps = {
    task: Task | null;          // null이면 신규 추가 모드
    tasks: Task[];              // 의존관계 선택용 전체 작업 목록
    projectMembers: Member[];   // 담당자 선택 목록 (부모에서 전달)
    projectId: number;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TaskFormData) => Promise<void>;
    onDelete?: (taskId: string) => Promise<void>;
};

const FORM_ID = 'task-panel-form';

export default function TaskPanel({
    task,
    tasks,
    projectMembers,
    projectId,
    isOpen,
    onClose,
    onSave,
    onDelete,
}: TaskPanelProps) {
    const { data: session } = useSession();
    const { confirm } = useModal();

    const buildEmptyForm = (): TaskFormData => ({
        title: '',
        description: '',
        assignee: session?.user?._id || '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'todo',
        progress: 0,
        phase: '기본',
        milestone: false,
        dependencies: [],
        pid: projectId,
    });

    const [formData, setFormData] = useState<TaskFormData>(buildEmptyForm());
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);

    // task 또는 isOpen 변경 시 폼 초기화
    useEffect(() => {
        if (!isOpen) return;

        if (task) {
            const deps: Array<{ taskId: string; type: DependencyType }> =
                task.dependencies?.map((d) => {
                    if (typeof d === 'string') return { taskId: d, type: 'FS' };
                    if (typeof d === 'object' && d !== null) {
                        return {
                            taskId: (d as any).taskId || String(d),
                            type: ((d as any).type || 'FS') as DependencyType,
                        };
                    }
                    return { taskId: String(d), type: 'FS' };
                }) || [];

            setFormData({
                title: task.title,
                description: task.description || '',
                assignee: task.assignee?._id || '',
                startDate: new Date(task.startDate).toISOString().split('T')[0],
                endDate: new Date(task.endDate).toISOString().split('T')[0],
                status: task.status,
                progress: task.progress,
                phase: task.phase || '기본',
                milestone: task.milestone || false,
                dependencies: deps,
                pid: projectId,
            });
        } else {
            setFormData(buildEmptyForm());
        }

        setError(null);
        setConflicts([]);
    }, [task, isOpen]);

    // 담당자·날짜 변경 시 실시간 충돌 감지
    useEffect(() => {
        if (!formData.assignee || !formData.startDate || !formData.endDate) {
            setConflicts([]);
            return;
        }

        const member = projectMembers.find((m) => m._id === formData.assignee);
        if (!member) return;

        const current: ConflictTask = {
            id: task?.id || 'new',
            title: formData.title || '새 작업',
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            assignee: { _id: member._id, nName: member.nName },
        };

        const others: ConflictTask[] = tasks.map((t) => ({
            id: t.id,
            title: t.title,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            assignee: { _id: t.assignee._id, nName: t.assignee.nName },
        }));

        setConflicts(checkScheduleConflict(current, others, task?.id));
    }, [formData.assignee, formData.startDate, formData.endDate]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) { setError('작업명을 입력해주세요.'); return; }
        if (!formData.assignee) { setError('담당자를 선택해주세요.'); return; }
        if (!formData.startDate || !formData.endDate) { setError('시작일과 종료일을 입력해주세요.'); return; }
        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            setError('종료일은 시작일보다 이후여야 합니다.');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formData);
        } catch {
            setError('저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !onDelete) return;
        const ok = await confirm(
            '작업 삭제',
            `"${task.title}"을(를) 삭제하시겠습니까?`,
            { confirmText: '삭제', isDestructive: true }
        );
        if (ok) {
            await onDelete(task.id);
            onClose();
        }
    };

    const otherTasks = tasks.filter((t) => t.id !== task?.id);

    return (
        <>
            {/* 배경 오버레이 (모바일에서 패널 닫기) */}
            <div
                className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* 슬라이드인 패널 */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* 헤더 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                    <h2 className="text-lg font-semibold text-foreground">
                        {task ? '작업 상세' : '새 작업 추가'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                        aria-label="패널 닫기"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 스크롤 가능한 폼 본문 */}
                <div className="flex-1 overflow-y-auto">
                    <form id={FORM_ID} onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* ── 기본 정보 ── */}
                        <div className="space-y-4">
                            {/* 작업명 */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    작업명 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="예: 로그인 기능 구현"
                                    maxLength={200}
                                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            {/* 단계/그룹 */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">단계/그룹</label>
                                <input
                                    type="text"
                                    name="phase"
                                    value={formData.phase}
                                    onChange={handleChange}
                                    placeholder="예: 기획, 개발, 테스트"
                                    maxLength={100}
                                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            {/* 담당자 */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    담당자 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="assignee"
                                    value={formData.assignee}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="">담당자 선택</option>
                                    {projectMembers.map((m) => (
                                        <option key={m._id} value={m._id}>
                                            {m.nName || m.email}{m.role ? ` (${m.role})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 시작일 / 종료일 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        시작일 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        종료일 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* 마일스톤 */}
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.milestone}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, milestone: e.target.checked }))
                                    }
                                    className="w-4 h-4 rounded border-input accent-primary"
                                />
                                <span className="text-sm text-foreground">마일스톤으로 표시</span>
                            </label>

                            {/* 설명 */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">설명</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="작업에 대한 상세 설명"
                                    className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                />
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* ── 진행 상태 ── */}
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">진행 상태</p>
                                <div className="flex gap-2">
                                    {(['todo', 'in-progress', 'done'] as const).map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, status: s }))}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                                                formData.status === s
                                                    ? s === 'done'
                                                        ? 'bg-green-500 text-white border-green-500'
                                                        : s === 'in-progress'
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-muted text-foreground border-border'
                                                    : 'bg-background text-muted-foreground border-input hover:bg-muted'
                                            }`}
                                        >
                                            {s === 'todo' ? '대기' : s === 'in-progress' ? '진행 중' : '완료'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-foreground mb-2">
                                    진행률: {formData.progress}%
                                </p>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={formData.progress}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                progress: parseInt(e.target.value),
                                            }))
                                        }
                                        className="flex-1"
                                    />
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${formData.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* ── 선행 작업 (의존관계) ── */}
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">선행 작업 (의존관계)</p>

                            {formData.dependencies.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {formData.dependencies.map((dep, idx) => {
                                        const depTask = otherTasks.find((t) => t.id === dep.taskId);
                                        return (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                                <span className="flex-1 text-xs text-foreground truncate">
                                                    {depTask?.title || '알 수 없는 작업'}
                                                </span>
                                                <select
                                                    value={dep.type}
                                                    onChange={(e) => {
                                                        const newDeps = [...formData.dependencies];
                                                        newDeps[idx] = { ...newDeps[idx], type: e.target.value as DependencyType };
                                                        setFormData((prev) => ({ ...prev, dependencies: newDeps }));
                                                    }}
                                                    className="text-xs px-2 py-1 border border-input rounded bg-card text-foreground"
                                                >
                                                    <option value="FS">완료 후 시작 (FS)</option>
                                                    <option value="SS">동시 시작 (SS)</option>
                                                    <option value="FF">동시 완료 (FF)</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            dependencies: prev.dependencies.filter((_, i) => i !== idx),
                                                        }))
                                                    }
                                                    className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <select
                                value=""
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val && !formData.dependencies.find((d) => d.taskId === val)) {
                                        setFormData((prev) => ({
                                            ...prev,
                                            dependencies: [...prev.dependencies, { taskId: val, type: 'FS' }],
                                        }));
                                    }
                                }}
                                className="w-full px-3 py-2 text-sm border border-dashed border-input rounded-lg bg-background text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">+ 선행 작업 추가...</option>
                                {otherTasks
                                    .filter((t) => !formData.dependencies.find((d) => d.taskId === t.id))
                                    .map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* ── 일정 충돌 경고 ── */}
                        {conflicts.length > 0 && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <svg
                                        className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                                            일정 충돌 {conflicts.length}건 (저장 가능)
                                        </p>
                                        <div className="space-y-1">
                                            {conflicts.map((c, idx) => (
                                                <p key={idx} className="text-xs text-orange-800 dark:text-orange-300">
                                                    {c.conflictingTasks.map((t) => t.title).join(', ')}과 {c.overlapDays}일 겹침
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* 하단 버튼 (sticky) */}
                <div className="flex gap-3 px-6 py-4 border-t border-border bg-card flex-shrink-0">
                    {task && onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            삭제
                        </button>
                    )}
                    <button
                        type="submit"
                        form={FORM_ID}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </>
    );
}
