'use client';

import { useEffect, useState } from 'react';
import { useWbsStore, Task } from '@/store/wbsStore';
import GanttChart from '@/components/wbs/GanttChart';
import TaskForm from '@/components/wbs/TaskForm';
import TaskList from '@/components/wbs/TaskList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { checkAllScheduleConflicts } from '@/lib/utils/wbs/scheduleConflict';
import DependencySettingModal from '@/components/wbs/DependencySettingModal';
import type { DependencyType } from '@/lib/models/wbs/TaskModel';

/**
 * WBS (Work Breakdown Structure) 페이지
 * 프로젝트의 작업을 간트차트 형태로 시각화하고 관리하는 페이지입니다.
 * 
 * 주요 기능:
 * - 간트차트로 작업 타임라인 시각화
 * - 작업 추가/수정/삭제
 * - 드래그로 작업 날짜 변경
 * - 작업 목록 테이블 뷰
 */
export default function WBSPage({ params }: { params: { pid: string } }) {
    const { pid } = params;
    const projectId = parseInt(pid, 10);

    // 인증 및 라우팅
    const { data: session, status } = useSession();
    const router = useRouter();

    // Zustand Store에서 상태와 액션 가져오기
    const {
        tasks,
        selectedTaskId,
        viewMode,
        isLoading,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        updateTaskDates,
        selectTask,
        setViewMode,
    } = useWbsStore();

    // 로컬 상태
    const [showTaskForm, setShowTaskForm] = useState(false);      // 작업 폼 표시 여부
    const [editingTask, setEditingTask] = useState<Task | null>(null);  // 수정 중인 작업
    const [projectMembers, setProjectMembers] = useState<any[]>([]);    // 프로젝트 멤버 목록
    const [showDependencyModal, setShowDependencyModal] = useState(false);  // 의존관계 설정 모달 표시 여부
    const [dateRangeMonths, setDateRangeMonths] = useState(12);  // 표시 기간 (개월 수)

    // 인증 확인
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // 프로젝트 작업 목록 및 멤버 정보 가져오기
    useEffect(() => {
        if (status === 'authenticated' && projectId) {
            // 작업 목록 조회
            fetchTasks(projectId);

            // 프로젝트 멤버 정보 조회 (담당자 선택용)
            // 1. 프로젝트 작성자 (author)
            // 2. 승인된 지원자 (accepted applications)
            const fetchProjectMembers = async () => {
                try {
                    const response = await fetch(`/api/projects/${projectId}`);
                    const data = await response.json();

                    if (data.success && data.data) {
                        const project = data.data;
                        const members: any[] = [];

                        // 1. 프로젝트 작성자 추가
                        if (project.author) {
                            members.push({
                                _id: project.author._id,
                                nName: project.author.nName || project.author.email,
                                email: project.author.email,
                                role: '프로젝트 리더',
                            });
                        }

                        // 2. 승인된 지원자 조회
                        try {
                            const applicationsRes = await fetch(`/api/projects/${projectId}/application`);
                            const applicationsData = await applicationsRes.json();

                            if (applicationsData.success && applicationsData.data) {
                                // status가 'accepted'인 지원자만 필터링
                                const acceptedApplicants = applicationsData.data
                                    .filter((app: any) => app.status === 'accepted')
                                    .map((app: any) => ({
                                        _id: app.applicantId._id || app.applicantId,
                                        nName: app.applicantId.nName || app.applicantId.email,
                                        email: app.applicantId.email,
                                        role: app.role,
                                    }));

                                members.push(...acceptedApplicants);
                            }
                        } catch (error) {
                            console.error('지원자 목록 조회 실패:', error);
                        }

                        // 중복 제거 (같은 _id를 가진 사용자)
                        const uniqueMembers = members.filter(
                            (member, index, self) =>
                                index === self.findIndex((m) => m._id === member._id)
                        );

                        setProjectMembers(uniqueMembers);
                        console.log('프로젝트 멤버 목록:', uniqueMembers);
                    }
                } catch (error) {
                    console.error('프로젝트 멤버 조회 실패:', error);
                }
            };

            fetchProjectMembers();
        }
    }, [status, projectId, fetchTasks]);

    // 작업 추가 버튼 클릭
    const handleAddTask = () => {
        setEditingTask(null);
        setShowTaskForm(true);
    };

    // 작업 수정 버튼 클릭
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setShowTaskForm(true);
    };

    // 작업 폼 제출
    const handleTaskSubmit = async (taskData: any) => {
        if (editingTask) {
            // 수정 모드
            await updateTask(editingTask.id, taskData);
        } else {
            // 추가 모드
            await addTask(taskData);
        }
        setShowTaskForm(false);
        setEditingTask(null);
    };

    // 작업 폼 취소
    const handleTaskCancel = () => {
        setShowTaskForm(false);
        setEditingTask(null);
    };

    // 작업 삭제
    const handleTaskDelete = async (taskId: string) => {
        await deleteTask(taskId);
    };

    // 간트차트에서 작업 클릭
    const handleGanttTaskClick = (task: Task) => {
        selectTask(task.id);
        setShowDependencyModal(true);
    };

    // 의존관계 저장 핸들러
    const handleSaveDependency = async (
        taskId: string,
        dependencies: Array<{ taskId: string; type: DependencyType }>
    ) => {
        try {
            // dependencies를 서버 쪽으로 전달되는 단순 객체 배열로 변환
            await updateTask(taskId, { dependencies: dependencies as any });
        } catch (error) {
            console.error('의존관계 저장 실패:', error);
            throw error;
        }
    };

    // 간트차트에서 날짜 변경 (드래그)
    const handleDateChange = async (task: Task, start: Date, end: Date) => {
        await updateTaskDates(task.id, start, end);
    };

    // 작업 빠른 업데이트 (진행률, 상태)
    const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
        try {
            await updateTask(taskId, updates);
        } catch (error) {
            console.error('작업 업데이트 실패:', error);
        }
    };

    // 로딩 중
    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full">
            {/* 상단 툴바 */}
            <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">WBS (Work Breakdown Structure)</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        프로젝트 {pid}의 일정 관리
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* 뷰 모드 선택 */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode === 'day'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            일
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode === 'week'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            주
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode === 'month'
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            월
                        </button>
                    </div>

                    {/* 작업 추가 버튼 */}
                    <button
                        onClick={handleAddTask}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
                    >
                        <span>+</span>
                        <span>작업 추가</span>
                    </button>
                </div>
            </div>

            {/* 일정 충돌 통계 대시보드 */}
            {(() => {
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

                const totalConflicts = Array.from(allConflicts.values()).reduce(
                    (sum, conflicts) => sum + conflicts.length,
                    0
                );

                const affectedAssignees = allConflicts.size;

                if (totalConflicts > 0) {
                    return (
                        <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium text-orange-900 dark:text-orange-200">
                                        일정 충돌 감지:
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-orange-800 dark:text-orange-300">
                                    <span>
                                        총 <strong className="font-semibold">{totalConflicts}건</strong>의 충돌
                                    </span>
                                    <span className="text-orange-400 dark:text-orange-600">|</span>
                                    <span>
                                        <strong className="font-semibold">{affectedAssignees}명</strong>의 작업자 영향
                                    </span>
                                    <span className="text-orange-600 dark:text-orange-400 ml-2">
                                        → 작업 목록에서 확인하세요
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* 메인 컨텐츠 (브라우저 스크롤 활용) */}
            <div className="p-6 space-y-6">
                {/* 작업 폼 (모달 형태) */}
                {showTaskForm && (
                    <div className="mb-6">
                        <TaskForm
                            task={editingTask}
                            projectId={projectId}
                            projectMembers={projectMembers}
                            existingTasks={tasks}
                            onSubmit={handleTaskSubmit}
                            onCancel={handleTaskCancel}
                        />
                    </div>
                )}

                {/* 간트차트 */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">간트차트</h2>
                    <GanttChart
                        tasks={tasks}
                        viewMode={viewMode === 'day' ? 'Day' : viewMode === 'week' ? 'Week' : 'Month'}
                        onTaskClick={handleGanttTaskClick}
                        onDateChange={handleDateChange}
                        dateRangeMonths={dateRangeMonths}
                    />
                </div>

                {/* 작업 목록 테이블 */}
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-4">작업 목록</h2>
                    <TaskList
                        tasks={tasks}
                        selectedTaskId={selectedTaskId}
                        onTaskSelect={selectTask}
                        onTaskEdit={handleEditTask}
                        onTaskDelete={handleTaskDelete}
                        onTaskUpdate={handleTaskUpdate}
                    />
                </div>
            </div>

            {/* 의존관계 설정 모달 */}
            <DependencySettingModal
                isOpen={showDependencyModal}
                selectedTask={selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null}
                allTasks={tasks}
                onClose={() => setShowDependencyModal(false)}
                onSaveDependency={handleSaveDependency}
            />
        </div>
    );
}
