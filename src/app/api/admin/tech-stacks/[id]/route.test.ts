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

import TechStack from '@/lib/models/TechStack';
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

describe('PUT/DELETE /api/admin/tech-stacks/[id]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('기술 스택을 수정한다', async () => {
    mockAdmin();
    const stack = await TechStack.create({
      name: 'React',
      category: 'frontend',
      logoUrl: 'https://example.com/react.png',
    });

    const req = createMockNextRequest(`http://localhost:3000/api/admin/tech-stacks/${stack._id}`, {
      method: 'PUT',
      body: { name: 'React.js', category: 'frontend', logoUrl: 'https://example.com/reactjs.png' },
    });

    const response = await PUT(req, { params: { id: stack._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('React.js');
    expect(body.data.logoUrl).toBe('https://example.com/reactjs.png');

    // DB 반영 확인
    const updated = await TechStack.findById(stack._id);
    expect(updated!.name).toBe('React.js');
  });

  it('존재하지 않는 스택이면 404를 반환한다 (PUT)', async () => {
    mockAdmin();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const req = createMockNextRequest(`http://localhost:3000/api/admin/tech-stacks/${fakeId}`, {
      method: 'PUT',
      body: { name: '변경' },
    });

    const response = await PUT(req, { params: { id: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('기술 스택을 삭제한다', async () => {
    mockAdmin();
    const stack = await TechStack.create({
      name: 'Vue',
      category: 'frontend',
      logoUrl: 'https://example.com/vue.png',
    });

    const req = createMockNextRequest(`http://localhost:3000/api/admin/tech-stacks/${stack._id}`, {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: stack._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // DB에서 삭제 확인
    const deleted = await TechStack.findById(stack._id);
    expect(deleted).toBeNull();
  });

  it('존재하지 않는 스택이면 404를 반환한다 (DELETE)', async () => {
    mockAdmin();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const req = createMockNextRequest(`http://localhost:3000/api/admin/tech-stacks/${fakeId}`, {
      method: 'DELETE',
    });

    const response = await DELETE(req, { params: { id: fakeId } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('일반 유저는 403을 반환한다', async () => {
    mockUser();
    const stack = await TechStack.create({
      name: 'Angular',
      category: 'frontend',
      logoUrl: 'https://example.com/angular.png',
    });

    const req = createMockNextRequest(`http://localhost:3000/api/admin/tech-stacks/${stack._id}`, {
      method: 'PUT',
      body: { name: '변경' },
    });

    const response = await PUT(req, { params: { id: stack._id.toString() } });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });
});
