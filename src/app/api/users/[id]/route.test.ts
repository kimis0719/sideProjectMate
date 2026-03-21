import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

import User from '@/lib/models/User';
import Availability from '@/lib/models/Availability';
import { GET } from './route';

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

describe('GET /api/users/[id] — 공개 프로필 조회', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('유저의 공개 프로필을 조회한다 (200)', async () => {
    const user = await createTestUser({
      nName: '홍길동',
      position: '프론트엔드',
      career: '3년차',
      introduction: '안녕하세요 프론트엔드 개발자입니다.',
    });
    const userId = user._id.toString();

    const req = createMockNextRequest('http://localhost:3000/api/users/' + userId);
    const response = await GET(req, { params: { id: userId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe(userId);
    expect(body.data.nName).toBe('홍길동');
    expect(body.data.position).toBe('프론트엔드');
    expect(body.data.career).toBe('3년차');
  });

  it('가용성 정보가 함께 반환된다', async () => {
    const user = await createTestUser();
    const userId = user._id;

    await Availability.create({
      userId,
      schedule: [
        { day: 'monday', timeRanges: [{ start: '09:00', end: '12:00' }] },
      ],
      preference: 80,
      personalityTags: ['analyst', 'doer'],
    });

    const req = createMockNextRequest('http://localhost:3000/api/users/' + userId.toString());
    const response = await GET(req, { params: { id: userId.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.schedule).toHaveLength(1);
    expect(body.data.schedule[0].day).toBe('monday');
    expect(body.data.preference).toBe(80);
    expect(body.data.personalityTags).toEqual(['analyst', 'doer']);
  });

  it('프로필이 없는 필드는 기본값이 반환된다', async () => {
    const user = await createTestUser();
    const userId = user._id.toString();

    const req = createMockNextRequest('http://localhost:3000/api/users/' + userId);
    const response = await GET(req, { params: { id: userId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.position).toBe('포지션 미설정');
    expect(body.data.career).toBe('신입');
    expect(body.data.status).toBe('구직중');
    expect(body.data.introduction).toBe('');
    expect(body.data.socialLinks).toEqual({ github: '', blog: '', solvedAc: '' });
    expect(body.data.schedule).toEqual([]);
    expect(body.data.preference).toBe(50);
    expect(body.data.personalityTags).toEqual([]);
    expect(body.data.portfolioLinks).toEqual([]);
    expect(body.data.techTags).toEqual([]);
  });

  it('존재하지 않는 유저면 404를 반환한다', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const req = createMockNextRequest('http://localhost:3000/api/users/' + fakeId);
    const response = await GET(req, { params: { id: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('사용자를 찾을 수 없습니다.');
  });

  it('잘못된 ID 형식이면 400을 반환한다 (CastError)', async () => {
    const invalidId = 'invalid-id-format';

    const req = createMockNextRequest('http://localhost:3000/api/users/' + invalidId);
    const response = await GET(req, { params: { id: invalidId } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('잘못된 사용자 ID 형식입니다.');
  });

  it('비밀번호가 응답에 포함되지 않는다', async () => {
    const user = await createTestUser({ password: 'supersecret123' });
    const userId = user._id.toString();

    const req = createMockNextRequest('http://localhost:3000/api/users/' + userId);
    const response = await GET(req, { params: { id: userId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.password).toBeUndefined();
    // data 객체의 모든 값에 비밀번호 문자열이 포함되지 않는지 확인
    const dataStr = JSON.stringify(body.data);
    expect(dataStr).not.toContain('supersecret123');
  });

  it('프로필 완성도가 계산되어 반환된다', async () => {
    const user = await createTestUser({
      avatarUrl: 'https://example.com/avatar.png',
      position: '백엔드',
      career: '5년차',
      introduction: '백엔드 개발자로서 다양한 경험을 가지고 있습니다.',
      techTags: ['Node.js', 'TypeScript'],
      socialLinks: { github: 'https://github.com/testuser' },
    });
    const userId = user._id.toString();

    await Availability.create({
      userId: user._id,
      schedule: [
        { day: 'tuesday', timeRanges: [{ start: '14:00', end: '18:00' }] },
      ],
      preference: 60,
      personalityTags: [],
    });

    const req = createMockNextRequest('http://localhost:3000/api/users/' + userId);
    const response = await GET(req, { params: { id: userId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(typeof body.data.profileCompleteness).toBe('number');
    // avatarUrl(15) + position(10) + career(5) + introduction>10chars(20) + techTags(20) + socialLinks(15) + schedule(15) = 100
    expect(body.data.profileCompleteness).toBe(100);
  });
});
