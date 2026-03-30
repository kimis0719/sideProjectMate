import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import Counter from '@/lib/models/Counter';
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

async function createTestProject(
  ownerId: string,
  pid: number,
  overrides?: Record<string, unknown>
) {
  return Project.create({
    pid,
    title: '테스트 프로젝트',
    ownerId,
    members: [],
    description: '프로젝트 설명',
    status: 'recruiting',
    ...overrides,
  });
}

function createApplyRequest(pid: string | number, body: Record<string, unknown>) {
  return new Request(`http://localhost:3000/api/projects/${pid}/apply`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockSession(userId: string) {
  mockGetServerSession.mockResolvedValue({
    user: { _id: userId },
    expires: '2099-12-31',
  });
}

describe('POST /api/projects/[pid]/apply', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('프로젝트에 성공적으로 지원한다', async () => {
    const owner = await createTestUser({ nName: '프로젝트소유자' });
    const applicant = await createTestUser({ nName: '지원자' });
    const project = await createTestProject(owner._id.toString(), 1);

    mockSession(applicant._id.toString());

    const req = createApplyRequest('1', {
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다. 저는 경험이 있습니다.',
      weeklyHours: 10,
      message: '잘 부탁드립니다',
    });
    const response = await POST(req, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);

    const applications = await Application.find({ projectId: project._id });
    expect(applications).toHaveLength(1);
    expect(applications[0].applicantId.toString()).toBe(applicant._id.toString());
    expect(applications[0].motivation).toContain('이 문제를 꼭 해결하고 싶어서');
    expect(applications[0].weeklyHours).toBe(10);

    const notifications = await Notification.find({ recipient: owner._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('new_applicant');
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createApplyRequest('1', {
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다.',
      weeklyHours: 10,
    });
    const response = await POST(req, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('존재하지 않는 프로젝트면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockSession(user._id.toString());

    const req = createApplyRequest('9999', {
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다.',
      weeklyHours: 10,
    });
    const response = await POST(req, { params: { pid: '9999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('자신의 프로젝트에 지원하면 400을 반환한다', async () => {
    const owner = await createTestUser();
    await createTestProject(owner._id.toString(), 2);

    mockSession(owner._id.toString());

    const req = createApplyRequest('2', {
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다.',
      weeklyHours: 10,
    });
    const response = await POST(req, { params: { pid: '2' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('motivation이나 weeklyHours가 없으면 400을 반환한다', async () => {
    const owner = await createTestUser({ nName: '소유자' });
    const applicant = await createTestUser({ nName: '지원자' });
    await createTestProject(owner._id.toString(), 3);

    mockSession(applicant._id.toString());

    // motivation 누락
    const req1 = createApplyRequest('3', { weeklyHours: 10 });
    const res1 = await POST(req1, { params: { pid: '3' } });
    expect(res1.status).toBe(400);

    // weeklyHours 누락
    const req2 = createApplyRequest('3', {
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다.',
    });
    const res2 = await POST(req2, { params: { pid: '3' } });
    expect(res2.status).toBe(400);
  });

  it('이미 지원했으면 409를 반환한다', async () => {
    const owner = await createTestUser({ nName: '소유자' });
    const applicant = await createTestUser({ nName: '지원자' });
    const project = await createTestProject(owner._id.toString(), 5);

    await Application.create({
      projectId: project._id,
      applicantId: applicant._id,
      motivation: '이 문제를 꼭 해결하고 싶어서 지원합니다. 저는 경험이 있습니다.',
      weeklyHours: 10,
    });

    mockSession(applicant._id.toString());

    const req = createApplyRequest('5', {
      motivation: '다시 지원합니다. 이 문제를 해결하고 싶습니다.',
      weeklyHours: 8,
    });
    const response = await POST(req, { params: { pid: '5' } });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
  });
});
