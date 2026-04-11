import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import HarnessCatalog from '@/lib/models/HarnessCatalog';
import { GET } from './route';

const BASE_URL = 'http://localhost:3000/api/ai/harness-catalog';

function makeReq(): NextRequest {
  return new Request(BASE_URL) as unknown as NextRequest;
}

function mockSession() {
  return {
    user: {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Test',
      email: 'test@test.com',
      memberType: 'user',
    },
    expires: '2099-12-31',
  };
}

beforeAll(async () => await setupTestDB());
afterEach(async () => {
  await clearTestDB();
  vi.clearAllMocks();
});
afterAll(async () => await teardownTestDB());

describe('GET /api/ai/harness-catalog', () => {
  it('비로그인 시 401', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('카탈로그 목록 반환 (filesCache 미포함)', async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession());

    await HarnessCatalog.create({
      harnessId: '01-test-harness',
      name: 'Test Harness',
      domain: 'content-creation',
      description: 'A test harness',
      tags: ['test'],
      techStacks: ['TypeScript'],
      agents: [
        { name: 'agent1', role: 'tester', description: 'Test agent', filename: 'agent1.md' },
      ],
      skills: [
        { name: 'skill1', type: 'orchestrator', description: 'Test skill', dirname: 'skill1' },
      ],
      architecturePattern: 'pipeline',
      filesCache: {
        ko: {
          'CLAUDE.md': '# Test',
          agents: { 'agent1.md': '---\nname: agent1\n---' },
          skills: {},
        },
        en: {
          'CLAUDE.md': '# Test',
          agents: { 'agent1.md': '---\nname: agent1\n---' },
          skills: {},
        },
      },
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].harnessId).toBe('01-test-harness');
    // filesCache가 projection으로 제외되었는지 확인
    expect(json.data[0].filesCache).toBeUndefined();
  });

  it('빈 카탈로그 시 빈 배열 반환', async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession());
    const res = await GET(makeReq());
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(0);
  });
});
