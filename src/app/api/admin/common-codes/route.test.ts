import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import CommonCode from '@/lib/models/CommonCode';
import { GET, POST } from './route';

function mockAdmin() {
  mockGetServerSession.mockResolvedValue({
    user: { _id: '000000000000000000000001', memberType: 'admin' },
    expires: '2099-12-31',
  });
}

function mockUser() {
  mockGetServerSession.mockResolvedValue({
    user: { _id: '000000000000000000000002', memberType: 'user' },
    expires: '2099-12-31',
  });
}

describe('GET/POST /api/admin/common-codes', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('관리자가 공통 코드 목록을 조회한다', async () => {
    mockAdmin();
    await CommonCode.create([
      { group: 'PROJECT_STATUS', groupName: '프로젝트 상태', code: '01', label: '모집중', order: 1, isActive: true },
      { group: 'PROJECT_STATUS', groupName: '프로젝트 상태', code: '02', label: '진행중', order: 2, isActive: true },
    ]);

    const req = createMockNextRequest('http://localhost:3000/api/admin/common-codes');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('그룹별로 코드를 필터링한다', async () => {
    mockAdmin();
    await CommonCode.create([
      { group: 'PROJECT_STATUS', groupName: '프로젝트 상태', code: '01', label: '모집중', order: 1, isActive: true },
      { group: 'ROLE_TYPE', groupName: '역할 타입', code: 'DEV', label: '개발자', order: 1, isActive: true },
    ]);

    const req = createMockNextRequest('http://localhost:3000/api/admin/common-codes?group=PROJECT_STATUS');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].group).toBe('PROJECT_STATUS');
  });

  it('새 공통 코드를 생성한다', async () => {
    mockAdmin();
    const req = createMockNextRequest('http://localhost:3000/api/admin/common-codes', {
      method: 'POST',
      body: {
        group: 'PROJECT_STATUS',
        groupName: '프로젝트 상태',
        code: '01',
        label: '모집중',
        order: 1,
        isActive: true,
      },
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.group).toBe('PROJECT_STATUS');
    expect(body.data.code).toBe('01');
    expect(body.data.label).toBe('모집중');

    // DB에 실제 저장 확인
    const saved = await CommonCode.findById(body.data._id);
    expect(saved).not.toBeNull();
    expect(saved!.label).toBe('모집중');
  });

  it('필수 필드 누락 시 400을 반환한다', async () => {
    mockAdmin();
    const req = createMockNextRequest('http://localhost:3000/api/admin/common-codes', {
      method: 'POST',
      body: {
        group: 'PROJECT_STATUS',
        // groupName, code, label 누락
      },
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('일반 유저는 403을 반환한다', async () => {
    mockUser();
    const req = createMockNextRequest('http://localhost:3000/api/admin/common-codes');

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });
});
