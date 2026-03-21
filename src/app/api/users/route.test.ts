import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import User from '@/lib/models/User';
import { GET, POST } from './route';

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

describe('GET /api/users', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('전체 유저 목록을 조회한다 (빈 목록)', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('유저가 있을 때 전체 목록을 조회한다', async () => {
    await createTestUser({ authorEmail: 'user1@test.com', uid: 1001 });
    await createTestUser({ authorEmail: 'user2@test.com', uid: 1002 });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
  });

  it('응답에서 비밀번호가 제외된다', async () => {
    await createTestUser({ authorEmail: 'nopass@test.com', uid: 2001, password: 'secret123' });

    const response = await GET();
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].password).toBeUndefined();
  });
});

describe('POST /api/users', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('새 유저를 생성한다', async () => {
    const body = {
      authorEmail: 'newuser@test.com',
      nName: '새유저',
      uid: 3001,
      memberType: 'user',
      password: 'pass1234',
    };

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.authorEmail).toBe('newuser@test.com');
    expect(json.data.nName).toBe('새유저');

    // DB에 실제 저장 확인
    const saved = await User.findOne({ authorEmail: 'newuser@test.com' });
    expect(saved).not.toBeNull();
  });

  it('필수 필드 없이 생성하면 400을 반환한다', async () => {
    const body = {
      nName: '이메일없는유저',
      uid: 4001,
    };

    const request = new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBeDefined();
  });
});
