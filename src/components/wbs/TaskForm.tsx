'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/store/wbsStore';
import { useSession } from 'next-auth/react';

/**
 * TaskForm 컴포넌트 Props 타입
 */
interface TaskFormProps {
    task?: Task | null;                    // 수정할 작업 (없으면 신규 작업)
    projectId: number;                     // 프로젝트 ID
    projectMembers: any[];                 // 프로젝트 멤버 목록 (담당자 선택용)
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
export default function TaskForm({ task, projectId, projectMembers, onSubmit, onCancel }: TaskFormProps) {
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
    });

    // 에러 메시지 상태
    const [error, setError] = useState<string | null>(null);

    // task prop이 변경되면 폼 데이터 초기화
    useEffect(() => {
        if (task) {
            // 수정 모드: 기존 작업 데이터로 폼 채우기
            setFormData({
                title: task.title,
                description: task.description || '',
                assignee: task.assignee?._id || '',
                startDate: new Date(task.startDate).toISOString().split('T')[0],
                endDate: new Date(task.endDate).toISOString().split('T')[0],
                status: task.status,
                progress: task.progress,
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
            });
        }
    }, [task, session]);

    // 입력 필드 변경 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);  // 에러 메시지 초기화
    };

    // 진행률 슬라이더 변경 핸들러
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, progress: parseInt(e.target.value) }));
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {task ? '작업 수정' : '새 작업 추가'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 작업명 */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        작업명 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="예: 로그인 기능 구현"
                        maxLength={200}
                    />
                </div>

                {/* 작업 설명 */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        작업 설명
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="작업에 대한 상세 설명을 입력하세요"
                    />
                </div>

                {/* 담당자 */}
                <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        담당자 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="assignee"
                        name="assignee"
                        value={formData.assignee}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">담당자 선택</option>
                        {projectMembers.map((member) => (
                            <option key={member._id} value={member._id}>
                                {member.nName || member.email}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 시작일 / 종료일 */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            시작일 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            종료일 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                {/* 진행 상태 */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        진행 상태
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="todo">대기</option>
                        <option value="in-progress">진행 중</option>
                        <option value="done">완료</option>
                    </select>
                </div>

                {/* 진행률 */}
                <div>
                    <label htmlFor="progress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        {task ? '수정' : '추가'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                        취소
                    </button>
                </div>
            </form>
        </div>
    );
}
