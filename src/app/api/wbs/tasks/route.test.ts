import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';
import { USER_IDS } from '@/__tests__/fixtures/users';

// dbConnect를 무시 — 인메모리 DB를 직접 연결하므로
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import Task from '@/lib/models/wbs/TaskModel';
import User from '@/lib/models/User';
import { GET, POST } from './route';

const BASE_URL = 'http://localhost:3000/api/wbs/tasks';

// 테스트용 유저 생성 헬퍼
async function createTestUser(id?: string) {
  return User.create({
    authorEmail: `user-${Date.now()}@test.com`,
    nName: '테스트유저',
    uid: Date.now(),
    memberType: 'user',
    password: 'test1234',
  });
}

describe('GET /api/wbs/tasks', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('pid로 해당 프로젝트의 작업만 조회한다', async () => {
    const user = await createTestUser();
    await Task.create([
      {
        pid: 1,
        title: '작업A',
        assignee: user._id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      },
      {
        pid: 1,
        title: '작업B',
        assignee: user._id,
        startDate: new Date('2024-01-06'),
        endDate: new Date('2024-01-10'),
      },
      {
        pid: 2,
        title: '다른프로젝트',
        assignee: user._id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      },
    ]);

    const request = createMockNextRequest(`${BASE_URL}?pid=1`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data.every((t: any) => t.pid === 1)).toBe(true);
  });

  it('startDate 기준 오름차순으로 정렬된다', async () => {
    const user = await createTestUser();
    await Task.create([
      {
        pid: 1,
        title: '나중작업',
        assignee: user._id,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-05'),
      },
      {
        pid: 1,
        title: '먼저작업',
        assignee: user._id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05'),
      },
    ]);

    const request = createMockNextRequest(`${BASE_URL}?pid=1`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data[0].title).toBe('먼저작업');
    expect(body.data[1].title).toBe('나중작업');
  });

  it('assignee가 populate되어 nName과 email이 포함된다', async () => {
    const user = await User.create({
      authorEmail: 'populate-test@test.com',
      nName: '홍길동',
      uid: 9999,
      memberType: 'user',
      password: 'test1234',
    });
    await Task.create({
      pid: 1,
      title: '작업',
      assignee: user._id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-05'),
    });

    const request = createMockNextRequest(`${BASE_URL}?pid=1`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data[0].assignee).toHaveProperty('nName', '홍길동');
  });

  it('결과가 없으면 빈 배열을 반환한다', async () => {
    const request = createMockNextRequest(`${BASE_URL}?pid=999`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('pid가 없으면 400 에러를 반환한다', async () => {
    const request = createMockNextRequest(BASE_URL);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('pid');
  });
});

describe('POST /api/wbs/tasks', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('정상적인 데이터로 작업을 생성하면 201을 반환한다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        title: '새 작업',
        assignee: user._id.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('새 작업');
    expect(body.data.status).toBe('todo');
    expect(body.data.progress).toBe(0);
  });

  it('생성된 작업이 실제 DB에 저장된다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        title: 'DB저장확인',
        assignee: user._id.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      },
    });

    await POST(request);
    const tasks = await Task.find({ pid: 1 });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('DB저장확인');
  });

  it('선택 필드를 포함하여 작업을 생성한다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        title: '상세 작업',
        description: '작업 설명입니다',
        assignee: user._id.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-10',
        status: 'in-progress',
        progress: 50,
        phase: '개발',
        milestone: true,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.data.description).toBe('작업 설명입니다');
    expect(body.data.status).toBe('in-progress');
    expect(body.data.progress).toBe(50);
    expect(body.data.phase).toBe('개발');
    expect(body.data.milestone).toBe(true);
  });

  it('필수 필드(title)가 누락되면 400을 반환한다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        assignee: user._id.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('필수 필드');
  });

  it('필수 필드(pid)가 누락되면 400을 반환한다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        title: '작업',
        assignee: user._id.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('종료일이 시작일보다 이전이면 400을 반환한다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        title: '잘못된 날짜',
        assignee: user._id.toString(),
        startDate: '2024-01-10',
        endDate: '2024-01-01',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('종료일');
  });

  it('시작일과 종료일이 같으면 정상 생성된다', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        title: '하루짜리 작업',
        assignee: user._id.toString(),
        startDate: '2024-01-05',
        endDate: '2024-01-05',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('기본값이 올바르게 설정된다 (status=todo, progress=0, phase=기본)', async () => {
    const user = await createTestUser();
    const request = createMockNextRequest(BASE_URL, {
      method: 'POST',
      body: {
        pid: 1,
        title: '기본값 확인',
        assignee: user._id.toString(),
        startDate: '2024-01-01',
        endDate: '2024-01-10',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.data.status).toBe('todo');
    expect(body.data.progress).toBe(0);
    expect(body.data.phase).toBe('기본');
    expect(body.data.milestone).toBe(false);
    expect(body.data.dependencies).toEqual([]);
  });
});
