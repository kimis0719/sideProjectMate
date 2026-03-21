import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import Notification from '@/lib/models/Notification';
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

async function createTestProject(authorId: string, pid: number, overrides?: Record<string, unknown>) {
  return Project.create({
    pid,
    title: '테스트 프로젝트',
    category: 'WEB',
    author: authorId,
    members: [
      { role: '프론트엔드', current: 0, max: 2 },
      { role: '백엔드', current: 0, max: 1 },
    ],
    content: '프로젝트 설명',
    status: '01',
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

    const req = createApplyRequest('1', { role: '프론트엔드', message: '지원합니다' });
    const response = await POST(req, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);

    // Application 생성 확인
    const applications = await Application.find({ projectId: project._id });
    expect(applications).toHaveLength(1);
    expect(applications[0].applicantId.toString()).toBe(applicant._id.toString());
    expect(applications[0].role).toBe('프론트엔드');
    expect(applications[0].message).toBe('지원합니다');

    // Notification 생성 확인
    const notifications = await Notification.find({ recipient: owner._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('new_applicant');
    expect(notifications[0].sender.toString()).toBe(applicant._id.toString());
    expect(notifications[0].project.toString()).toBe(project._id.toString());
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = createApplyRequest('1', { role: '프론트엔드', message: '지원합니다' });
    const response = await POST(req, { params: { pid: '1' } });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('존재하지 않는 프로젝트면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockSession(user._id.toString());

    const req = createApplyRequest('9999', { role: '프론트엔드', message: '지원합니다' });
    const response = await POST(req, { params: { pid: '9999' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('자신의 프로젝트에 지원하면 400을 반환한다', async () => {
    const owner = await createTestUser();
    await createTestProject(owner._id.toString(), 2);

    mockSession(owner._id.toString());

    const req = createApplyRequest('2', { role: '프론트엔드', message: '지원합니다' });
    const response = await POST(req, { params: { pid: '2' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('role이나 message가 없으면 400을 반환한다', async () => {
    const owner = await createTestUser({ nName: '소유자' });
    const applicant = await createTestUser({ nName: '지원자' });
    await createTestProject(owner._id.toString(), 3);

    mockSession(applicant._id.toString());

    // role 누락
    const req1 = createApplyRequest('3', { message: '지원합니다' });
    const res1 = await POST(req1, { params: { pid: '3' } });
    expect(res1.status).toBe(400);
    expect((await res1.json()).success).toBe(false);

    // message 누락
    const req2 = createApplyRequest('3', { role: '프론트엔드' });
    const res2 = await POST(req2, { params: { pid: '3' } });
    expect(res2.status).toBe(400);
    expect((await res2.json()).success).toBe(false);
  });

  it('모집하지 않는 역할이면 400을 반환한다', async () => {
    const owner = await createTestUser({ nName: '소유자' });
    const applicant = await createTestUser({ nName: '지원자' });
    await createTestProject(owner._id.toString(), 4);

    mockSession(applicant._id.toString());

    const req = createApplyRequest('4', { role: '디자이너', message: '지원합니다' });
    const response = await POST(req, { params: { pid: '4' } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('이미 지원한 역할이면 409를 반환한다', async () => {
    const owner = await createTestUser({ nName: '소유자' });
    const applicant = await createTestUser({ nName: '지원자' });
    const project = await createTestProject(owner._id.toString(), 5);

    // 기존 지원 내역 생성
    await Application.create({
      projectId: project._id,
      applicantId: applicant._id,
      role: '프론트엔드',
      message: '첫 번째 지원',
    });

    mockSession(applicant._id.toString());

    const req = createApplyRequest('5', { role: '프론트엔드', message: '두 번째 지원' });
    const response = await POST(req, { params: { pid: '5' } });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.success).toBe(false);
  });
});
