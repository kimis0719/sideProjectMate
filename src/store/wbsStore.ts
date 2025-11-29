import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ITask } from '@/lib/models/wbs/TaskModel';

/**
 * Task 타입 정의
 * MongoDB의 ITask에서 _id를 id로 변환하고, 날짜를 문자열로 변환한 클라이언트용 타입
 */
export type Task = Omit<ITask, '_id' | 'createdAt' | 'updatedAt' | 'assignee'> & {
    id: string;
    assignee: {
        _id: string;
        nName: string;
        email?: string;
    };
};

/**
 * WBS Store 상태 타입 정의
 */
type WbsState = {
    // 상태 (State)
    tasks: Task[];                          // 작업 목록
    selectedTaskId: string | null;          // 현재 선택된 작업 ID
    viewMode: 'day' | 'week' | 'month';     // 간트차트 표시 모드 (일/주/월)
    isLoading: boolean;                     // 로딩 상태

    // 액션 (Actions)
    fetchTasks: (pid: number) => Promise<void>;                           // 작업 목록 조회
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;                   // 작업 추가
    updateTask: (taskId: string, updates: Partial<Omit<Task, 'id'>>) => Promise<void>;  // 작업 수정
    deleteTask: (taskId: string) => Promise<void>;                        // 작업 삭제
    updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => Promise<void>; // 날짜 변경
    selectTask: (taskId: string | null) => void;                          // 작업 선택
    setViewMode: (mode: 'day' | 'week' | 'month') => void;                // 표시 모드 변경
};

/**
 * MongoDB 문서를 클라이언트용 Task 타입으로 변환하는 헬퍼 함수
 */
const transformDoc = (doc: any): Task => {
    const { _id, createdAt, updatedAt, ...rest } = JSON.parse(JSON.stringify(doc));
    return { id: _id, ...rest };
};

/**
 * WBS Zustand Store
 * 칸반보드의 boardStore와 동일한 패턴으로 작업 상태를 관리합니다.
 */
export const useWbsStore = create<WbsState>()(
    devtools(
        (set, get) => ({
            // 초기 상태
            tasks: [],
            selectedTaskId: null,
            viewMode: 'week',  // 기본값: 주 단위 표시
            isLoading: false,

            /**
             * fetchTasks: 프로젝트의 작업 목록을 API에서 가져와 상태에 저장
             * @param pid - 프로젝트 ID
             */
            fetchTasks: async (pid: number) => {
                set({ isLoading: true });
                try {
                    // API 호출: GET /api/wbs/tasks?pid={pid}
                    const response = await fetch(`/api/wbs/tasks?pid=${pid}`);
                    if (!response.ok) throw new Error('작업 목록 조회 실패');

                    const taskDocs = await response.json();
                    // MongoDB 문서를 클라이언트용 Task 타입으로 변환
                    const tasks = taskDocs.map(transformDoc);

                    set({ tasks, isLoading: false });
                } catch (error) {
                    console.error('작업 목록 조회 실패:', error);
                    set({ tasks: [], isLoading: false });
                }
            },

            /**
             * addTask: 새 작업 추가 (Optimistic Update 패턴)
             * @param task - 추가할 작업 정보 (id 제외)
             */
            addTask: async (task: Omit<Task, 'id'>) => {
                // Optimistic Update: 임시 ID로 즉시 UI에 반영
                const optimisticTask: Task = {
                    ...task,
                    id: `temp-${crypto.randomUUID()}`,
                };

                // 상태에 즉시 추가 (사용자에게 빠른 피드백)
                set((state) => ({
                    tasks: [...state.tasks, optimisticTask],
                    selectedTaskId: optimisticTask.id,
                }));

                try {
                    // API 호출: POST /api/wbs/tasks
                    const response = await fetch('/api/wbs/tasks', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(task),
                    });

                    if (!response.ok) throw new Error('작업 추가 실패');

                    const savedTaskDoc = await response.json();
                    const savedTask = transformDoc(savedTaskDoc);

                    // 임시 작업을 실제 작업으로 교체
                    set((state) => ({
                        tasks: state.tasks.map((t) => (t.id === optimisticTask.id ? savedTask : t)),
                        selectedTaskId: savedTask.id,
                    }));
                } catch (error) {
                    console.error('작업 추가 실패:', error);
                    // 에러 발생 시 롤백: 임시 작업 제거
                    set((state) => ({
                        tasks: state.tasks.filter((t) => t.id !== optimisticTask.id),
                        selectedTaskId: null,
                    }));
                }
            },

            /**
             * updateTask: 작업 정보 수정
             * @param taskId - 수정할 작업 ID
             * @param updates - 수정할 필드 (Partial Update)
             */
            updateTask: async (taskId: string, updates: Partial<Omit<Task, 'id'>>) => {
                const originalTasks = get().tasks;

                // Optimistic Update: 즉시 UI에 반영
                set((state) => ({
                    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
                }));

                try {
                    // API 호출: PATCH /api/wbs/tasks/{taskId}
                    const response = await fetch(`/api/wbs/tasks/${taskId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) throw new Error('작업 수정 실패');

                    const updatedTaskDoc = await response.json();
                    const updatedTask = transformDoc(updatedTaskDoc);

                    // 서버 응답으로 최종 업데이트
                    set((state) => ({
                        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
                    }));
                } catch (error) {
                    console.error('작업 수정 실패:', error);
                    // 에러 발생 시 롤백
                    set({ tasks: originalTasks });
                }
            },

            /**
             * deleteTask: 작업 삭제
             * @param taskId - 삭제할 작업 ID
             */
            deleteTask: async (taskId: string) => {
                const originalTasks = get().tasks;

                // Optimistic Update: 즉시 UI에서 제거
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== taskId),
                    selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
                }));

                try {
                    // API 호출: DELETE /api/wbs/tasks/{taskId}
                    const response = await fetch(`/api/wbs/tasks/${taskId}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) throw new Error('작업 삭제 실패');
                } catch (error) {
                    console.error('작업 삭제 실패:', error);
                    // 에러 발생 시 롤백
                    set({ tasks: originalTasks });
                }
            },

            /**
             * updateTaskDates: 간트차트에서 드래그로 날짜 변경 시 사용
             * @param taskId - 수정할 작업 ID
             * @param startDate - 새 시작일
             * @param endDate - 새 종료일
             */
            updateTaskDates: async (taskId: string, startDate: Date, endDate: Date) => {
                const originalTasks = get().tasks;

                // Optimistic Update: 즉시 UI에 반영
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? { ...t, startDate, endDate } : t
                    ),
                }));

                try {
                    // API 호출: PATCH /api/wbs/tasks/{taskId}
                    const response = await fetch(`/api/wbs/tasks/${taskId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ startDate, endDate }),
                    });

                    if (!response.ok) throw new Error('날짜 수정 실패');

                    const updatedTaskDoc = await response.json();
                    const updatedTask = transformDoc(updatedTaskDoc);

                    // 서버 응답으로 최종 업데이트
                    set((state) => ({
                        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
                    }));
                } catch (error) {
                    console.error('날짜 수정 실패:', error);
                    // 에러 발생 시 롤백
                    set({ tasks: originalTasks });
                }
            },

            /**
             * selectTask: 작업 선택 (상세 정보 표시용)
             * @param taskId - 선택할 작업 ID (null이면 선택 해제)
             */
            selectTask: (taskId: string | null) => {
                set({ selectedTaskId: taskId });
            },

            /**
             * setViewMode: 간트차트 표시 모드 변경
             * @param mode - 'day' | 'week' | 'month'
             */
            setViewMode: (mode: 'day' | 'week' | 'month') => {
                set({ viewMode: mode });
            },
        })
    )
);
