import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';
import mongoose from 'mongoose';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import CommonCode from '@/lib/models/CommonCode';
import { PUT, DELETE } from './route';

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

describe('PUT/DELETE /api/admin/common-codes/[id]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('공통 코드를 수정한다', async () => {
    mockAdmin();
    const code = await CommonCode.create({
      group: 'PROJECT_STATUS',
      groupName: '프로젝트 상태',
      code: '01',
      label: '모집중',
      order: 1,
      isActive: true,
    });

    const req = createMockNextRequest(`http://localhost:3000/api/admin/common-codes/${code._id}`, {
      method: 'PUT',
      body: { label: '모집완료', order: 5, isActive: false, groupName: '프로젝트 상태' },
    });

    const response = await PUT(req, { params: { id: code._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.label).toBe('모집완료');
    expect(body.data.order).toBe(5);
    expect(body.data.isActive).toBe(false);

    // DB 반영 확인
    const updated = await CommonCode.findById(code._id);
    expect(updated!.label).toBe('모집완료');
  });

  it('존재하지 않는 코드면 404를 반환한다 (PUT)', async () => {
    mockAdmin();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const req = createMockNextRequest(`http://localhost:3000/api/admin/common-codes/${fakeId}`, {
      method: 'PUT',
      body: { label: '변경' },
    });

    const response = await PUT(req, { params: { id: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('공통 코드를 삭제한다', async () => {
    mockAdmin();
    const code = await CommonCode.create({
      group: 'PROJECT_STATUS',
      groupName: '프로젝트 상태',
      code: '01',
      label: '모집중',
      order: 1,
      isActive: true,
    });

    const req = createMockNextRequest(`http://localhost:3000/api/admin/common-codes/${code._id}`, {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: code._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // DB에서 삭제 확인
    const deleted = await CommonCode.findById(code._id);
    expect(deleted).toBeNull();
  });

  it('존재하지 않는 코드면 404를 반환한다 (DELETE)', async () => {
    mockAdmin();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const req = createMockNextRequest(`http://localhost:3000/api/admin/common-codes/${fakeId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('일반 유저는 403을 반환한다', async () => {
    mockUser();
    const code = await CommonCode.create({
      group: 'PROJECT_STATUS',
      groupName: '프로젝트 상태',
      code: '01',
      label: '모집중',
      order: 1,
      isActive: true,
    });

    const req = createMockNextRequest(`http://localhost:3000/api/admin/common-codes/${code._id}`, {
      method: 'PUT',
      body: { label: '변경' },
    });

    const response = await PUT(req, { params: { id: code._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });
});
