import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

import Board from '@/lib/models/kanban/BoardModel';
import Project from '@/lib/models/Project';
import User from '@/lib/models/User';
import { GET } from './route';

describe('GET /api/kanban/boards', () => {
  let userId: string;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  async function createUser() {
    const user = await User.create({
      authorEmail: 'kanban-test@test.com',
      nName: 'test',
      uid: 1,
      memberType: 'user',
      password: 'test1234',
    });
    userId = user._id.toString();
    return user;
  }

  async function createProject(pid: number = 1) {
    return Project.create({
      pid,
      title: 'P1',
      category: 'WEB',
      author: userId,
      members: [],
      content: 'c',
      status: '01',
    });
  }

  it('pid로 보드를 조회한다 (기존 보드 있을 때)', async () => {
    await createUser();
    await Board.create({ pid: 1, name: 'Existing Board', ownerId: userId });

    const req = new Request('http://localhost:3000/api/kanban/boards?pid=1');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.pid).toBe(1);
    expect(json.data.name).toBe('Existing Board');
  });

  it('보드가 없으면 프로젝트 정보로 자동 생성한다', async () => {
    await createUser();
    await createProject(2);

    const req = new Request('http://localhost:3000/api/kanban/boards?pid=2');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.pid).toBe(2);
    expect(json.data.name).toBe('P1');
    expect(json.data.ownerId).toBe(userId);

    // DB에 실제 저장되었는지 확인
    const savedBoard = await Board.findOne({ pid: 2 });
    expect(savedBoard).not.toBeNull();
    expect(savedBoard!.name).toBe('P1');
  });

  it('pid 파라미터가 없으면 400을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/kanban/boards');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('프로젝트가 없으면 404를 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/kanban/boards?pid=9999');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.message).toBe('프로젝트를 찾을 수 없습니다.');
  });
});
