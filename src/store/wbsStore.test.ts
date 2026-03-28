import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSocket } from '@/__tests__/helpers/mockSocket';

// ── Socket Mock 설정 (vi.mock은 호이스팅됨) ──────────────────────────
const { mockSocket, emitFromServer } = createMockSocket();
vi.mock('@/lib/socket', () => ({
  getSocket: () => mockSocket,
}));

import { useWbsStore, type Task } from './wbsStore';

// ── 테스트 유틸 ──────────────────────────────────────────────────────
const resetStore = () => {
  useWbsStore.setState({
    tasks: [],
    selectedTaskId: null,
    viewMode: 'week',
    isLoading: false,
    currentPid: null,
  });
};

/** API 응답 Mock을 만드는 헬퍼 */
const mockFetchSuccess = (data: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ success: true, data }),
  });
};

const mockFetchFailure = (status = 500) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, message: '서버 에러' }),
  });
};

/** 테스트용 Task 문서 (MongoDB 형태 — _id 포함) */
const createServerTask = (overrides: Partial<any> = {}): any => ({
  _id: 'task-001',
  title: '테스트 작업',
  startDate: '2024-06-01',
  endDate: '2024-06-10',
  progress: 0,
  assignee: { _id: 'user-001', nName: 'Alice' },
  dependencies: [],
  projectPid: 1,
  ...overrides,
});

/** 클라이언트 형태의 Task (id 포함) */
const createClientTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-001',
    title: '테스트 작업',
    startDate: '2024-06-01' as any,
    endDate: '2024-06-10' as any,
    progress: 0,
    assignee: { _id: 'user-001', nName: 'Alice' },
    dependencies: [],
    projectPid: 1,
    ...overrides,
  }) as Task;

// ═══════════════════════════════════════════════════════════════════════════════
describe('wbsStore', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('초기 상태', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('tasks는 빈 배열이다', () => {
      expect(useWbsStore.getState().tasks).toEqual([]);
    });

    it('selectedTaskId는 null이다', () => {
      expect(useWbsStore.getState().selectedTaskId).toBeNull();
    });

    it('viewMode 기본값은 week이다', () => {
      expect(useWbsStore.getState().viewMode).toBe('week');
    });

    it('isLoading은 false이다', () => {
      expect(useWbsStore.getState().isLoading).toBe(false);
    });

    it('currentPid는 null이다', () => {
      expect(useWbsStore.getState().currentPid).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('fetchTasks', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('API 호출 성공 시 tasks를 업데이트한다', async () => {
      const serverTasks = [
        createServerTask({ _id: 'task-001', title: '작업 1' }),
        createServerTask({ _id: 'task-002', title: '작업 2' }),
      ];
      mockFetchSuccess(serverTasks);

      await useWbsStore.getState().fetchTasks(1);

      const state = useWbsStore.getState();
      expect(state.tasks).toHaveLength(2);
      expect(state.tasks[0].id).toBe('task-001');
      expect(state.tasks[1].id).toBe('task-002');
      expect(state.isLoading).toBe(false);
    });

    it('API 호출 중 isLoading이 true가 된다', async () => {
      // fetch를 지연시켜 isLoading 상태를 캡처
      let resolveFetch: (value: any) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const promise = useWbsStore.getState().fetchTasks(1);
      expect(useWbsStore.getState().isLoading).toBe(true);

      // resolve하여 완료
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
      await promise;
      expect(useWbsStore.getState().isLoading).toBe(false);
    });

    it('API 호출 시 올바른 URL을 사용한다', async () => {
      mockFetchSuccess([]);
      await useWbsStore.getState().fetchTasks(42);
      expect(global.fetch).toHaveBeenCalledWith('/api/wbs/tasks?pid=42');
    });

    it('API 실패 시 tasks를 빈 배열로 설정한다', async () => {
      // 기존에 데이터가 있는 상태에서 실패
      useWbsStore.setState({ tasks: [createClientTask()] });
      mockFetchFailure();

      await useWbsStore.getState().fetchTasks(1);

      expect(useWbsStore.getState().tasks).toEqual([]);
      expect(useWbsStore.getState().isLoading).toBe(false);
    });

    it('응답이 success: false이면 tasks를 빈 배열로 설정한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      await useWbsStore.getState().fetchTasks(1);
      expect(useWbsStore.getState().tasks).toEqual([]);
    });

    it('dependencies의 taskId를 문자열로 변환한다', async () => {
      const serverTask = createServerTask({
        dependencies: [{ taskId: 'dep-001', type: 'FS' }],
      });
      mockFetchSuccess([serverTask]);

      await useWbsStore.getState().fetchTasks(1);

      expect(useWbsStore.getState().tasks[0].dependencies).toEqual([
        { taskId: 'dep-001', type: 'FS' },
      ]);
    });

    it('dependency에 type이 없으면 FS를 기본값으로 사용한다', async () => {
      const serverTask = createServerTask({
        dependencies: [{ taskId: 'dep-001' }],
      });
      mockFetchSuccess([serverTask]);

      await useWbsStore.getState().fetchTasks(1);

      expect(useWbsStore.getState().tasks[0].dependencies[0].type).toBe('FS');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('addTask', () => {
    // ───────────────────────────────────────────────────────────────────────────

    const newTaskInput = {
      title: '새 작업',
      startDate: '2024-07-01' as any,
      endDate: '2024-07-15' as any,
      progress: 0,
      assignee: { _id: 'user-001', nName: 'Alice' },
      dependencies: [],
      projectPid: 1,
    } as unknown as Omit<Task, 'id'>;

    it('Optimistic Update로 임시 ID를 가진 작업이 즉시 추가된다', async () => {
      // fetch를 지연시켜 optimistic 상태를 관찰
      let resolveFetch: (value: any) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const promise = useWbsStore.getState().addTask(newTaskInput);

      // 즉시 tasks에 추가됨
      const state = useWbsStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].id).toMatch(/^temp-/);
      expect(state.tasks[0].title).toBe('새 작업');

      // selectedTaskId가 임시 ID로 설정됨
      expect(state.selectedTaskId).toBe(state.tasks[0].id);

      // 완료
      resolveFetch!({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: createServerTask({ _id: 'saved-001', title: '새 작업' }),
          }),
      });
      await promise;
    });

    it('서버 응답 후 임시 ID가 실제 ID로 교체된다', async () => {
      const savedTask = createServerTask({ _id: 'saved-001', title: '새 작업' });
      mockFetchSuccess(savedTask, 201);

      await useWbsStore.getState().addTask(newTaskInput);

      const state = useWbsStore.getState();
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].id).toBe('saved-001');
      expect(state.selectedTaskId).toBe('saved-001');
    });

    it('서버 응답 후 소켓으로 브로드캐스트한다', async () => {
      const savedTask = createServerTask({ _id: 'saved-001' });
      mockFetchSuccess(savedTask);
      useWbsStore.setState({ currentPid: 1 });

      await useWbsStore.getState().addTask(newTaskInput);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'wbs-create-task',
        expect.objectContaining({ projectId: '1' })
      );
    });

    it('currentPid가 null이면 소켓 브로드캐스트를 하지 않는다', async () => {
      mockFetchSuccess(createServerTask());

      await useWbsStore.getState().addTask(newTaskInput);

      expect(mockSocket.emit).not.toHaveBeenCalledWith('wbs-create-task', expect.anything());
    });

    it('API 실패 시 임시 작업이 롤백된다', async () => {
      mockFetchFailure();

      await useWbsStore.getState().addTask(newTaskInput);

      expect(useWbsStore.getState().tasks).toHaveLength(0);
      expect(useWbsStore.getState().selectedTaskId).toBeNull();
    });

    it('API 호출 시 올바른 요청을 보낸다', async () => {
      mockFetchSuccess(createServerTask());

      await useWbsStore.getState().addTask(newTaskInput);

      expect(global.fetch).toHaveBeenCalledWith('/api/wbs/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskInput),
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('updateTask', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useWbsStore.setState({
        tasks: [
          createClientTask({ id: 'task-001', title: '원래 제목' }),
          createClientTask({ id: 'task-002', title: '다른 작업' }),
        ],
      });
    });

    it('Optimistic Update로 즉시 상태가 변경된다', async () => {
      let resolveFetch: (value: any) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const promise = useWbsStore.getState().updateTask('task-001', { title: '변경된 제목' });

      // 즉시 변경됨
      expect(useWbsStore.getState().tasks[0].title).toBe('변경된 제목');
      // 다른 작업은 영향 없음
      expect(useWbsStore.getState().tasks[1].title).toBe('다른 작업');

      resolveFetch!({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: createServerTask({ _id: 'task-001', title: '변경된 제목' }),
          }),
      });
      await promise;
    });

    it('서버 응답으로 최종 업데이트한다', async () => {
      const updatedServerTask = createServerTask({ _id: 'task-001', title: '서버 확정 제목' });
      mockFetchSuccess(updatedServerTask);

      await useWbsStore.getState().updateTask('task-001', { title: '변경 요청 제목' });

      expect(useWbsStore.getState().tasks[0].title).toBe('서버 확정 제목');
    });

    it('PATCH 요청을 올바른 URL로 보낸다', async () => {
      mockFetchSuccess(createServerTask());

      await useWbsStore.getState().updateTask('task-001', { title: 'new' });

      expect(global.fetch).toHaveBeenCalledWith('/api/wbs/tasks/task-001', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'new' }),
      });
    });

    it('성공 시 소켓으로 브로드캐스트한다', async () => {
      mockFetchSuccess(createServerTask());
      useWbsStore.setState({ currentPid: 5 });

      await useWbsStore.getState().updateTask('task-001', { title: 'new' });

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'wbs-update-task',
        expect.objectContaining({ projectId: '5' })
      );
    });

    it('API 실패 시 원래 상태로 롤백된다', async () => {
      mockFetchFailure();

      await useWbsStore.getState().updateTask('task-001', { title: '변경 시도' });

      expect(useWbsStore.getState().tasks[0].title).toBe('원래 제목');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('deleteTask', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useWbsStore.setState({
        tasks: [createClientTask({ id: 'task-001' }), createClientTask({ id: 'task-002' })],
        selectedTaskId: 'task-001',
      });
    });

    it('Optimistic Update로 즉시 목록에서 제거된다', async () => {
      let resolveFetch: (value: any) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const promise = useWbsStore.getState().deleteTask('task-001');

      expect(useWbsStore.getState().tasks).toHaveLength(1);
      expect(useWbsStore.getState().tasks[0].id).toBe('task-002');

      resolveFetch!({ ok: true });
      await promise;
    });

    it('삭제된 작업이 selectedTaskId인 경우 null로 초기화된다', async () => {
      mockFetchSuccess(null);

      await useWbsStore.getState().deleteTask('task-001');

      expect(useWbsStore.getState().selectedTaskId).toBeNull();
    });

    it('다른 작업이 selectedTaskId인 경우 유지된다', async () => {
      useWbsStore.setState({ selectedTaskId: 'task-002' });
      mockFetchSuccess(null);

      await useWbsStore.getState().deleteTask('task-001');

      expect(useWbsStore.getState().selectedTaskId).toBe('task-002');
    });

    it('DELETE 요청을 올바른 URL로 보낸다', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await useWbsStore.getState().deleteTask('task-001');

      expect(global.fetch).toHaveBeenCalledWith('/api/wbs/tasks/task-001', {
        method: 'DELETE',
      });
    });

    it('성공 시 소켓으로 브로드캐스트한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      useWbsStore.setState({ currentPid: 3 });

      await useWbsStore.getState().deleteTask('task-001');

      expect(mockSocket.emit).toHaveBeenCalledWith('wbs-delete-task', {
        projectId: '3',
        taskId: 'task-001',
      });
    });

    it('API 실패 시 원래 목록으로 롤백된다', async () => {
      mockFetchFailure();

      await useWbsStore.getState().deleteTask('task-001');

      // tasks는 롤백되지만 selectedTaskId는 optimistic update에서 이미 null로 변경되어 복원되지 않음
      expect(useWbsStore.getState().tasks).toHaveLength(2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('updateTaskDates', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useWbsStore.setState({
        tasks: [createClientTask({ id: 'task-001' })],
      });
    });

    it('Optimistic Update로 날짜가 즉시 변경된다', async () => {
      let resolveFetch: (value: any) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );

      const newStart = new Date('2024-08-01');
      const newEnd = new Date('2024-08-15');
      const promise = useWbsStore.getState().updateTaskDates('task-001', newStart, newEnd);

      const task = useWbsStore.getState().tasks[0];
      expect(task.startDate).toEqual(newStart);
      expect(task.endDate).toEqual(newEnd);

      resolveFetch!({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: createServerTask({ _id: 'task-001' }),
          }),
      });
      await promise;
    });

    it('PATCH 요청에 startDate와 endDate를 전송한다', async () => {
      mockFetchSuccess(createServerTask());
      const newStart = new Date('2024-08-01');
      const newEnd = new Date('2024-08-15');

      await useWbsStore.getState().updateTaskDates('task-001', newStart, newEnd);

      expect(global.fetch).toHaveBeenCalledWith('/api/wbs/tasks/task-001', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: newStart, endDate: newEnd }),
      });
    });

    it('API 실패 시 원래 날짜로 롤백된다', async () => {
      mockFetchFailure();

      await useWbsStore
        .getState()
        .updateTaskDates('task-001', new Date('2024-08-01'), new Date('2024-08-15'));

      const task = useWbsStore.getState().tasks[0];
      expect(task.startDate).toBe('2024-06-01');
    });

    it('성공 시 소켓으로 브로드캐스트한다', async () => {
      mockFetchSuccess(createServerTask());
      useWbsStore.setState({ currentPid: 7 });

      await useWbsStore
        .getState()
        .updateTaskDates('task-001', new Date('2024-08-01'), new Date('2024-08-15'));

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'wbs-update-task',
        expect.objectContaining({ projectId: '7' })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('selectTask', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('작업 ID를 설정한다', () => {
      useWbsStore.getState().selectTask('task-001');
      expect(useWbsStore.getState().selectedTaskId).toBe('task-001');
    });

    it('null을 설정하면 선택이 해제된다', () => {
      useWbsStore.setState({ selectedTaskId: 'task-001' });
      useWbsStore.getState().selectTask(null);
      expect(useWbsStore.getState().selectedTaskId).toBeNull();
    });

    it('다른 작업으로 변경할 수 있다', () => {
      useWbsStore.setState({ selectedTaskId: 'task-001' });
      useWbsStore.getState().selectTask('task-002');
      expect(useWbsStore.getState().selectedTaskId).toBe('task-002');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('setViewMode', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('day 모드로 변경할 수 있다', () => {
      useWbsStore.getState().setViewMode('day');
      expect(useWbsStore.getState().viewMode).toBe('day');
    });

    it('week 모드로 변경할 수 있다', () => {
      useWbsStore.setState({ viewMode: 'day' });
      useWbsStore.getState().setViewMode('week');
      expect(useWbsStore.getState().viewMode).toBe('week');
    });

    it('month 모드로 변경할 수 있다', () => {
      useWbsStore.getState().setViewMode('month');
      expect(useWbsStore.getState().viewMode).toBe('month');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('initSocket', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('currentPid를 설정한다', () => {
      useWbsStore.getState().initSocket(42);
      expect(useWbsStore.getState().currentPid).toBe(42);
    });

    it('WBS 전용 룸에 join 이벤트를 emit한다', () => {
      useWbsStore.getState().initSocket(42);
      expect(mockSocket.emit).toHaveBeenCalledWith('join-wbs-project', '42');
    });

    it('wbs-task-created 이벤트 핸들러를 등록한다', () => {
      useWbsStore.getState().initSocket(1);
      expect(mockSocket.on).toHaveBeenCalledWith('wbs-task-created', expect.any(Function));
    });

    it('wbs-task-updated 이벤트 핸들러를 등록한다', () => {
      useWbsStore.getState().initSocket(1);
      expect(mockSocket.on).toHaveBeenCalledWith('wbs-task-updated', expect.any(Function));
    });

    it('wbs-task-deleted 이벤트 핸들러를 등록한다', () => {
      useWbsStore.getState().initSocket(1);
      expect(mockSocket.on).toHaveBeenCalledWith('wbs-task-deleted', expect.any(Function));
    });

    it('wbs-task-created 이벤트 수신 시 tasks에 추가된다', () => {
      useWbsStore.getState().initSocket(1);

      emitFromServer('wbs-task-created', createServerTask({ _id: 'new-001', title: '원격 작업' }));

      expect(useWbsStore.getState().tasks).toHaveLength(1);
      expect(useWbsStore.getState().tasks[0].id).toBe('new-001');
    });

    it('이미 존재하는 task의 created 이벤트는 무시한다 (중복 방지)', () => {
      useWbsStore.setState({
        tasks: [createClientTask({ id: 'existing-001' })],
      });
      useWbsStore.getState().initSocket(1);

      emitFromServer('wbs-task-created', createServerTask({ _id: 'existing-001' }));

      expect(useWbsStore.getState().tasks).toHaveLength(1);
    });

    it('wbs-task-updated 이벤트 수신 시 해당 task가 업데이트된다', () => {
      useWbsStore.setState({
        tasks: [createClientTask({ id: 'task-001', title: '원래 제목' })],
      });
      useWbsStore.getState().initSocket(1);

      emitFromServer('wbs-task-updated', createServerTask({ _id: 'task-001', title: '원격 수정' }));

      expect(useWbsStore.getState().tasks[0].title).toBe('원격 수정');
    });

    it('wbs-task-deleted 이벤트 수신 시 해당 task가 제거된다', () => {
      useWbsStore.setState({
        tasks: [createClientTask({ id: 'task-001' }), createClientTask({ id: 'task-002' })],
      });
      useWbsStore.getState().initSocket(1);

      emitFromServer('wbs-task-deleted', 'task-001');

      expect(useWbsStore.getState().tasks).toHaveLength(1);
      expect(useWbsStore.getState().tasks[0].id).toBe('task-002');
    });

    it('삭제된 task가 selectedTaskId인 경우 null로 초기화된다', () => {
      useWbsStore.setState({
        tasks: [createClientTask({ id: 'task-001' })],
        selectedTaskId: 'task-001',
      });
      useWbsStore.getState().initSocket(1);

      emitFromServer('wbs-task-deleted', 'task-001');

      expect(useWbsStore.getState().selectedTaskId).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('cleanupSocket', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('leave 이벤트를 emit한다', () => {
      useWbsStore.setState({ currentPid: 42 });
      useWbsStore.getState().cleanupSocket();
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-wbs-project', '42');
    });

    it('이벤트 핸들러를 해제한다', () => {
      useWbsStore.setState({ currentPid: 1 });
      useWbsStore.getState().cleanupSocket();

      expect(mockSocket.off).toHaveBeenCalledWith('wbs-task-created');
      expect(mockSocket.off).toHaveBeenCalledWith('wbs-task-updated');
      expect(mockSocket.off).toHaveBeenCalledWith('wbs-task-deleted');
    });

    it('currentPid를 null로 초기화한다', () => {
      useWbsStore.setState({ currentPid: 42 });
      useWbsStore.getState().cleanupSocket();
      expect(useWbsStore.getState().currentPid).toBeNull();
    });

    it('currentPid가 null이면 아무 동작도 하지 않는다', () => {
      useWbsStore.setState({ currentPid: null });
      useWbsStore.getState().cleanupSocket();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
