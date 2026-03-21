import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import Task from '@/lib/models/wbs/TaskModel';
import User from '@/lib/models/User';
import { PATCH, DELETE } from './route';

// 테스트용 유저·태스크 생성 헬퍼
async function createTestUser() {
  return User.create({
    authorEmail: `user-${Date.now()}@test.com`,
    nName: '테스트유저',
    uid: Date.now(),
    memberType: 'user',
    password: 'test1234',
  });
}

async function createTestTask(userId: string, overrides?: Record<string, unknown>) {
  return Task.create({
    pid: 1,
    title: '기본 작업',
    assignee: userId,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-10'),
    status: 'todo',
    progress: 0,
    ...overrides,
  });
}

describe('PATCH /api/wbs/tasks/[taskId]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('작업의 title만 부분 업데이트한다', async () => {
    const user = await createTestUser();
    const task = await createTestTask(user._id.toString());

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task._id}`, {
      method: 'PATCH',
      body: { title: '수정된 제목' },
    });
    const response = await PATCH(request, { params: { taskId: task._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('수정된 제목');
    // 다른 필드 유지 확인
    expect(body.data.status).toBe('todo');
    expect(body.data.progress).toBe(0);
  });

  it('여러 필드를 동시에 업데이트한다', async () => {
    const user = await createTestUser();
    const task = await createTestTask(user._id.toString());

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task._id}`, {
      method: 'PATCH',
      body: { status: 'in-progress', progress: 50 },
    });
    const response = await PATCH(request, { params: { taskId: task._id.toString() } });
    const body = await response.json();

    expect(body.data.status).toBe('in-progress');
    expect(body.data.progress).toBe(50);
  });

  it('assignee가 populate되어 반환된다', async () => {
    const user = await User.create({
      authorEmail: 'populate-patch@test.com',
      nName: '패치유저',
      uid: 7777,
      memberType: 'user',
      password: 'test1234',
    });
    const task = await createTestTask(user._id.toString());

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task._id}`, {
      method: 'PATCH',
      body: { title: '변경' },
    });
    const response = await PATCH(request, { params: { taskId: task._id.toString() } });
    const body = await response.json();

    expect(body.data.assignee).toHaveProperty('nName', '패치유저');
  });

  it('존재하지 않는 taskId이면 404를 반환한다', async () => {
    const fakeId = '000000000000000000000099';
    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${fakeId}`, {
      method: 'PATCH',
      body: { title: '변경' },
    });
    const response = await PATCH(request, { params: { taskId: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('종료일이 시작일보다 이전이면 400을 반환한다', async () => {
    const user = await createTestUser();
    const task = await createTestTask(user._id.toString());

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task._id}`, {
      method: 'PATCH',
      body: { startDate: '2024-02-01', endDate: '2024-01-01' },
    });
    const response = await PATCH(request, { params: { taskId: task._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toContain('종료일');
  });

  it('날짜를 동일하게 변경하면 정상 업데이트된다', async () => {
    const user = await createTestUser();
    const task = await createTestTask(user._id.toString());

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task._id}`, {
      method: 'PATCH',
      body: { startDate: '2024-03-01', endDate: '2024-03-01' },
    });
    const response = await PATCH(request, { params: { taskId: task._id.toString() } });

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/wbs/tasks/[taskId]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('작업을 삭제하면 DB에서 제거된다', async () => {
    const user = await createTestUser();
    const task = await createTestTask(user._id.toString());

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task._id}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { taskId: task._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const found = await Task.findById(task._id);
    expect(found).toBeNull();
  });

  it('삭제 시 다른 작업의 dependencies에서도 제거된다', async () => {
    const user = await createTestUser();
    const taskA = await createTestTask(user._id.toString(), { title: '작업A' });
    const taskB = await createTestTask(user._id.toString(), {
      title: '작업B',
      dependencies: [{ taskId: taskA._id, type: 'FS' }],
    });

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${taskA._id}`, {
      method: 'DELETE',
    });
    await DELETE(request, { params: { taskId: taskA._id.toString() } });

    const updatedB = await Task.findById(taskB._id);
    expect(updatedB!.dependencies).toHaveLength(0);
  });

  it('존재하지 않는 taskId이면 404를 반환한다', async () => {
    const fakeId = '000000000000000000000099';
    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${fakeId}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { taskId: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('삭제 후 같은 프로젝트의 다른 작업은 유지된다', async () => {
    const user = await createTestUser();
    const task1 = await createTestTask(user._id.toString(), { title: '삭제대상' });
    await createTestTask(user._id.toString(), { title: '유지대상' });

    const request = createMockNextRequest(`http://localhost:3000/api/wbs/tasks/${task1._id}`, {
      method: 'DELETE',
    });
    await DELETE(request, { params: { taskId: task1._id.toString() } });

    const remaining = await Task.find({ pid: 1 });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('유지대상');
  });
});
