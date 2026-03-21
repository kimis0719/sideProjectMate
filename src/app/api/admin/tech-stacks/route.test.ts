import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import TechStack from '@/lib/models/TechStack';
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

describe('GET/POST /api/admin/tech-stacks', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('관리자가 기술 스택 목록을 조회한다', async () => {
    mockAdmin();
    await TechStack.create([
      { name: 'React', category: 'frontend', logoUrl: 'https://example.com/react.png' },
      { name: 'Node.js', category: 'backend', logoUrl: 'https://example.com/node.png' },
    ]);

    const req = createMockNextRequest('http://localhost:3000/api/admin/tech-stacks');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
  });

  it('카테고리별로 필터링한다', async () => {
    mockAdmin();
    await TechStack.create([
      { name: 'React', category: 'frontend', logoUrl: 'https://example.com/react.png' },
      { name: 'Vue', category: 'frontend', logoUrl: 'https://example.com/vue.png' },
      { name: 'Node.js', category: 'backend', logoUrl: 'https://example.com/node.png' },
    ]);

    const req = createMockNextRequest('http://localhost:3000/api/admin/tech-stacks?category=frontend');
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data.every((s: { category: string }) => s.category === 'frontend')).toBe(true);
  });

  it('새 기술 스택을 생성한다', async () => {
    mockAdmin();
    const req = createMockNextRequest('http://localhost:3000/api/admin/tech-stacks', {
      method: 'POST',
      body: {
        name: 'TypeScript',
        category: 'frontend',
        logoUrl: 'https://example.com/ts.png',
      },
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('TypeScript');
    expect(body.data.category).toBe('frontend');

    // DB에 실제 저장 확인
    const saved = await TechStack.findById(body.data._id);
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('TypeScript');
  });

  it('필수 필드 누락 시 400을 반환한다', async () => {
    mockAdmin();
    const req = createMockNextRequest('http://localhost:3000/api/admin/tech-stacks', {
      method: 'POST',
      body: {
        logoUrl: 'https://example.com/logo.png',
        // name, category 누락
      },
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('일반 유저는 403을 반환한다', async () => {
    mockUser();
    const req = createMockNextRequest('http://localhost:3000/api/admin/tech-stacks');

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });
});
