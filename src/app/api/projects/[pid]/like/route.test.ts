import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import { POST } from './route';

// --- helpers ---

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
    author: authorId,
    members: [{ role: '개발자', current: 0, max: 1 }],
    content: '프로젝트 설명',
    status: '01',
  });
}

function buildRequest(pid: number) {
  return new Request(`http://localhost:3000/api/projects/${pid}/like`, { method: 'POST' });
}

// --- tests ---

describe('POST /api/projects/[pid]/like', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('좋아요를 누른다 (likes 배열에 userId 추가)', async () => {
    const user = await createTestUser();
    const project = await createTestProject(user._id.toString(), 1);

    mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

    const response = await POST(buildRequest(1), { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('좋아요를 눌렀습니다.');

    const updated = await Project.findById(project._id);
    expect(updated!.likes.map(String)).toContain(user._id.toString());
  });

  it('좋아요를 취소한다 (이미 liked → pull)', async () => {
    const user = await createTestUser();
    const project = await createTestProject(user._id.toString(), 2);

    // 먼저 좋아요 추가
    await Project.findByIdAndUpdate(project._id, { $addToSet: { likes: user._id } });

    mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

    const response = await POST(buildRequest(2), { params: { pid: '2' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('좋아요를 취소했습니다.');

    const updated = await Project.findById(project._id);
    expect(updated!.likes.map(String)).not.toContain(user._id.toString());
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST(buildRequest(1), { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.message).toBe('인증되지 않은 사용자입니다.');
  });

  it('존재하지 않는 프로젝트면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

    const response = await POST(buildRequest(9999), { params: { pid: '9999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('프로젝트를 찾을 수 없습니다.');
  });

  it('같은 유저가 두 번 좋아요해도 중복 추가되지 않는다', async () => {
    const user = await createTestUser();
    await createTestProject(user._id.toString(), 3);

    mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

    // 첫 번째 좋아요
    await POST(buildRequest(3), { params: { pid: '3' } });

    // 두 번째 좋아요 시도 — 이미 liked 상태이므로 취소됨
    // 다시 좋아요
    await POST(buildRequest(3), { params: { pid: '3' } });
    // 또 좋아요 — $addToSet이므로 중복 없어야 함
    await POST(buildRequest(3), { params: { pid: '3' } });

    const project = await Project.findOne({ pid: 3 });
    const likesAsStrings = project!.likes.map(String);
    const uniqueLikes = [...new Set(likesAsStrings)];
    expect(likesAsStrings.length).toBe(uniqueLikes.length);
    expect(likesAsStrings.filter((id: string) => id === user._id.toString()).length).toBe(1);
  });
});
