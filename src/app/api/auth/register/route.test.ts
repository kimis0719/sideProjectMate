import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import User from '@/lib/models/User';
import { POST } from './route';

function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  it('회원가입이 성공적으로 완료된다 (201)', async () => {
    const req = createRequest({
      authorEmail: 'test@example.com',
      password: 'password123',
      nName: '테스트유저',
      mblNo: '010-1234-5678',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.message).toBe('회원가입이 성공적으로 완료되었습니다.');
    expect(json.data.authorEmail).toBe('test@example.com');
    expect(json.data.nName).toBe('테스트유저');
    expect(json.data.mblNo).toBe('010-1234-5678');
    expect(json.data.uid).toBeDefined();
    expect(json.data.memberType).toBe('user');
    expect(json.data.createdAt).toBeDefined();
    // 비밀번호가 응답에 포함되지 않아야 한다
    expect(json.data.password).toBeUndefined();

    // DB에 실제로 저장되었는지 확인
    const savedUser = await User.findOne({ authorEmail: 'test@example.com' });
    expect(savedUser).not.toBeNull();
    // 비밀번호가 해싱되었는지 확인
    expect(savedUser!.password).not.toBe('password123');
  });

  it('nName과 mblNo 없이도 가입이 가능하다 (201)', async () => {
    const req = createRequest({
      authorEmail: 'minimal@example.com',
      password: 'password123',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.authorEmail).toBe('minimal@example.com');
    expect(json.data.nName).toBe('');
    expect(json.data.mblNo).toBe('');
  });

  it('이메일 없이 요청하면 400을 반환한다', async () => {
    const req = createRequest({
      password: 'password123',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('이메일과 비밀번호를 입력해주세요.');
  });

  it('비밀번호 없이 요청하면 400을 반환한다', async () => {
    const req = createRequest({
      authorEmail: 'test@example.com',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('이메일과 비밀번호를 입력해주세요.');
  });

  it('잘못된 이메일 형식이면 400을 반환한다', async () => {
    const req = createRequest({
      authorEmail: 'invalid-email',
      password: 'password123',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('올바른 이메일 형식이 아닙니다.');
  });

  it('비밀번호가 4자 미만이면 400을 반환한다', async () => {
    const req = createRequest({
      authorEmail: 'test@example.com',
      password: '123',
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('비밀번호는 최소 4자 이상이어야 합니다.');
  });

  it('중복 이메일로 가입하면 409를 반환한다', async () => {
    // 첫 번째 가입
    const req1 = createRequest({
      authorEmail: 'duplicate@example.com',
      password: 'password123',
    });
    await POST(req1);

    // 동일 이메일로 두 번째 가입 시도
    const req2 = createRequest({
      authorEmail: 'duplicate@example.com',
      password: 'password456',
    });

    const res = await POST(req2);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.success).toBe(false);
    expect(json.error).toBe('이미 존재하는 이메일입니다.');
  });

  it('uid가 자동으로 증가한다 (2명 가입 시 seq 확인)', async () => {
    const req1 = createRequest({
      authorEmail: 'first@example.com',
      password: 'password123',
    });
    const res1 = await POST(req1);
    const json1 = await res1.json();

    const req2 = createRequest({
      authorEmail: 'second@example.com',
      password: 'password123',
    });
    const res2 = await POST(req2);
    const json2 = await res2.json();

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(json2.data.uid).toBe(json1.data.uid + 1);
  });
});
