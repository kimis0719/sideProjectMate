import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import { GET, PUT, DELETE, PATCH } from './route';

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

async function createTestProject(authorId: string, pid: number, overrides?: Record<string, unknown>) {
  return Project.create({
    pid,
    title: `프로젝트 ${pid}`,
    category: 'WEB',
    author: authorId,
    members: [{ role: '프론트엔드', current: 0, max: 2 }],
    content: '테스트 프로젝트',
    status: '01',
    ...overrides,
  });
}

describe('GET /api/projects/[pid]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('pid로 프로젝트를 조회한다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 100);

    const request = new Request('http://localhost:3000/api/projects/100');
    const response = await GET(request, { params: { pid: '100' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pid).toBe(100);
    expect(body.data.title).toBe('프로젝트 100');
  });

  it('조회 시 views가 1 증가한다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 101, { views: 10 });

    const request = new Request('http://localhost:3000/api/projects/101');
    await GET(request, { params: { pid: '101' } });

    const project = await Project.findOne({ pid: 101 });
    expect(project!.views).toBe(11);
  });

  it('존재하지 않는 pid이면 404를 반환한다', async () => {
    const request = new Request('http://localhost:3000/api/projects/99999');
    const response = await GET(request, { params: { pid: '99999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('유효하지 않은 pid(문자열)이면 400을 반환한다', async () => {
    const request = new Request('http://localhost:3000/api/projects/abc');
    const response = await GET(request, { params: { pid: 'abc' } });

    expect(response.status).toBe(400);
  });

  it('author가 populate되어 nName이 포함된다', async () => {
    const user = await createTestUser({ nName: '프로젝트작성자' });
    await createTestProject(user._id.toString(), 102);

    const request = new Request('http://localhost:3000/api/projects/102');
    const response = await GET(request, { params: { pid: '102' } });
    const body = await response.json();

    expect(body.data.author.nName).toBe('프로젝트작성자');
  });
});

describe('PUT /api/projects/[pid]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('작성자가 프로젝트를 수정할 수 있다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 200);
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/200', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '수정된 제목' }),
    });
    const response = await PUT(request, { params: { pid: '200' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.title).toBe('수정된 제목');
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/projects/200', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '변경' }),
    });
    const response = await PUT(request, { params: { pid: '200' } });
    expect(response.status).toBe(401);
  });

  it('작성자가 아닌 유저는 403을 반환한다', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    await createTestProject(owner._id.toString(), 201);
    mockGetServerSession.mockResolvedValue({
      user: { _id: other._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/201', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '변경' }),
    });
    const response = await PUT(request, { params: { pid: '201' } });
    expect(response.status).toBe(403);
  });

  it('존재하지 않는 pid이면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/99999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '변경' }),
    });
    const response = await PUT(request, { params: { pid: '99999' } });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/projects/[pid]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('작성자가 프로젝트를 삭제할 수 있다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 300);
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/300', { method: 'DELETE' });
    const response = await DELETE(request, { params: { pid: '300' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const found = await Project.findOne({ pid: 300 });
    expect(found).toBeNull();
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/projects/300', { method: 'DELETE' });
    const response = await DELETE(request, { params: { pid: '300' } });
    expect(response.status).toBe(401);
  });

  it('작성자가 아닌 유저는 403을 반환한다', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    await createTestProject(owner._id.toString(), 301);
    mockGetServerSession.mockResolvedValue({
      user: { _id: other._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/301', { method: 'DELETE' });
    const response = await DELETE(request, { params: { pid: '301' } });
    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/projects/[pid]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('작성자가 상태를 변경할 수 있다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 400);
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/400', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '02' }),
    });
    const response = await PATCH(request, { params: { pid: '400' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('02');
  });

  it('overview를 업데이트할 수 있다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 401);
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/401', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overview: '프로젝트 개요 업데이트' }),
    });
    const response = await PATCH(request, { params: { pid: '401' } });
    const body = await response.json();

    expect(body.data.overview).toBe('프로젝트 개요 업데이트');
  });

  it('유효하지 않은 상태값이면 400을 반환한다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 402);
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/402', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '99' }),
    });
    const response = await PATCH(request, { params: { pid: '402' } });
    expect(response.status).toBe(400);
  });

  it('변경할 데이터가 없으면 400을 반환한다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 403);
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/403', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PATCH(request, { params: { pid: '403' } });
    expect(response.status).toBe(400);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/projects/400', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '02' }),
    });
    const response = await PATCH(request, { params: { pid: '400' } });
    expect(response.status).toBe(401);
  });

  it('작성자가 아닌 유저는 403을 반환한다', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    await createTestProject(owner._id.toString(), 404);
    mockGetServerSession.mockResolvedValue({
      user: { _id: other._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/404', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '02' }),
    });
    const response = await PATCH(request, { params: { pid: '404' } });
    expect(response.status).toBe(403);
  });
});
