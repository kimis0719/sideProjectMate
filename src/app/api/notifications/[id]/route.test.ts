import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Notification from '@/lib/models/Notification';
import { PUT, DELETE } from './route';

// ── 헬퍼 함수 ──────────────────────────────────────────

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

async function createTestProject(authorId: string) {
  return Project.create({
    pid: Date.now(),
    title: '테스트 프로젝트',
    category: 'WEB',
    author: authorId,
    members: [{ role: '개발자', current: 0, max: 1 }],
    content: '프로젝트 설명',
    status: '01',
  });
}

async function createTestNotification(recipientId: string, senderId: string, projectId: string) {
  return Notification.create({
    recipient: recipientId,
    sender: senderId,
    type: 'new_applicant',
    project: projectId,
    read: false,
  });
}

// ── 테스트 ──────────────────────────────────────────────

describe('PUT/DELETE /api/notifications/[id]', () => {
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

  // ── PUT (읽음 처리) ──────────────────────────────────

  describe('PUT - 읽음 처리', () => {
    it('알림을 읽음 처리한다', async () => {
      const user = await createTestUser();
      const sender = await createTestUser({ authorEmail: 'sender@test.com', uid: 99999 });
      const project = await createTestProject(user._id.toString());
      const notification = await createTestNotification(
        user._id.toString(),
        sender._id.toString(),
        project._id.toString()
      );

      mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

      const notificationId = notification._id.toString();
      const response = await PUT(
        new Request('http://localhost:3000/api/notifications/' + notificationId),
        { params: { id: notificationId } }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.read).toBe(true);

      // DB에서도 반영 확인
      const updated = await Notification.findById(notificationId);
      expect(updated?.read).toBe(true);
    });

    it('존재하지 않는 알림이면 404를 반환한다', async () => {
      const user = await createTestUser();
      mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await PUT(new Request('http://localhost:3000/api/notifications/' + fakeId), {
        params: { id: fakeId },
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe('알림을 찾을 수 없습니다.');
    });

    it('다른 유저의 알림은 읽음 처리할 수 없다 (403)', async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser({ authorEmail: 'other@test.com', uid: 88888 });
      const sender = await createTestUser({ authorEmail: 'sender2@test.com', uid: 77777 });
      const project = await createTestProject(owner._id.toString());
      const notification = await createTestNotification(
        owner._id.toString(),
        sender._id.toString(),
        project._id.toString()
      );

      // 다른 유저로 인증
      mockGetServerSession.mockResolvedValue({ user: { _id: otherUser._id.toString() } });

      const notificationId = notification._id.toString();
      const response = await PUT(
        new Request('http://localhost:3000/api/notifications/' + notificationId),
        { params: { id: notificationId } }
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe('권한이 없습니다.');
    });

    it('미인증 시 401을 반환한다', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await PUT(new Request('http://localhost:3000/api/notifications/' + fakeId), {
        params: { id: fakeId },
      });
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('인증이 필요합니다.');
    });
  });

  // ── DELETE (개별 삭제) ────────────────────────────────

  describe('DELETE - 개별 삭제', () => {
    it('알림을 삭제한다', async () => {
      const user = await createTestUser();
      const sender = await createTestUser({ authorEmail: 'sender3@test.com', uid: 66666 });
      const project = await createTestProject(user._id.toString());
      const notification = await createTestNotification(
        user._id.toString(),
        sender._id.toString(),
        project._id.toString()
      );

      mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

      const notificationId = notification._id.toString();
      const response = await DELETE(
        new Request('http://localhost:3000/api/notifications/' + notificationId),
        { params: { id: notificationId } }
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe('알림이 삭제되었습니다.');

      // DB에서 삭제 확인
      const deleted = await Notification.findById(notificationId);
      expect(deleted).toBeNull();
    });

    it('존재하지 않는 알림이면 404를 반환한다', async () => {
      const user = await createTestUser();
      mockGetServerSession.mockResolvedValue({ user: { _id: user._id.toString() } });

      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await DELETE(
        new Request('http://localhost:3000/api/notifications/' + fakeId),
        { params: { id: fakeId } }
      );
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.message).toBe('알림을 찾을 수 없습니다.');
    });

    it('다른 유저의 알림은 삭제할 수 없다 (403)', async () => {
      const owner = await createTestUser();
      const otherUser = await createTestUser({ authorEmail: 'other2@test.com', uid: 55555 });
      const sender = await createTestUser({ authorEmail: 'sender4@test.com', uid: 44444 });
      const project = await createTestProject(owner._id.toString());
      const notification = await createTestNotification(
        owner._id.toString(),
        sender._id.toString(),
        project._id.toString()
      );

      mockGetServerSession.mockResolvedValue({ user: { _id: otherUser._id.toString() } });

      const notificationId = notification._id.toString();
      const response = await DELETE(
        new Request('http://localhost:3000/api/notifications/' + notificationId),
        { params: { id: notificationId } }
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.message).toBe('권한이 없습니다.');
    });

    it('미인증 시 401을 반환한다', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await DELETE(
        new Request('http://localhost:3000/api/notifications/' + fakeId),
        { params: { id: fakeId } }
      );
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.message).toBe('인증이 필요합니다.');
    });
  });
});
