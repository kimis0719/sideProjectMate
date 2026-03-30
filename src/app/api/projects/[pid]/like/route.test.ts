import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import { POST } from './route';

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

async function createTestProject(ownerId: string, pid: number) {
  return Project.create({
    pid,
    title: '테스트 프로젝트',
    ownerId,
    members: [],
    description: '프로젝트 설명',
    status: 'recruiting',
    likeCount: 0,
  });
}

function buildRequest(pid: number) {
  return new Request(`http://localhost:3000/api/projects/${pid}/like`, { method: 'POST' });
}

describe('POST /api/projects/[pid]/like', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.clearAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('좋아요를 누른다 (likeCount 증가)', async () => {
    const user = await createTestUser();
    const project = await createTestProject(user._id.toString(), 1);

    mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

    const response = await POST(buildRequest(1), { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('좋아요를 눌렀습니다.');

    const updated = await Project.findById(project._id);
    expect(updated!.likeCount).toBe(1);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST(buildRequest(1), { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('존재하지 않는 프로젝트면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

    const response = await POST(buildRequest(9999), { params: { pid: '9999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });
});
