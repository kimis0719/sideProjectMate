import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Project from '@/lib/models/Project';
import Counter from '@/lib/models/Counter';
import User from '@/lib/models/User';
import { GET, POST } from './route';

const BASE_URL = 'http://localhost:3000/api/projects';

async function createTestUser(overrides?: Record<string, unknown>) {
  return User.create({
    authorEmail: `user-${Date.now()}-${Math.random()}@test.com`,
    nName: '테스트유저',
    uid: Date.now() + Math.floor(Math.random() * 10000),
    memberType: 'user',
    password: 'test1234',
    ...overrides,
  });
}

async function createTestProject(ownerId: string, overrides?: Record<string, unknown>) {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'project_pid' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return Project.create({
    pid: counter!.seq,
    title: `테스트 항목 ${counter!.seq}`,
    ownerId,
    members: [],
    description: '설명입니다.',
    status: 'recruiting',
    ...overrides,
  });
}

describe('GET /api/projects', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('프로젝트 목록을 페이지네이션으로 조회한다', async () => {
    const user = await createTestUser();
    for (let i = 0; i < 5; i++) {
      await createTestProject(user._id.toString());
    }

    const request = createMockNextRequest(`${BASE_URL}?page=1&limit=3`);
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.projects).toHaveLength(3);
    expect(body.data.total).toBe(5);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(3);
  });

  it('2페이지 조회 시 나머지 프로젝트를 반환한다', async () => {
    const user = await createTestUser();
    for (let i = 0; i < 5; i++) {
      await createTestProject(user._id.toString());
    }

    const request = createMockNextRequest(`${BASE_URL}?page=2&limit=3`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.projects).toHaveLength(2);
  });

  it('search 파라미터로 제목을 검색한다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), { title: 'React 프로젝트' });
    await createTestProject(user._id.toString(), { title: 'Vue 프로젝트' });
    await createTestProject(user._id.toString(), { title: 'Angular 앱' });

    const request = createMockNextRequest(`${BASE_URL}?search=프로젝트`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.projects).toHaveLength(2);
  });

  it('status 필터로 특정 상태만 조회한다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), { status: 'recruiting' });
    await createTestProject(user._id.toString(), { status: 'in_progress' });
    await createTestProject(user._id.toString(), { status: 'recruiting' });

    const request = createMockNextRequest(`${BASE_URL}?status=in_progress`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.projects).toHaveLength(1);
  });

  it('delYn=true인 프로젝트는 목록에 포함되지 않는다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString());
    await createTestProject(user._id.toString(), { delYn: true });

    const request = createMockNextRequest(BASE_URL);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.projects).toHaveLength(1);
  });

  it('authorId로 특정 작성자의 프로젝트만 조회한다', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await createTestProject(user1._id.toString());
    await createTestProject(user1._id.toString());
    await createTestProject(user2._id.toString());

    const request = createMockNextRequest(`${BASE_URL}?authorId=${user1._id}`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.projects).toHaveLength(2);
  });

  it('결과가 없으면 빈 배열을 반환한다', async () => {
    const request = createMockNextRequest(`${BASE_URL}?status=nonexist`);
    const response = await GET(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.projects).toEqual([]);
    expect(body.data.total).toBe(0);
  });
});

describe('POST /api/projects', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('인증된 유저가 프로젝트를 생성하면 201을 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString(), name: '테스트' },
      expires: '2099-12-31',
    });

    const request = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '새 프로젝트',
        description: '프로젝트 설명입니다.',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('새 프로젝트');
    expect(body.data.pid).toBeGreaterThan(0);
  });

  it('pid가 Counter를 통해 자동 증가된다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const makeRequest = () =>
      new Request(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '프로젝트', description: '내용' }),
      });

    const res1 = await POST(makeRequest());
    const body1 = await res1.json();
    const res2 = await POST(makeRequest());
    const body2 = await res2.json();

    expect(body2.data.pid).toBe(body1.data.pid + 1);
  });

  it('미인증 상태에서 프로젝트 생성 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '새 프로젝트', description: '내용' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('필수 필드(title)가 누락되면 400을 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '내용' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('작성자가 자동으로 members에 등록된다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '멤버 확인 프로젝트', description: '내용' }),
    });

    await POST(request);

    const project = await Project.findOne({ title: '멤버 확인 프로젝트' });
    const members = project!.members;
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('member');
    expect(members[0].status).toBe('active');
  });
});
