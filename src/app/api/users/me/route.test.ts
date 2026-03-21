import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// GitHub 서비스 외부 호출 방지
vi.mock('@/lib/github/service', () => ({
  updateUserGithubStats: vi.fn().mockResolvedValue(undefined),
}));

import User from '@/lib/models/User';
import Availability from '@/lib/models/Availability';
import { GET, PATCH } from './route';

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

function mockAuthenticated(userId: string) {
  mockGetServerSession.mockResolvedValue({
    user: { _id: userId, memberType: 'user' },
    expires: '2099-12-31',
  });
}

function mockUnauthenticated() {
  mockGetServerSession.mockResolvedValue(null);
}

describe('GET /api/users/me', () => {
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

  it('인증된 유저가 자신의 프로필을 조회한다', async () => {
    const user = await createTestUser({ nName: '프로필유저' });
    mockAuthenticated(user._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.nName).toBe('프로필유저');
  });

  it('가용성 정보가 함께 반환된다', async () => {
    const user = await createTestUser();
    mockAuthenticated(user._id.toString());

    await Availability.create({
      userId: user._id,
      schedule: [
        { day: 'monday', timeRanges: [{ start: '09:00', end: '12:00' }] },
      ],
      preference: 80,
      personalityTags: ['analyst', 'doer'],
    });

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.schedule).toHaveLength(1);
    expect(json.data.schedule[0].day).toBe('monday');
    expect(json.data.preference).toBe(80);
    expect(json.data.personalityTags).toEqual(['analyst', 'doer']);
  });

  it('가용성 정보가 없으면 기본값이 반환된다', async () => {
    const user = await createTestUser();
    mockAuthenticated(user._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.schedule).toEqual([]);
    expect(json.data.preference).toBe(50);
    expect(json.data.personalityTags).toEqual([]);
  });

  it('프로필 완성도가 계산되어 반환된다', async () => {
    const user = await createTestUser({
      introduction: '안녕하세요 저는 풀스택 개발자입니다',
      techTags: ['React', 'Node.js'],
      position: 'frontend',
      career: '3년차',
      avatarUrl: 'https://example.com/avatar.png',
    });
    mockAuthenticated(user._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.profileCompleteness).toBeGreaterThan(0);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockUnauthenticated();

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Unauthorized');
  });

  it('존재하지 않는 유저면 404를 반환한다', async () => {
    const user = await createTestUser();
    const userId = user._id.toString();
    mockAuthenticated(userId);

    // DB에서 유저 삭제
    await User.findByIdAndDelete(userId);

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe('User not found');
  });

  it('비밀번호가 응답에 포함되지 않는다', async () => {
    const user = await createTestUser({ password: 'supersecret123' });
    mockAuthenticated(user._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/users/me');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.password).toBeUndefined();
  });
});

describe('PATCH /api/users/me', () => {
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

  it('자기소개를 수정한다', async () => {
    const user = await createTestUser();
    mockAuthenticated(user._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/users/me', {
      method: 'PATCH',
      body: { introduction: '새로운 자기소개입니다' },
    });
    const response = await PATCH(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.introduction).toBe('새로운 자기소개입니다');

    // DB에 실제 저장 확인
    const saved = await User.findById(user._id).lean() as any;
    expect(saved.introduction).toBe('새로운 자기소개입니다');
  });

  it('여러 필드를 동시에 수정한다', async () => {
    const user = await createTestUser();
    mockAuthenticated(user._id.toString());

    const req = createMockNextRequest('http://localhost:3000/api/users/me', {
      method: 'PATCH',
      body: {
        position: 'backend',
        career: '5년차',
        techTags: ['TypeScript', 'Go', 'PostgreSQL'],
      },
    });
    const response = await PATCH(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.position).toBe('backend');
    expect(json.data.career).toBe('5년차');
    expect(json.data.techTags).toEqual(['TypeScript', 'Go', 'PostgreSQL']);
  });

  it('미인증 시 PATCH도 401을 반환한다', async () => {
    mockUnauthenticated();

    const req = createMockNextRequest('http://localhost:3000/api/users/me', {
      method: 'PATCH',
      body: { introduction: '수정 시도' },
    });
    const response = await PATCH(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe('Unauthorized');
  });
});
