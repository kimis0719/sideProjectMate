import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Review from '@/lib/models/Review';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import { GET, POST } from './route';

function mockSession(userId: string) {
  mockGetServerSession.mockResolvedValue({
    user: { _id: userId },
    expires: '2099-12-31',
  });
}

function mockUnauthenticated() {
  mockGetServerSession.mockResolvedValue(null);
}

async function createTestUsers() {
  const user1 = await User.create({
    authorEmail: 'u1@test.com',
    nName: 'U1',
    uid: 1,
    memberType: 'user',
    password: 'test1234',
  });
  const user2 = await User.create({
    authorEmail: 'u2@test.com',
    nName: 'U2',
    uid: 2,
    memberType: 'user',
    password: 'test1234',
  });
  return { user1, user2 };
}

async function createTestProject(authorId: string) {
  return Project.create({
    pid: 1,
    title: 'P',
    category: 'WEB',
    author: authorId,
    members: [],
    content: 'c',
    status: '01',
  });
}

describe('POST /api/reviews', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('리뷰를 작성한다', async () => {
    const { user1, user2 } = await createTestUsers();
    const project = await createTestProject(user1._id.toString());

    mockSession(user1._id.toString());

    const req = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        projectId: project._id.toString(),
        revieweeId: user2._id.toString(),
        rating: 4,
        tags: ['소통이 잘 돼요'],
        comment: '좋은 팀원이었습니다.',
        isPublic: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.rating).toBe(4);
    expect(body.data.tags).toContain('소통이 잘 돼요');

    // DB 저장 확인
    const saved = await Review.findById(body.data._id);
    expect(saved).not.toBeNull();
    expect(saved!.reviewerId.toString()).toBe(user1._id.toString());
    expect(saved!.revieweeId.toString()).toBe(user2._id.toString());
  });

  it('필수 필드 누락 시 400을 반환한다', async () => {
    const { user1 } = await createTestUsers();
    mockSession(user1._id.toString());

    const req = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        projectId: new mongoose.Types.ObjectId().toString(),
        // revieweeId 누락
        // rating 누락
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('필수');
  });

  it('자기 자신에게는 리뷰할 수 없다', async () => {
    const { user1 } = await createTestUsers();
    const project = await createTestProject(user1._id.toString());

    mockSession(user1._id.toString());

    const req = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        projectId: project._id.toString(),
        revieweeId: user1._id.toString(),
        rating: 5,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('자기 자신');
  });

  it('별점이 범위 밖이면 400을 반환한다', async () => {
    const { user1, user2 } = await createTestUsers();
    const project = await createTestProject(user1._id.toString());

    mockSession(user1._id.toString());

    const req = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        projectId: project._id.toString(),
        revieweeId: user2._id.toString(),
        rating: 6,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('1~5');
  });

  it('미인증 시 401을 반환한다', async () => {
    mockUnauthenticated();

    const req = new Request('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        projectId: new mongoose.Types.ObjectId().toString(),
        revieweeId: new mongoose.Types.ObjectId().toString(),
        rating: 3,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

describe('GET /api/reviews', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('유저가 받은 공개 리뷰를 조회한다', async () => {
    const { user1, user2 } = await createTestUsers();
    const project = await createTestProject(user1._id.toString());

    // 공개 리뷰 1건
    await Review.create({
      projectId: project._id,
      reviewerId: user1._id,
      revieweeId: user2._id,
      rating: 5,
      tags: ['책임감이 강해요'],
      comment: '훌륭합니다',
      isPublic: true,
    });

    // 비공개 리뷰 1건 (조회되면 안 됨)
    const user3 = await User.create({
      authorEmail: 'u3@test.com',
      nName: 'U3',
      uid: 3,
      memberType: 'user',
      password: 'test1234',
    });
    const project2 = await Project.create({
      pid: 2,
      title: 'P2',
      category: 'WEB',
      author: user3._id,
      members: [],
      content: 'c2',
      status: '01',
    });
    await Review.create({
      projectId: project2._id,
      reviewerId: user3._id,
      revieweeId: user2._id,
      rating: 3,
      tags: [],
      isPublic: false,
    });

    const req = new Request(`http://localhost:3000/api/reviews?revieweeId=${user2._id.toString()}`);
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // 공개 리뷰만 반환
    expect(body.data).toHaveLength(1);
    expect(body.data[0].rating).toBe(5);
  });

  it('revieweeId 없이 요청하면 400을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/reviews');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toContain('revieweeId');
  });
});
