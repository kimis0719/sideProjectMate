import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

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

async function createTestProject(authorId: string, pid: number) {
  return Project.create({
    pid,
    title: '테스트 프로젝트',
    category: 'WEB',
    ownerId: authorId,
    members: [],
    description: '프로젝트 설명',
    status: 'recruiting',
  });
}

describe('GET /api/applications/by-project/[pid]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('프로젝트의 지원자 목록을 조회한다', async () => {
    const owner = await createTestUser({ nName: '프로젝트주인' });
    const applicant = await createTestUser({ nName: '지원자', authorEmail: 'applicant@test.com' });
    const project = await createTestProject(owner._id, 1);

    await Application.create({
      projectId: project._id,
      applicantId: applicant._id,
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다. 경험이 있습니다.',
      weeklyHours: 10,
      message: '지원합니다',
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications/by-project/1');
    const response = await GET(request, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].weeklyHours).toBe(10);
    expect(body.data[0].status).toBe('pending');
  });

  it('지원자 정보에 nName, email이 포함된다', async () => {
    const owner = await createTestUser();
    const applicant = await createTestUser({
      nName: '홍길동',
      authorEmail: 'hong@test.com',
    });
    const project = await createTestProject(owner._id, 2);

    await Application.create({
      projectId: project._id,
      applicantId: applicant._id,
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다. 경험이 있습니다.',
      weeklyHours: 10,
      message: '지원합니다',
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications/by-project/2');
    const response = await GET(request, { params: { pid: '2' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data[0].applicant).toBeDefined();
    expect(body.data[0].applicant.nName).toBe('홍길동');
    expect(body.data[0].applicant.email).toBe('hong@test.com');
  });

  it('존재하지 않는 프로젝트면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications/by-project/9999');
    const response = await GET(request, { params: { pid: '9999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/applications/by-project/1');
    const response = await GET(request, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
