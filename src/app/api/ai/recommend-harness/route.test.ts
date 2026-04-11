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

// AI 추천 로직을 모킹 (LLM 호출 없이)
vi.mock('@/lib/utils/ai/recommendHarness', () => ({
  recommendHarness: async () => [
    {
      harnessId: '16-fullstack-webapp',
      name: 'Fullstack Webapp',
      domain: 'software-development',
      matchScore: 85,
      matchReasons: ['기술 스택 일치: Next.js'],
      agents: [{ name: 'architect', role: 'architect', description: '설계' }],
      skills: [{ name: 'fullstack-webapp', type: 'orchestrator', description: '오케스트레이터' }],
      architecturePattern: 'pipeline',
    },
  ],
}));

import Board from '@/lib/models/kanban/BoardModel';
import Project from '@/lib/models/Project';
import { POST } from './route';

const BASE_URL = 'http://localhost:3000/api/ai/recommend-harness';

function makeReq(body: unknown): NextRequest {
  return new Request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
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

describe('POST /api/ai/recommend-harness', () => {
  it('비로그인 시 401', async () => {
    mockGetServerSession.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ boardId: 'test' }));
    expect(res.status).toBe(401);
  });

  it('boardId 누락 시 400', async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession());
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 보드 시 404', async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession());
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await POST(makeReq({ boardId: fakeId }));
    expect(res.status).toBe(404);
  });

  it('정상 요청 시 추천 목록 반환', async () => {
    mockGetServerSession.mockResolvedValueOnce(mockSession());

    // 프로젝트 + 보드 생성
    const ownerId = new mongoose.Types.ObjectId();
    const project = await Project.create({
      pid: 9999,
      title: 'Test Project',
      description: 'Test',
      techStacks: [],
      authorId: ownerId,
      ownerId,
    });
    const board = await Board.create({
      pid: project.pid,
      name: 'Test Board',
      ownerId: ownerId,
    });

    const res = await POST(makeReq({ boardId: board._id.toString() }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.recommendations).toHaveLength(1);
    expect(json.data.recommendations[0].harnessId).toBe('16-fullstack-webapp');
    expect(json.data.recommendations[0].matchScore).toBe(85);
  });
});
