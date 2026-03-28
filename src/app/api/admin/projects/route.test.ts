import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import { GET, PATCH, DELETE } from './route';

// --- helpers ---

async function createAdminUser() {
  return User.create({
    authorEmail: `admin-${Date.now()}-${Math.random()}@test.com`,
    nName: '관리자',
    uid: Date.now() + Math.floor(Math.random() * 10000),
    memberType: 'admin',
    password: 'admin1234',
  });
}

async function createTestProject(authorId: string, overrides?: Record<string, unknown>) {
  return Project.create({
    pid: Date.now() + Math.floor(Math.random() * 10000),
    title: '테스트 프로젝트',
    category: 'WEB',
    author: authorId,
    members: [{ role: 'Frontend', current: 1, max: 3 }],
    content: '프로젝트 설명입니다.',
    status: '01',
    ...overrides,
  });
}

function mockAdmin(adminId: string) {
  mockGetServerSession.mockResolvedValue({
    user: { _id: adminId, memberType: 'admin' },
    expires: '2099-12-31',
  });
}

// --- lifecycle ---

beforeAll(async () => {
  await setupTestDB();
});

afterEach(async () => {
  await clearTestDB();
  mockGetServerSession.mockReset();
});

afterAll(async () => {
  await teardownTestDB();
});

// --- tests ---

describe('GET /api/admin/projects', () => {
  it('관리자가 프로젝트 목록을 조회한다', async () => {
    const admin = await createAdminUser();
    await createTestProject(admin._id.toString(), { title: '프로젝트A', pid: 1001 });
    await createTestProject(admin._id.toString(), { title: '프로젝트B', pid: 1002 });
    mockAdmin(admin._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/admin/projects?page=1&limit=10');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(2);
    expect(json.data.page).toBe(1);
    expect(json.data.limit).toBe(10);
    expect(Array.isArray(json.data.projects)).toBe(true);
  });

  it('상태 필터로 프로젝트를 조회한다', async () => {
    const admin = await createAdminUser();
    await createTestProject(admin._id.toString(), { status: '01', pid: 2001 });
    await createTestProject(admin._id.toString(), { status: '02', pid: 2002 });
    await createTestProject(admin._id.toString(), { status: '01', pid: 2003 });
    mockAdmin(admin._id.toString());

    const req = createMockNextRequest(
      'http://localhost:3000/api/admin/projects?page=1&limit=10&status=01'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(2);
    json.data.projects.forEach((p: { status: string }) => {
      expect(p.status).toBe('01');
    });
  });

  it('일반 유저는 403을 반환한다', async () => {
    const user = await User.create({
      authorEmail: 'regular@test.com',
      nName: '일반유저',
      uid: 99999,
      memberType: 'user',
      password: 'test1234',
    });
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString(), memberType: 'user' },
      expires: '2099-12-31',
    });

    const req = createMockNextRequest('http://localhost:3000/api/admin/projects?page=1&limit=10');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createMockNextRequest('http://localhost:3000/api/admin/projects?page=1&limit=10');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});

describe('PATCH /api/admin/projects', () => {
  it('프로젝트를 일괄 비활성화한다', async () => {
    const admin = await createAdminUser();
    const p1 = await createTestProject(admin._id.toString(), { pid: 3001, delYn: false });
    const p2 = await createTestProject(admin._id.toString(), { pid: 3002, delYn: false });
    mockAdmin(admin._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/admin/projects', {
      method: 'PATCH',
      body: { pids: [p1.pid, p2.pid], delYn: true },
    });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.modifiedCount).toBe(2);

    // DB 실제 반영 확인
    const updated1 = await Project.findOne({ pid: p1.pid });
    const updated2 = await Project.findOne({ pid: p2.pid });
    expect(updated1?.delYn).toBe(true);
    expect(updated2?.delYn).toBe(true);
  });
});

describe('DELETE /api/admin/projects', () => {
  it('프로젝트를 일괄 삭제한다', async () => {
    const admin = await createAdminUser();
    const p1 = await createTestProject(admin._id.toString(), { pid: 4001 });
    const p2 = await createTestProject(admin._id.toString(), { pid: 4002 });
    mockAdmin(admin._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/admin/projects', {
      method: 'DELETE',
      body: { pids: [p1.pid, p2.pid] },
    });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deletedCount).toBe(2);

    // DB에서 실제 삭제 확인
    const remaining = await Project.find({ pid: { $in: [p1.pid, p2.pid] } });
    expect(remaining.length).toBe(0);
  });
});
