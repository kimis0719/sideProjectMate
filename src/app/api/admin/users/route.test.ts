import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import User from '@/lib/models/User';
import { GET, PATCH } from './route';

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

describe('GET /api/admin/users', () => {
  it('관리자가 유저 목록을 조회한다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    await createTestUser({ nName: '유저A' });
    await createTestUser({ nName: '유저B' });
    mockAdmin(admin._id.toString());

    const req = createMockNextRequest(
      'http://localhost:3000/api/admin/users?page=1&limit=10'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(3); // admin + 2 users
    expect(json.data.page).toBe(1);
    expect(json.data.limit).toBe(10);
    expect(Array.isArray(json.data.users)).toBe(true);
  });

  it('검색어로 유저를 필터링한다', async () => {
    const admin = await createTestUser({ memberType: 'admin', nName: '관리자' });
    await createTestUser({ nName: '검색대상유저' });
    await createTestUser({ nName: '일반유저' });
    mockAdmin(admin._id.toString());

    const req = createMockNextRequest(
      'http://localhost:3000/api/admin/users?page=1&limit=10&search=검색대상'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(1);
    expect(json.data.users[0].nName).toBe('검색대상유저');
  });

  it('일반 유저는 403을 반환한다', async () => {
    const user = await createTestUser({ memberType: 'user' });
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString(), memberType: 'user' },
      expires: '2099-12-31',
    });

    const req = createMockNextRequest(
      'http://localhost:3000/api/admin/users?page=1&limit=10'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createMockNextRequest(
      'http://localhost:3000/api/admin/users?page=1&limit=10'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});

describe('PATCH /api/admin/users', () => {
  it('유저 일괄 비활성화한다', async () => {
    const admin = await createTestUser({ memberType: 'admin' });
    const user1 = await createTestUser({ nName: '유저1', delYn: false });
    const user2 = await createTestUser({ nName: '유저2', delYn: false });
    mockAdmin(admin._id.toString());

    const ids = [user1._id.toString(), user2._id.toString()];
    const req = createMockNextRequest(
      'http://localhost:3000/api/admin/users',
      { method: 'PATCH', body: { ids, delYn: true } }
    );
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.modifiedCount).toBe(2);

    // DB 실제 반영 확인
    const updated1 = await User.findById(user1._id);
    const updated2 = await User.findById(user2._id);
    expect(updated1?.delYn).toBe(true);
    expect(updated2?.delYn).toBe(true);
  });
});
