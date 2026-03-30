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
import Notification from '@/lib/models/Notification';
import { GET, POST, DELETE } from './route';

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

async function createTestProject(authorId: string, overrides?: Record<string, unknown>) {
  return Project.create({
    pid: Date.now(),
    title: '테스트 프로젝트',
    category: 'WEB',
    ownerId: authorId,
    members: [],
    description: '프로젝트 설명',
    status: 'recruiting',
    ...overrides,
  });
}

function mockSession(userId: string) {
  mockGetServerSession.mockResolvedValue({
    user: { _id: userId },
    expires: '2099-12-31',
  });
}

function mockUnauthenticated() {
  mockGetServerSession.mockResolvedValue(null);
}

describe('GET /api/notifications', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('인증된 유저의 알림 목록을 조회한다', async () => {
    const recipient = await createTestUser();
    const sender = await createTestUser({ nName: '발신자' });
    const project = await createTestProject(sender._id.toString());

    await Notification.create({
      recipient: recipient._id,
      sender: sender._id,
      type: 'new_applicant',
      project: project._id,
      read: false,
    });
    await Notification.create({
      recipient: recipient._id,
      sender: sender._id,
      type: 'application_accepted',
      project: project._id,
      read: false,
    });

    mockSession(recipient._id.toString());

    const request = new Request('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('알림이 없으면 빈 배열을 반환한다', async () => {
    const user = await createTestUser();
    mockSession(user._id.toString());

    const request = new Request('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  it('다른 유저의 알림은 조회되지 않는다', async () => {
    const userA = await createTestUser({ nName: '유저A' });
    const userB = await createTestUser({ nName: '유저B' });
    const sender = await createTestUser({ nName: '발신자' });
    const project = await createTestProject(sender._id.toString());

    await Notification.create({
      recipient: userA._id,
      sender: sender._id,
      type: 'new_applicant',
      project: project._id,
      read: false,
    });

    mockSession(userB._id.toString());

    const request = new Request('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(0);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockUnauthenticated();

    const request = new Request('http://localhost:3000/api/notifications');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

describe('POST /api/notifications', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('새 알림을 생성한다 (projectId로)', async () => {
    const sender = await createTestUser({ nName: '발신자' });
    const recipient = await createTestUser({ nName: '수신자' });
    const project = await createTestProject(sender._id.toString());

    mockSession(sender._id.toString());

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: recipient._id.toString(),
        type: 'new_applicant',
        projectId: project._id.toString(),
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('new_applicant');
    expect(body.data.read).toBe(false);

    const saved = await Notification.findById(body.data._id);
    expect(saved).not.toBeNull();
    expect(saved!.recipient.toString()).toBe(recipient._id.toString());
  });

  it('projectPid로도 알림을 생성할 수 있다', async () => {
    const sender = await createTestUser({ nName: '발신자' });
    const recipient = await createTestUser({ nName: '수신자' });
    const pid = Date.now() + 999;
    const project = await createTestProject(sender._id.toString(), { pid });

    mockSession(sender._id.toString());

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: recipient._id.toString(),
        type: 'application_accepted',
        projectPid: pid,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.type).toBe('application_accepted');

    const saved = await Notification.findById(body.data._id);
    expect(saved).not.toBeNull();
    expect(saved!.project.toString()).toBe(project._id.toString());
  });

  it('필수 필드 누락 시 400을 반환한다', async () => {
    const sender = await createTestUser();
    mockSession(sender._id.toString());

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ recipientId: 'someId' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toBe('필수 정보가 누락되었습니다.');
  });

  it('존재하지 않는 projectPid면 404를 반환한다', async () => {
    const sender = await createTestUser();
    const recipient = await createTestUser({ nName: '수신자' });
    mockSession(sender._id.toString());

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: recipient._id.toString(),
        type: 'new_applicant',
        projectPid: 999999999,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.message).toBe('프로젝트를 찾을 수 없습니다.');
  });

  it('미인증 시 401을 반환한다', async () => {
    mockUnauthenticated();

    const req = new Request('http://localhost:3000/api/notifications', {
      method: 'POST',
      body: JSON.stringify({
        recipientId: 'someId',
        type: 'new_applicant',
        projectId: 'someProjectId',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

describe('DELETE /api/notifications', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('모든 알림을 삭제한다', async () => {
    const user = await createTestUser();
    const sender = await createTestUser({ nName: '발신자' });
    const project = await createTestProject(sender._id.toString());

    await Notification.create({
      recipient: user._id,
      sender: sender._id,
      type: 'new_applicant',
      project: project._id,
      read: false,
    });
    await Notification.create({
      recipient: user._id,
      sender: sender._id,
      type: 'assign_note',
      project: project._id,
      read: false,
    });

    mockSession(user._id.toString());

    const req = new Request('http://localhost:3000/api/notifications', { method: 'DELETE' });
    const response = await DELETE(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('모든 알림이 삭제되었습니다.');

    const remaining = await Notification.find({ recipient: user._id });
    expect(remaining).toHaveLength(0);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockUnauthenticated();

    const req = new Request('http://localhost:3000/api/notifications', { method: 'DELETE' });
    const response = await DELETE(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
