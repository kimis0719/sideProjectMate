import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// requireAdmin은 getServerSession에 의존하므로 실제 모듈 사용
// (이미 next-auth를 mock했으므로 requireAdmin 내부에서 mock된 세션을 받음)

import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import { GET } from './route';

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

describe('GET /api/admin/stats', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('관리자가 통계 데이터를 조회할 수 있다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    const user = await createTestUser();

    mockGetServerSession.mockResolvedValue({
      user: { _id: admin._id.toString(), memberType: 'admin' },
      expires: '2099-12-31',
    });

    // 테스트 데이터 생성
    const project = await Project.create({
      pid: 1, title: '프로젝트1', category: 'WEB', author: user._id,
      members: [{ role: '개발자', current: 0, max: 1 }], content: '내용', status: '01',
    });
    await Application.create({
      projectId: project._id, applicantId: user._id, role: '개발자', message: '지원',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('users');
    expect(body.data).toHaveProperty('projects');
    expect(body.data).toHaveProperty('applications');
    expect(body.data).toHaveProperty('topTechStacks');
  });

  it('유저 통계가 정확하다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    await createTestUser();
    await createTestUser();

    mockGetServerSession.mockResolvedValue({
      user: { _id: admin._id.toString(), memberType: 'admin' },
      expires: '2099-12-31',
    });

    const response = await GET();
    const body = await response.json();

    // admin + user 2명 = 3명
    expect(body.data.users.total).toBe(3);
  });

  it('프로젝트 상태별 통계가 정확하다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    const user = await createTestUser();

    mockGetServerSession.mockResolvedValue({
      user: { _id: admin._id.toString(), memberType: 'admin' },
      expires: '2099-12-31',
    });

    await Project.create([
      { pid: 1, title: 'P1', category: 'WEB', author: user._id, members: [], content: 'c', status: '01' },
      { pid: 2, title: 'P2', category: 'WEB', author: user._id, members: [], content: 'c', status: '01' },
      { pid: 3, title: 'P3', category: 'WEB', author: user._id, members: [], content: 'c', status: '02' },
      { pid: 4, title: 'P4', category: 'WEB', author: user._id, members: [], content: 'c', status: '03' },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.data.projects.total).toBe(4);
    expect(body.data.projects.byStatus.recruiting).toBe(2);
    expect(body.data.projects.byStatus.inProgress).toBe(1);
    expect(body.data.projects.byStatus.completed).toBe(1);
  });

  it('지원 통계 및 수락률이 정확하다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const project = await Project.create({
      pid: 10, title: 'P', category: 'WEB', author: admin._id,
      members: [{ role: '개발자', current: 0, max: 3 }], content: 'c', status: '01',
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: admin._id.toString(), memberType: 'admin' },
      expires: '2099-12-31',
    });

    await Application.create([
      { projectId: project._id, applicantId: user1._id, role: '개발자', message: 'm', status: 'accepted' },
      { projectId: project._id, applicantId: user2._id, role: '개발자', message: 'm', status: 'pending' },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.data.applications.total).toBe(2);
    expect(body.data.applications.pendingCount).toBe(1);
    expect(body.data.applications.acceptanceRate).toBe(50); // 1/2 = 50%
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('일반 유저(admin이 아닌)는 403을 반환한다', async () => {
    const user = await createTestUser({ memberType: 'user' });
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString(), memberType: 'user' },
      expires: '2099-12-31',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('지원이 없으면 수락률은 0이다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    mockGetServerSession.mockResolvedValue({
      user: { _id: admin._id.toString(), memberType: 'admin' },
      expires: '2099-12-31',
    });

    const response = await GET();
    const body = await response.json();

    expect(body.data.applications.acceptanceRate).toBe(0);
  });
});
