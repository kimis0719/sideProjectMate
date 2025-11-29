'use client';

import { useEffect, useState } from 'react';
import { useWbsStore, Task } from '@/store/wbsStore';
import GanttChart from '@/components/wbs/GanttChart';
import TaskForm from '@/components/wbs/TaskForm';
import TaskList from '@/components/wbs/TaskList';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
    const handleTaskClick = (task: Task) => {
        selectTask(task.id);
    };

    // 간트차트에서 날짜 변경 (드래그)
    const handleDateChange = async (task: Task, start: Date, end: Date) => {
        await updateTaskDates(task.id, start, end);
    };

    // 로딩 중
    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* 상단 툴바 */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WBS (Work Breakdown Structure)</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        프로젝트 {pid}의 일정 관리
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* 뷰 모드 선택 */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode === 'day'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            일
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode === 'week'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            주
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode === 'month'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            월
                        </button>
                    </div>

                    {/* 작업 추가 버튼 */}
                    <button
                        onClick={handleAddTask}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <span>+</span>
                        <span>작업 추가</span>
                    </button>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* 작업 폼 (모달 형태) */}
                {showTaskForm && (
                    <div className="mb-6">
                        <TaskForm
                            task={editingTask}
                            projectId={projectId}
                            projectMembers={projectMembers}
                            onSubmit={handleTaskSubmit}
                            onCancel={handleTaskCancel}
                        />
                    </div>
                )}

                {/* 간트차트 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">간트차트</h2>
                    <GanttChart
                        tasks={tasks}
                        viewMode={viewMode === 'day' ? 'Day' : viewMode === 'week' ? 'Week' : 'Month'}
                        onTaskClick={handleTaskClick}
                        onDateChange={handleDateChange}
                    />
                </div>

                {/* 작업 목록 테이블 */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">작업 목록</h2>
                    <TaskList
                        tasks={tasks}
                        selectedTaskId={selectedTaskId}
                        onTaskSelect={selectTask}
                        onTaskEdit={handleEditTask}
                        onTaskDelete={handleTaskDelete}
                    />
                </div>
            </div>
        </div>
    );
}
