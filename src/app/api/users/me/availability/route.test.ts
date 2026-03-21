import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Availability from '@/lib/models/Availability';
import { GET, POST } from './route';

const BASE_URL = 'http://localhost:3000/api/users/me/availability';
const TEST_USER_ID = '000000000000000000000001';

const mockSession = {
  user: { _id: TEST_USER_ID, memberType: 'user' },
  expires: '2099-12-31',
};

const sampleSchedule = [
  {
    day: 'monday',
    timeRanges: [{ start: '09:00', end: '12:00' }],
  },
  {
    day: 'wednesday',
    timeRanges: [{ start: '14:00', end: '18:00' }],
  },
];

const samplePersonalityTags = ['analyst', 'doer'];

describe('GET /api/users/me/availability', () => {
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

  it('가용성 정보를 조회한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);

    // 미리 가용성 정보를 저장
    await Availability.create({
      userId: TEST_USER_ID,
      schedule: sampleSchedule,
      preference: 80,
      personalityTags: samplePersonalityTags,
    });

    const request = new Request(BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.userId.toString()).toBe(TEST_USER_ID);
    expect(json.data.schedule).toHaveLength(2);
    expect(json.data.schedule[0].day).toBe('monday');
    expect(json.data.preference).toBe(80);
    expect(json.data.personalityTags).toEqual(samplePersonalityTags);
  });

  it('가용성 정보가 없으면 기본값을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);

    const request = new Request(BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      schedule: [],
      preference: 50,
      personalityTags: [],
    });
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request(BASE_URL);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe('인증되지 않은 사용자입니다.');
  });
});

describe('POST /api/users/me/availability', () => {
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

  it('가용성 정보를 저장한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);

    const body = {
      schedule: sampleSchedule,
      preference: 70,
      personalityTags: samplePersonalityTags,
    };

    const request = new Request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe('가용성 정보가 저장되었습니다.');
    expect(json.data.userId.toString()).toBe(TEST_USER_ID);
    expect(json.data.schedule).toHaveLength(2);
    expect(json.data.preference).toBe(70);
    expect(json.data.personalityTags).toEqual(samplePersonalityTags);

    // DB에 실제 저장되었는지 확인
    const saved = await Availability.findOne({ userId: TEST_USER_ID });
    expect(saved).not.toBeNull();
    expect(saved!.preference).toBe(70);
  });

  it('기존 가용성 정보를 업데이트한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);

    // 기존 데이터 생성
    await Availability.create({
      userId: TEST_USER_ID,
      schedule: sampleSchedule,
      preference: 30,
      personalityTags: ['analyst'],
    });

    const updatedBody = {
      schedule: [{ day: 'friday', timeRanges: [{ start: '10:00', end: '15:00' }] }],
      preference: 90,
      personalityTags: ['doer', 'leader'],
    };

    const request = new Request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(updatedBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.preference).toBe(90);
    expect(json.data.schedule).toHaveLength(1);
    expect(json.data.schedule[0].day).toBe('friday');
    expect(json.data.personalityTags).toEqual(['doer', 'leader']);

    // DB에 하나의 문서만 존재하는지 확인 (upsert 동작)
    const count = await Availability.countDocuments({ userId: TEST_USER_ID });
    expect(count).toBe(1);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({ schedule: [], preference: 50, personalityTags: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe('인증되지 않은 사용자입니다.');
  });
});
