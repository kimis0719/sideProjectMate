import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Application from '@/lib/models/Application';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import ProjectMember from '@/lib/models/ProjectMember';
import Notification from '@/lib/models/Notification';
import { PUT, DELETE } from './route';

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

async function createProjectWithApplicant() {
  const owner = await createTestUser({ nName: '프로젝트장' });
  const applicant = await createTestUser({ nName: '지원자' });
  const project = await Project.create({
    pid: Date.now(),
    title: '테스트 프로젝트',
    category: 'WEB',
    author: owner._id,
    members: [{ role: '프론트엔드', current: 0, max: 2 }],
    content: '내용',
    status: '01',
  });
  const application = await Application.create({
    projectId: project._id,
    applicantId: applicant._id,
    role: '프론트엔드',
    message: '지원합니다',
    status: 'pending',
  });
  return { owner, applicant, project, application };
}

describe('PUT /api/applications/[appId]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('프로젝트 작성자가 지원을 수락하면 상태가 accepted로 변경된다', async () => {
    const { owner, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    const response = await PUT(request, { params: { appId: application._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('accepted');
  });

  it('수락 시 지원자가 ProjectMember로 등록된다', async () => {
    const { owner, applicant, project, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    await PUT(request, { params: { appId: application._id.toString() } });

    const member = await ProjectMember.findOne({ userId: applicant._id, projectId: project._id });
    expect(member).not.toBeNull();
    expect(member!.role).toBe('프론트엔드');
    expect(member!.status).toBe('active');
  });

  it('수락/거절 시 지원자에게 알림이 생성된다', async () => {
    const { owner, applicant, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    await PUT(request, { params: { appId: application._id.toString() } });

    const notifications = await Notification.find({ recipient: applicant._id });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('application_accepted');
  });

  it('프로젝트 작성자가 지원을 거절하면 상태가 rejected로 변경된다', async () => {
    const { owner, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    const response = await PUT(request, { params: { appId: application._id.toString() } });
    const body = await response.json();

    expect(body.data.status).toBe('rejected');
  });

  it('잘못된 상태값이면 400을 반환한다', async () => {
    const { owner, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'invalid' }),
    });
    const response = await PUT(request, { params: { appId: application._id.toString() } });
    expect(response.status).toBe(400);
  });

  it('이미 처리된 지원서이면 400을 반환한다', async () => {
    const { owner, application } = await createProjectWithApplicant();
    application.status = 'accepted';
    await application.save();

    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    const response = await PUT(request, { params: { appId: application._id.toString() } });
    expect(response.status).toBe(400);
  });

  it('작성자가 아닌 유저는 403을 반환한다', async () => {
    const { applicant, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: applicant._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    const response = await PUT(request, { params: { appId: application._id.toString() } });
    expect(response.status).toBe(403);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/applications/000000000000000000000001', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    const response = await PUT(request, { params: { appId: '000000000000000000000001' } });
    expect(response.status).toBe(401);
  });

  it('존재하지 않는 지원서이면 404를 반환한다', async () => {
    const user = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/applications/000000000000000000000099', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    });
    const response = await PUT(request, { params: { appId: '000000000000000000000099' } });
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/applications/[appId]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('지원자가 자신의 pending 지원서를 삭제할 수 있다', async () => {
    const { applicant, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: applicant._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { appId: application._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const found = await Application.findById(application._id);
    expect(found).toBeNull();
  });

  it('프로젝트 작성자도 pending 지원서를 삭제할 수 있다', async () => {
    const { owner, application } = await createProjectWithApplicant();
    mockGetServerSession.mockResolvedValue({
      user: { _id: owner._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { appId: application._id.toString() } });
    expect(response.status).toBe(200);
  });

  it('이미 수락된 지원서는 삭제할 수 없다', async () => {
    const { applicant, application } = await createProjectWithApplicant();
    application.status = 'accepted';
    await application.save();

    mockGetServerSession.mockResolvedValue({
      user: { _id: applicant._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { appId: application._id.toString() } });
    expect(response.status).toBe(400);
  });

  it('지원자도 작성자도 아닌 유저는 403을 반환한다', async () => {
    const { application } = await createProjectWithApplicant();
    const stranger = await createTestUser();
    mockGetServerSession.mockResolvedValue({
      user: { _id: stranger._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request(`http://localhost:3000/api/applications/${application._id}`, {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { appId: application._id.toString() } });
    expect(response.status).toBe(403);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/applications/000000000000000000000001', {
      method: 'DELETE',
    });
    const response = await DELETE(request, { params: { appId: '000000000000000000000001' } });
    expect(response.status).toBe(401);
  });
});
