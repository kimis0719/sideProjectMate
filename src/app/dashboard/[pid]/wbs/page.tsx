'use client';

import { useEffect, useState } from 'react';
import { useWbsStore, Task } from '@/store/wbsStore';
import GanttChart from '@/components/wbs/GanttChart';
import TaskList from '@/components/wbs/TaskList';
import TaskPanel, { TaskFormData } from '@/components/wbs/TaskPanel';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * 일정 관리 페이지
 * 프로젝트의 작업을 간트차트 형태로 시각화하고 관리하는 페이지입니다.
 */
export default function WBSPage({ params }: { params: { pid: string } }) {
    const { pid } = params;
    const projectId = parseInt(pid, 10);

    const { data: session, status } = useSession();
    const router = useRouter();

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
        initSocket,
        cleanupSocket,
    } = useWbsStore();

    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const [panelTask, setPanelTask] = useState<Task | null>(null);   // TaskPanel에 표시할 작업
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // 인증 확인
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // 소켓 실시간 협업 초기화 (인증 후 연결, 페이지 이탈 시 정리)
    useEffect(() => {
        if (status !== 'authenticated' || !projectId) return;

        initSocket(projectId);

        return () => {
            cleanupSocket();
        };
    }, [status, projectId]);

    // 프로젝트 작업 목록 및 멤버 정보 가져오기
    useEffect(() => {
        if (status !== 'authenticated' || !projectId) return;

        fetchTasks(projectId);

        const fetchProjectMembers = async () => {
            try {
                const response = await fetch(`/api/projects/${projectId}`);
                const data = await response.json();

                if (!data.success || !data.data) return;

                const project = data.data;
                const members: any[] = [];

                if (project.author) {
                    members.push({
                        _id: project.author._id,
                        nName: project.author.nName || project.author.email,
                        email: project.author.email,
                        role: '프로젝트 리더',
                    });
                }

                try {
                    const applicationsRes = await fetch(`/api/projects/${projectId}/application`);
                    const applicationsData = await applicationsRes.json();

                    if (applicationsData.success && applicationsData.data) {
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
                } catch {
                    // 지원자 조회 실패 시 무시
                }

                // 중복 제거
                const unique = members.filter(
                    (m, i, self) => i === self.findIndex((s) => s._id === m._id)
                );
                setProjectMembers(unique);
            } catch {
                console.error('프로젝트 멤버 조회 실패');
            }
        };

        fetchProjectMembers();
    }, [status, projectId, fetchTasks]);

    // TaskPanel 열기 — 신규
    const openNewTask = () => {
        setPanelTask(null);
        setIsPanelOpen(true);
    };

    // TaskPanel 열기 — 기존 작업
    const openTask = (task: Task) => {
        selectTask(task.id);
        setPanelTask(task);
        setIsPanelOpen(true);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
    };

    // TaskPanel 저장 핸들러
    const handlePanelSave = async (data: TaskFormData) => {
        if (panelTask) {
            await updateTask(panelTask.id, data as any);
        } else {
            await addTask(data as any);
        }
        closePanel();
    };

    // TaskPanel 삭제 핸들러
    const handlePanelDelete = async (taskId: string) => {
        await deleteTask(taskId);
    };

    // 간트차트 날짜 드래그 변경
    const handleDateChange = async (task: Task, start: Date, end: Date) => {
        await updateTaskDates(task.id, start, end);
    };

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
                    <h1 className="text-2xl font-bold text-foreground">일정 관리</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        프로젝트 {pid}의 작업 타임라인
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* 뷰 모드 선택 */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        {(['day', 'week', 'month'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                                    viewMode === mode
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {mode === 'day' ? '일' : mode === 'week' ? '주' : '월'}
                            </button>
                        ))}
                    </div>

                    {/* 작업 추가 버튼 */}
                    <button
                        onClick={openNewTask}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2 text-sm"
                    >
                        <span>+</span>
                        <span>작업 추가</span>
                    </button>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="p-6 space-y-6">
                {/* 간트차트 */}
                <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">간트차트</h2>
                    <GanttChart
                        tasks={tasks}
                        viewMode={viewMode === 'day' ? 'Day' : viewMode === 'week' ? 'Week' : 'Month'}
                        onTaskClick={openTask}
                        onDateChange={handleDateChange}
                    />
                </div>

                {/* 작업 목록 (접기/펴기) */}
                <TaskList
                    tasks={tasks}
                    selectedTaskId={selectedTaskId}
                    onTaskOpen={openTask}
                />
            </div>

            {/* 작업 상세/편집 패널 */}
            <TaskPanel
                task={panelTask}
                tasks={tasks}
                projectMembers={projectMembers}
                projectId={projectId}
                isOpen={isPanelOpen}
                onClose={closePanel}
                onSave={handlePanelSave}
                onDelete={handlePanelDelete}
            />
        </div>
    );
}
