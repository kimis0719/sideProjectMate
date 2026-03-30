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

describe('GET /api/projects/[pid]/application/me', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('지원한 프로젝트에서 applied: true를 반환한다', async () => {
    const user = await createTestUser();
    const owner = await createTestUser();
    const project = await createTestProject(owner._id, 1);

    await Application.create({
      projectId: project._id,
      applicantId: user._id,
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다. 경험이 있습니다.',
      weeklyHours: 10,
      message: '지원합니다',
    });

    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/1/application/me');
    const response = await GET(request, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.applied).toBe(true);
    expect(body.data).toBeTruthy();
    expect(body.data.weeklyHours).toBe(10);
  });

  it('지원하지 않은 프로젝트에서 applied: false를 반환한다', async () => {
    const user = await createTestUser();
    const owner = await createTestUser();
    await createTestProject(owner._id, 2);

    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/2/application/me');
    const response = await GET(request, { params: { pid: '2' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.applied).toBe(false);
    expect(body.data).toBeNull();
  });

  it('존재하지 않는 프로젝트면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects/9999/application/me');
    const response = await GET(request, { params: { pid: '9999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/projects/1/application/me');
    const response = await GET(request, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
