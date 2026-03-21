import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import Task from '@/lib/models/wbs/TaskModel';
import User from '@/lib/models/User';
import { PATCH, DELETE } from './route';

const BASE_URL = 'http://localhost:3000/api/wbs/tasks/batch';

async function createTestUser() {
  return User.create({
    authorEmail: `user-${Date.now()}@test.com`,
    nName: '테스트유저',
    uid: Date.now(),
    memberType: 'user',
    password: 'test1234',
  });
}

describe('PATCH /api/wbs/tasks/batch', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('여러 작업을 한 번에 업데이트한다', async () => {
    const user = await createTestUser();
    const task1 = await Task.create({
      pid: 1, title: '작업1', assignee: user._id,
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05'),
    });
    const task2 = await Task.create({
      pid: 1, title: '작업2', assignee: user._id,
      startDate: new Date('2024-01-06'), endDate: new Date('2024-01-10'),
    });

    const request = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: {
        updates: [
          { id: task1._id.toString(), changes: { title: '수정1' } },
          { id: task2._id.toString(), changes: { title: '수정2' } },
        ],
      },
    });
    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updated1 = await Task.findById(task1._id);
    const updated2 = await Task.findById(task2._id);
    expect(updated1!.title).toBe('수정1');
    expect(updated2!.title).toBe('수정2');
  });

  it('title 등 비날짜 필드를 배치로 업데이트할 수 있다', async () => {
    const user = await createTestUser();
    const task = await Task.create({
      pid: 1, title: '원래제목', assignee: user._id,
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05'),
    });

    const request = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: {
        updates: [
          { id: task._id.toString(), changes: { title: '변경된제목', progress: 30 } },
        ],
      },
    });
    const response = await PATCH(request);

    expect(response.status).toBe(200);
    const updated = await Task.findById(task._id);
    expect(updated!.title).toBe('변경된제목');
    expect(updated!.progress).toBe(30);
  });

  it('updates가 없으면 400을 반환한다', async () => {
    const request = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: {},
    });
    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('updates가 빈 배열이면 400을 반환한다', async () => {
    const request = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: { updates: [] },
    });
    const response = await PATCH(request);
    expect(response.status).toBe(400);
  });

  it('종료일이 시작일보다 이전인 변경이 있으면 500을 반환한다', async () => {
    const user = await createTestUser();
    const task = await Task.create({
      pid: 1, title: '잘못된날짜', assignee: user._id,
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05'),
    });

    const request = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: {
        updates: [
          { id: task._id.toString(), changes: { startDate: '2024-02-10', endDate: '2024-02-01' } },
        ],
      },
    });
    const response = await PATCH(request);
    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/wbs/tasks/batch', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('여러 작업을 한 번에 삭제한다', async () => {
    const user = await createTestUser();
    const task1 = await Task.create({
      pid: 1, title: '삭제1', assignee: user._id,
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05'),
    });
    const task2 = await Task.create({
      pid: 1, title: '삭제2', assignee: user._id,
      startDate: new Date('2024-01-06'), endDate: new Date('2024-01-10'),
    });

    const request = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: { ids: [task1._id.toString(), task2._id.toString()] },
    });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.deletedCount).toBe(2);

    const remaining = await Task.find({ pid: 1 });
    expect(remaining).toHaveLength(0);
  });

  it('삭제된 작업들의 의존관계가 다른 작업에서 정리된다', async () => {
    const user = await createTestUser();
    const taskA = await Task.create({
      pid: 1, title: '작업A', assignee: user._id,
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05'),
    });
    const taskB = await Task.create({
      pid: 1, title: '작업B', assignee: user._id,
      startDate: new Date('2024-01-06'), endDate: new Date('2024-01-10'),
    });
    const taskC = await Task.create({
      pid: 1, title: '작업C', assignee: user._id,
      startDate: new Date('2024-01-11'), endDate: new Date('2024-01-15'),
      dependencies: [
        { taskId: taskA._id, type: 'FS' },
        { taskId: taskB._id, type: 'FS' },
      ],
    });

    const request = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: { ids: [taskA._id.toString(), taskB._id.toString()] },
    });
    await DELETE(request);

    const updatedC = await Task.findById(taskC._id);
    expect(updatedC!.dependencies).toHaveLength(0);
  });

  it('ids가 없으면 400을 반환한다', async () => {
    const request = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: {},
    });
    const response = await DELETE(request);
    expect(response.status).toBe(400);
  });

  it('ids가 빈 배열이면 400을 반환한다', async () => {
    const request = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: { ids: [] },
    });
    const response = await DELETE(request);
    expect(response.status).toBe(400);
  });

  it('삭제 대상이 아닌 작업은 유지된다', async () => {
    const user = await createTestUser();
    const task1 = await Task.create({
      pid: 1, title: '삭제대상', assignee: user._id,
      startDate: new Date('2024-01-01'), endDate: new Date('2024-01-05'),
    });
    await Task.create({
      pid: 1, title: '유지대상', assignee: user._id,
      startDate: new Date('2024-01-06'), endDate: new Date('2024-01-10'),
    });

    const request = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: { ids: [task1._id.toString()] },
    });
    const response = await DELETE(request);
    const body = await response.json();

    expect(body.deletedCount).toBe(1);
    const remaining = await Task.find({ pid: 1 });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('유지대상');
  });
});
