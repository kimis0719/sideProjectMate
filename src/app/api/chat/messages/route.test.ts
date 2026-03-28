import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

import ChatMessage from '@/lib/models/ChatMessage';
import ChatRoom from '@/lib/models/ChatRoom';
import { POST } from './route';

describe('POST /api/chat/messages', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('메시지를 전송한다', async () => {
    const user1Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();

    const room = await ChatRoom.create({
      category: 'DM',
      participants: [user1Id, user2Id],
    });

    const request = new Request('http://localhost:3000/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        roomId: room._id.toString(),
        content: '안녕하세요!',
        senderId: user1Id.toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.content).toBe('안녕하세요!');
    expect(body.data.sender).toBe(user1Id.toString());

    const savedMessage = await ChatMessage.findById(body.data._id);
    expect(savedMessage).not.toBeNull();
    expect(savedMessage!.content).toBe('안녕하세요!');
  });

  it('roomId나 content가 없으면 400을 반환한다', async () => {
    const request = new Request('http://localhost:3000/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        senderId: new mongoose.Types.ObjectId().toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('메시지 전송 후 ChatRoom.lastMessage가 업데이트된다', async () => {
    const user1Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();

    const room = await ChatRoom.create({
      category: 'DM',
      participants: [user1Id, user2Id],
    });

    const request = new Request('http://localhost:3000/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        roomId: room._id.toString(),
        content: '마지막 메시지 테스트',
        senderId: user1Id.toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    const updatedRoom = await ChatRoom.findById(room._id).lean<{ lastMessage?: string }>();
    expect(updatedRoom!.lastMessage).toBe('마지막 메시지 테스트');
  });

  it('발신자 외 참여자의 unreadCounts가 증가한다', async () => {
    const user1Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();

    const room = await ChatRoom.create({
      category: 'DM',
      participants: [user1Id, user2Id],
      unreadCounts: new Map(),
    });

    const request = new Request('http://localhost:3000/api/chat/messages', {
      method: 'POST',
      body: JSON.stringify({
        roomId: room._id.toString(),
        content: '읽지 않은 메시지',
        senderId: user1Id.toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request);

    const updatedRoom = await ChatRoom.findById(room._id).lean<{
      unreadCounts?: Record<string, number>;
    }>();
    const unreadCounts = updatedRoom!.unreadCounts as Record<string, number>;

    // 발신자(user1)는 증가하지 않고, 수신자(user2)만 증가
    expect(unreadCounts[user2Id.toString()]).toBe(1);
    expect(unreadCounts[user1Id.toString()]).toBeUndefined();
  });
});
