'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/store/wbsStore';
import { useSession } from 'next-auth/react';
import {
    checkScheduleConflict,
    generateAdjustmentSuggestions,
    type ScheduleConflict,
    type AdjustmentSuggestion,
    type ConflictTask
} from '@/lib/utils/wbs/scheduleConflict';
import {
    validateDependencyConstraint,
    getDependencyTypeDescription,
    type TaskDependency
} from '@/lib/utils/wbs/taskDependency';
import type { DependencyType } from '@/lib/models/wbs/TaskModel';

/**
 * TaskForm 컴포넌트 Props 타입
 */
interface TaskFormProps {
    task?: Task | null;                    // 수정할 작업 (없으면 신규 작업)
    projectId: number;                     // 프로젝트 ID
    projectMembers: any[];                 // 프로젝트 멤버 목록 (담당자 선택용)
    existingTasks: Task[];                 // 기존 작업 목록 (충돌 검사용)
    onSubmit: (taskData: any) => void;     // 폼 제출 이벤트
    onCancel: () => void;                  // 취소 이벤트
}

/**
 * TaskForm 컴포넌트
 * 작업 추가/수정을 위한 폼 컴포넌트
 * 
 * 주요 기능:
 * - 작업명, 설명, 담당자, 시작일/종료일, 상태, 진행률 입력
 * - 신규 작업 추가 또는 기존 작업 수정
 * - 유효성 검증 (종료일 >= 시작일)
 */
export default function TaskForm({ task, projectId, projectMembers, existingTasks, onSubmit, onCancel }: TaskFormProps) {
    const { data: session } = useSession();

    // 폼 상태 관리
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignee: '',
        startDate: '',
        endDate: '',
        status: 'todo' as 'todo' | 'in-progress' | 'done',
        progress: 0,
        phase: '기본',
        milestone: false,
        dependencies: [] as Array<{ taskId: string; type: DependencyType }>,
    });

    // 에러 메시지 상태
    const [error, setError] = useState<string | null>(null);

    // 일정 충돌 및 조정 제안 상태
    const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
    const [suggestions, setSuggestions] = useState<AdjustmentSuggestion[]>([]);

    // 프로젝트 지원자 목록 상태
    const [applicants, setApplicants] = useState<Array<{ _id: string; nName: string; email?: string; status: 'pending' | 'accepted' | 'rejected'; role?: string }>>([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    // 프로젝트 담당자(작성자)
    const [projectOwner, setProjectOwner] = useState<{ _id: string; nName: string } | null>(null);
    const [loadingOwner, setLoadingOwner] = useState(false);

    // task prop이 변경되면 폼 데이터 초기화
    useEffect(() => {
        if (task) {
            // 수정 모드: 기존 작업 데이터로 폼 채우기
            const taskDependencies = task.dependencies?.map(d => {
                // 문자열인 경우 (ObjectId가 문자열로 변환된 경우)
                if (typeof d === 'string') {
                    return { taskId: d, type: 'FS' as DependencyType };
                }
                // 객체인 경우
                if (typeof d === 'object' && d !== null) {
                    return {
                        taskId: (d as any).taskId || (d as any)._id || String(d),
                        type: ((d as any).type || 'FS') as DependencyType,
                    };
                }
                // 기타 경우
                return { taskId: String(d), type: 'FS' as DependencyType };
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
                dependencies: taskDependencies,
            });
        } else {
            // 신규 모드: 기본값으로 초기화
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            setFormData({
                title: '',
                description: '',
                assignee: session?.user?._id || '',
                startDate: today,
                endDate: nextWeek,
                status: 'todo',
                progress: 0,
                phase: '기본',
                milestone: false,
                dependencies: [],
            });
        }
    }, [task, session]);

    // 프로젝트 지원자 목록 불러오기
    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                setLoadingApplicants(true);
                const res = await fetch(`/api/applications/by-project/${projectId}`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const list = json.data.map((item: any) => ({
                        _id: item.applicant?._id || '',
                        nName: item.applicant?.nName || item.applicant?.email || '지원자',
                        email: item.applicant?.email,
                        status: item.status,
                        role: item.role,
                    }));
                    setApplicants(list);
                }
            } catch (e) {
                // 실패 시 무시
            } finally {
                setLoadingApplicants(false);
            }
        };
        const fetchOwner = async () => {
            try {
                setLoadingOwner(true);
                const res = await fetch(`/api/projects/${projectId}`);
                const json = await res.json();
                if (json.success && json.data?.author?._id) {
                    setProjectOwner({ _id: json.data.author._id, nName: json.data.author.nName || '작성자' });
                }
            } catch (e) {
                // 실패 시 무시
            } finally {
                setLoadingOwner(false);
            }
        };
        if (projectId) {
            fetchApplicants();
            fetchOwner();
        }
    }, [projectId]);

    // 입력 필드 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);  // 에러 메시지 초기화
    };

    // 날짜 또는 담당자 변경 시 충돌 검사
    useEffect(() => {
        if (formData.startDate && formData.endDate && formData.assignee) {
            checkConflicts();
        }
    }, [formData.startDate, formData.endDate, formData.assignee]);

    // 일정 충돌 검사 함수
    const checkConflicts = () => {
        if (!formData.assignee || !formData.startDate || !formData.endDate) {
            setConflicts([]);
            setSuggestions([]);
            return;
        }

        const selectedMember = projectMembers.find(m => m._id === formData.assignee);
        if (!selectedMember) return;

        const newTask: ConflictTask = {
            id: task?.id || 'new',
            title: formData.title || '새 작업',
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            assignee: {
                _id: selectedMember._id,
                nName: selectedMember.nName || selectedMember.email,
            },
        };

        const conflictTasks: ConflictTask[] = existingTasks.map(t => ({
            id: t.id,
            title: t.title,
            startDate: new Date(t.startDate),
            endDate: new Date(t.endDate),
            assignee: {
                _id: t.assignee._id,
                nName: t.assignee.nName,
            },
        }));

        const detectedConflicts = checkScheduleConflict(
            newTask,
            conflictTasks,
            task?.id // 수정 모드일 때 자기 자신 제외
        );

        setConflicts(detectedConflicts);

        if (detectedConflicts.length > 0) {
            const adjustments = generateAdjustmentSuggestions(newTask, detectedConflicts);
            setSuggestions(adjustments);
        } else {
            setSuggestions([]);
        }
    };

    // 진행률 슬라이더 변경 핸들러
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, progress: parseInt(e.target.value) }));
    };

    // 마일스톤 체크박스 변경 핸들러
    const handleMilestoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, milestone: e.target.checked }));
    };

    // 일정 조정 제안 적용
    const applySuggestion = (suggestion: AdjustmentSuggestion) => {
        if (suggestion.suggestedStartDate && suggestion.suggestedEndDate) {
            setFormData(prev => ({
                ...prev,
                startDate: suggestion.suggestedStartDate!.toISOString().split('T')[0],
                endDate: suggestion.suggestedEndDate!.toISOString().split('T')[0],
            }));
        }
    };

    // 폼 제출 핸들러
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검증
        if (!formData.title.trim()) {
            setError('작업명을 입력해주세요.');
            return;
        }

        if (!formData.assignee) {
            setError('담당자를 선택해주세요.');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            setError('시작일과 종료일을 입력해주세요.');
            return;
        }

        // 날짜 검증: 종료일이 시작일보다 이전인지 확인
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end < start) {
            setError('종료일은 시작일보다 이후여야 합니다.');
            return;
        }

        // 부모 컴포넌트로 데이터 전달
        onSubmit({
            ...formData,
            pid: projectId,
            startDate: start,
            endDate: end,
        });
    };

    return (
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
                {task ? '작업 수정' : '새 작업 추가'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 작업명 */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                        작업명 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        placeholder="예: 로그인 기능 구현"
                        maxLength={200}
                    />
                </div>

                {/* 작업 설명 */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                        작업 설명
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        placeholder="작업에 대한 상세 설명을 입력하세요"
                    />
                </div>

                {/* 담당자 */}
                <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-foreground mb-1">
                        담당자 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="assignee"
                        name="assignee"
                        value={formData.assignee}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                        <option value="">담당자 선택</option>
                        {/* 프로젝트 담당자(작성자) */}
                        {projectOwner && (
                            <optgroup label="프로젝트 담당자">
                                <option key={`owner-${projectOwner._id}`} value={projectOwner._id}>
                                    {projectOwner.nName} (작성자)
                                </option>
                            </optgroup>
                        )}
                        {/* 프로젝트 멤버 */}
                        <optgroup label="프로젝트 멤버" className="text-foreground bg-background">
                            {projectMembers.map((member) => (
                                <option key={`member-${member._id}`} value={member._id}>
                                    {member.nName || member.email}
                                </option>
                            ))}
                        </optgroup>
                        {/* 지원자 목록 */}
                        {applicants.length > 0 && (
                            <optgroup label="프로젝트 지원자">
                                {applicants.map((app) => (
                                    <option key={`applicant-${app._id}`} value={app._id}>
                                        {app.nName} {app.status === 'accepted' ? '(수락)' : app.status === 'pending' ? '(대기)' : '(거절)'}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                    {loadingApplicants && (
                        <p className="mt-1 text-xs text-muted-foreground">지원자 목록 불러오는 중...</p>
                    )}
                    {loadingOwner && (
                        <p className="mt-1 text-xs text-muted-foreground">프로젝트 담당자 확인 중...</p>
                    )}
                </div>

                {/* 시작일 / 종료일 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
                            시작일 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
                            종료일 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        />
                    </div>
                </div>

                {/* 단계/그룹명 */}
                <div>
                    <label htmlFor="phase" className="block text-sm font-medium text-foreground mb-1">
                        단계/그룹명
                    </label>
                    <input
                        type="text"
                        id="phase"
                        name="phase"
                        value={formData.phase}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                        placeholder="예: 기획, 개발, 테스트, 배포"
                        maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        작업을 그룹화하는 단계를 지정하세요. 같은 단계의 작업들이 함께 표시됩니다.
                    </p>
                </div>

                {/* 마일스톤 체크박스 */}
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <input
                        type="checkbox"
                        id="milestone"
                        name="milestone"
                        checked={formData.milestone}
                        onChange={handleMilestoneChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="milestone" className="flex-1 text-sm">
                        <span className="font-medium text-foreground">마일스톤으로 표시</span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                            이 작업을 해당 단계의 주요 완료 시점으로 표시합니다. 간트차트에서 다이아몬드 모양으로 표시됩니다.
                        </span>
                    </label>
                </div>

                {/* 선행 작업 의존관계 설정 */}
                <div className="border border-border rounded-lg p-4">
                    <label className="block text-sm font-medium text-foreground mb-3">
                        선행 작업 (Dependencies)
                    </label>
                    <p className="text-xs text-muted-foreground mb-3">
                        이 작업이 시작되기 위해 필요한 선행 작업을 설정하세요.
                    </p>

                    {/* 의존관계 목록 */}
                    <div className="space-y-2 mb-3">
                        {formData.dependencies.map((dep, idx) => {
                            const depTask = existingTasks.find(t => t.id === dep.taskId);
                            return (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                                    <span className="flex-1 text-sm text-foreground">
                                        {depTask?.title || '알 수 없는 작업'}
                                    </span>
                                    <select
                                        value={dep.type}
                                        onChange={(e) => {
                                            const newDeps = [...formData.dependencies];
                                            newDeps[idx].type = e.target.value as DependencyType;
                                            setFormData(prev => ({ ...prev, dependencies: newDeps }));
                                        }}
                                        className="text-xs px-2 py-1 border border-input rounded bg-card text-foreground"
                                    >
                                        <option value="FS">FS (완료 후 시작)</option>
                                        <option value="SS">SS (동시 시작)</option>
                                        <option value="FF">FF (동시 완료)</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                dependencies: prev.dependencies.filter((_, i) => i !== idx)
                                            }));
                                        }}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* 선행 작업 추가 */}
                    <div className="flex gap-2">
                        <select
                            className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-card text-foreground"
                            onChange={(e) => {
                                if (e.target.value && !formData.dependencies.find(d => d.taskId === e.target.value)) {
                                    setFormData(prev => ({
                                        ...prev,
                                        dependencies: [...prev.dependencies, { taskId: e.target.value, type: 'FS' }]
                                    }));
                                    e.target.value = '';
                                }
                            }}
                        >
                            <option value="">선행 작업 추가...</option>
                            {existingTasks
                                .filter(t => t.id !== task?.id && !formData.dependencies.find(d => d.taskId === t.id))
                                .map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.title}
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* 의존관계 타입 설명 */}
                    <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
                        <div className="space-y-1">
                            <div><strong>FS (Finish-to-Start):</strong> 선행 작업 완료 후 현재 작업 시작</div>
                            <div><strong>SS (Start-to-Start):</strong> 선행 작업과 동시에 시작 가능</div>
                            <div><strong>FF (Finish-to-Finish):</strong> 선행 작업과 동시에 완료</div>
                        </div>
                    </div>
                </div>

                {/* 진행 상태 */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                        진행 상태
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                    >
                        <option value="todo">대기</option>
                        <option value="in-progress">진행 중</option>
                        <option value="done">완료</option>
                    </select>
                </div>

                {/* 진행률 */}
                <div>
                    <label htmlFor="progress" className="block text-sm font-medium text-foreground mb-1">
                        진행률: {formData.progress}%
                    </label>
                    <input
                        type="range"
                        id="progress"
                        name="progress"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.progress}
                        onChange={handleProgressChange}
                        className="w-full"
                    />
                </div>

                {/* 일정 충돌 경고 */}
                {conflicts.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-200 mb-2">
                                    일정 충돌 감지 ({conflicts.length}건)
                                </h4>
                                <div className="space-y-2">
                                    {conflicts.map((conflict, idx) => (
                                        <div key={idx} className="text-xs text-orange-800 dark:text-orange-300">
                                            {conflict.conflictingTasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-2">
                                                    <span className="font-medium">{task.title}</span>
                                                    <span className="text-orange-600 dark:text-orange-400">
                                                        ({conflict.overlapDays}일 중복)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* 조정 제안 */}
                                {suggestions.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                                        <p className="text-xs font-medium text-orange-900 dark:text-orange-200 mb-2">
                                            일정 조정 제안:
                                        </p>
                                        <div className="space-y-2">
                                            {suggestions.map((suggestion, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                    {suggestion.type === 'delay' && suggestion.suggestedStartDate ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => applySuggestion(suggestion)}
                                                            className="flex-1 text-left px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                                                        >
                                                            <span className="font-medium text-orange-900 dark:text-orange-200">
                                                                {suggestion.type === 'delay' ? '📅 ' : suggestion.type === 'parallel' ? '⚠️ ' : '✂️ '}
                                                            </span>
                                                            <span className="text-orange-800 dark:text-orange-300">
                                                                {suggestion.description}
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex-1 px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded">
                                                            <span className="font-medium text-orange-900 dark:text-orange-200">
                                                                {suggestion.type === 'delay' ? '📅 ' : suggestion.type === 'parallel' ? '⚠️ ' : '✂️ '}
                                                            </span>
                                                            <span className="text-orange-800 dark:text-orange-300">
                                                                {suggestion.description}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        {task ? '수정' : '추가'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}
