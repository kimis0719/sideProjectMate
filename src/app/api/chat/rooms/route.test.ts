import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import User from '@/lib/models/User';
import ChatRoom from '@/lib/models/ChatRoom';
import ChatMessage from '@/lib/models/ChatMessage';
import { GET, POST } from './route';

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

function mockSession(userId: string) {
  mockGetServerSession.mockResolvedValue({
    user: { _id: userId },
    expires: '2099-12-31',
  });
}

describe('GET /api/chat/rooms', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('내 채팅방 목록을 조회한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const user2 = await createTestUser({ nName: '유저2' });

    await ChatRoom.create({
      category: 'DM',
      participants: [user1._id, user2._id],
    });

    mockSession(user1._id.toString());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].category).toBe('DM');
  });

  it('참여하지 않은 채팅방은 조회되지 않는다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const user2 = await createTestUser({ nName: '유저2' });
    const user3 = await createTestUser({ nName: '유저3' });

    await ChatRoom.create({
      category: 'DM',
      participants: [user1._id, user2._id],
    });

    mockSession(user3._id.toString());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/chat/rooms', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('DM 채팅방을 생성한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const user2 = await createTestUser({ nName: '유저2' });

    mockSession(user1._id.toString());

    const request = new Request('http://localhost:3000/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({
        category: 'DM',
        participants: [user1._id.toString(), user2._id.toString()],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.category).toBe('DM');
    expect(body.data.participants).toHaveLength(2);
  });

  it('이미 존재하는 DM이면 기존 방을 반환한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const user2 = await createTestUser({ nName: '유저2' });

    await ChatRoom.create({
      category: 'DM',
      participants: [user1._id, user2._id],
    });

    mockSession(user1._id.toString());

    const request = new Request('http://localhost:3000/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({
        category: 'DM',
        participants: [user1._id.toString(), user2._id.toString()],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.alreadyExists).toBe(true);
  });

  it('유효하지 않은 카테고리면 400을 반환한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });

    mockSession(user1._id.toString());

    const request = new Request('http://localhost:3000/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({
        category: 'INVALID',
        participants: [user1._id.toString()],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('참여자가 2명 미만이면 400을 반환한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });

    mockSession(user1._id.toString());

    const request = new Request('http://localhost:3000/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({
        category: 'DM',
        participants: [user1._id.toString()],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({
        category: 'DM',
        participants: ['abc', 'def'],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
