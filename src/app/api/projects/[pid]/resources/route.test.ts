import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
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

async function createTestProject(ownerId: string, pid: number, memberId?: string) {
  return Project.create({
    pid,
    title: `프로젝트 ${pid}`,
    ownerId,
    members: memberId
      ? [
          {
            userId: memberId,
            role: 'member',
            status: 'active',
            joinedAt: new Date(),
          },
        ]
      : [],
    description: '프로젝트 설명',
    status: 'recruiting',
  });
}

function createPostRequest(pid: string | number, body: Record<string, unknown>) {
  return new Request(`http://localhost:3000/api/projects/${pid}/resources`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/projects/[pid]/resources', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('프로젝트 active 멤버는 자산을 등록할 수 있다', async () => {
    const owner = await createTestUser({ nName: '오너' });
    const member = await createTestUser({ nName: '멤버' });
    await createTestProject(owner._id.toString(), 2701, member._id.toString());

    mockGetServerSession.mockResolvedValue({
      user: { _id: member._id.toString() },
      expires: '2099-12-31',
    });

    const req = createPostRequest(2701, {
      type: 'TEXT',
      category: 'DOCS',
      content: '프로젝트 문서 링크 모음',
      metadata: { title: '온보딩 문서' },
    });
    const res = await POST(req, { params: { pid: '2701' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].content).toBe('프로젝트 문서 링크 모음');
  });

  it('프로젝트 멤버가 아니면 403을 반환한다', async () => {
    const owner = await createTestUser({ nName: '오너' });
    const outsider = await createTestUser({ nName: '외부사용자' });
    await createTestProject(owner._id.toString(), 2702);

    mockGetServerSession.mockResolvedValue({
      user: { _id: outsider._id.toString() },
      expires: '2099-12-31',
    });

    const req = createPostRequest(2702, {
      type: 'TEXT',
      category: 'DOCS',
      content: '외부 사용자의 등록 시도',
    });
    const res = await POST(req, { params: { pid: '2702' } });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('미인증 요청은 401을 반환한다', async () => {
    const req = createPostRequest(2703, {
      type: 'TEXT',
      category: 'DOCS',
      content: '인증 없는 요청',
    });
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(req, { params: { pid: '2703' } });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
