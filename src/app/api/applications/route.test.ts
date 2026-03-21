import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Application from '@/lib/models/Application';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
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

describe('GET /api/applications', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('현재 로그인한 유저의 지원 내역을 반환한다', async () => {
    const user = await createTestUser();
    const project = await Project.create({
      pid: 1, title: '프로젝트', category: 'WEB', author: user._id,
      members: [{ role: '개발자', current: 0, max: 1 }], content: '내용', status: '01',
    });
    await Application.create({
      projectId: project._id, applicantId: user._id, role: '개발자', message: '지원합니다',
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].role).toBe('개발자');
  });

  it('다른 유저의 지원 내역은 포함되지 않는다', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const project = await Project.create({
      pid: 2, title: '프로젝트', category: 'WEB', author: user1._id,
      members: [{ role: '개발자', current: 0, max: 2 }], content: '내용', status: '01',
    });
    await Application.create({ projectId: project._id, applicantId: user1._id, role: '개발자', message: '지원1' });
    await Application.create({ projectId: project._id, applicantId: user2._id, role: '개발자', message: '지원2' });

    mockGetServerSession.mockResolvedValue({
      user: { _id: user1._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data).toHaveLength(1);
  });

  it('지원 내역이 없으면 빈 배열을 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data).toEqual([]);
  });

  it('최신 지원이 먼저 오도록 정렬된다', async () => {
    const user = await createTestUser();
    const project1 = await Project.create({
      pid: 3, title: '프로젝트1', category: 'WEB', author: user._id,
      members: [{ role: '백엔드', current: 0, max: 1 }], content: '내용', status: '01',
    });
    const project2 = await Project.create({
      pid: 4, title: '프로젝트2', category: 'APP', author: user._id,
      members: [{ role: '프론트엔드', current: 0, max: 1 }], content: '내용', status: '01',
    });
    await Application.create({
      projectId: project1._id, applicantId: user._id, role: '백엔드', message: '먼저',
      createdAt: new Date('2024-01-01'),
    });
    await Application.create({
      projectId: project2._id, applicantId: user._id, role: '프론트엔드', message: '나중에',
      createdAt: new Date('2024-02-01'),
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data).toHaveLength(2);
    // 최신순 정렬
    expect(new Date(body.data[0].createdAt).getTime())
      .toBeGreaterThanOrEqual(new Date(body.data[1].createdAt).getTime());
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('projectId가 populate되어 title과 pid를 포함한다', async () => {
    const user = await createTestUser();
    const project = await Project.create({
      pid: 5, title: '팝테스트', category: 'WEB', author: user._id,
      members: [{ role: '개발자', current: 0, max: 1 }], content: '내용', status: '01',
    });
    await Application.create({
      projectId: project._id, applicantId: user._id, role: '개발자', message: '지원',
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications');
    const response = await GET(request);
    const body = await response.json();

    expect(body.data[0].projectId).toHaveProperty('title', '팝테스트');
    expect(body.data[0].projectId).toHaveProperty('pid', 5);
  });
});
