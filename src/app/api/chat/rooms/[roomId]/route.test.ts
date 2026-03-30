import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import mongoose from 'mongoose';
import ChatRoom from '@/lib/models/ChatRoom';
import User from '@/lib/models/User';
import { DELETE } from './route';

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

describe('DELETE /api/chat/rooms/[roomId]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('채팅방에서 나간다 (참여자 제거)', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const user2 = await createTestUser({ nName: '유저2' });

    const room = await ChatRoom.create({
      category: 'DM',
      participants: [user1._id, user2._id],
    });

    mockSession(user1._id.toString());

    const response = await DELETE(new Request('http://localhost:3000/api/chat/rooms/' + room._id), {
      params: { roomId: room._id.toString() },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(false);

    const updatedRoom = await ChatRoom.findById(room._id);
    expect(updatedRoom!.participants).toHaveLength(1);
    expect(updatedRoom!.participants[0].toString()).toBe(user2._id.toString());
  });

  it('마지막 참여자가 나가면 방이 삭제된다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });

    const room = await ChatRoom.create({
      category: 'DM',
      participants: [user1._id],
    });

    mockSession(user1._id.toString());

    const response = await DELETE(new Request('http://localhost:3000/api/chat/rooms/' + room._id), {
      params: { roomId: room._id.toString() },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);

    const deletedRoom = await ChatRoom.findById(room._id);
    expect(deletedRoom).toBeNull();
  });

  it('존재하지 않는 채팅방이면 404를 반환한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const fakeId = new mongoose.Types.ObjectId();

    mockSession(user1._id.toString());

    const response = await DELETE(new Request('http://localhost:3000/api/chat/rooms/' + fakeId), {
      params: { roomId: fakeId.toString() },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('참여자가 아닌 유저는 403을 반환한다', async () => {
    const user1 = await createTestUser({ nName: '유저1' });
    const user2 = await createTestUser({ nName: '유저2' });
    const outsider = await createTestUser({ nName: '외부인' });

    const room = await ChatRoom.create({
      category: 'DM',
      participants: [user1._id, user2._id],
    });

    mockSession(outsider._id.toString());

    const response = await DELETE(new Request('http://localhost:3000/api/chat/rooms/' + room._id), {
      params: { roomId: room._id.toString() },
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const fakeId = new mongoose.Types.ObjectId();

    const response = await DELETE(new Request('http://localhost:3000/api/chat/rooms/' + fakeId), {
      params: { roomId: fakeId.toString() },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
