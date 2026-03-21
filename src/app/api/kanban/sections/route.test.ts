import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

import Section from '@/lib/models/kanban/SectionModel';
import { GET, POST } from './route';

describe('GET /api/kanban/sections', () => {
  const boardId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('boardId로 섹션 목록을 조회한다', async () => {
    await Section.create([
      { boardId, title: 'Section A', x: 0, y: 0, width: 300, height: 400 },
      { boardId, title: 'Section B', x: 400, y: 0, width: 300, height: 400 },
    ]);

    const req = createMockNextRequest(
      `http://localhost:3000/api/kanban/sections?boardId=${boardId.toString()}`
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    const titles = json.data.map((s: any) => s.title).sort();
    expect(titles).toEqual(['Section A', 'Section B']);
  });

  it('섹션이 없으면 빈 배열을 반환한다', async () => {
    const emptyBoardId = new mongoose.Types.ObjectId();
    const req = createMockNextRequest(
      `http://localhost:3000/api/kanban/sections?boardId=${emptyBoardId.toString()}`
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it('boardId가 없으면 400을 반환한다', async () => {
    const req = createMockNextRequest(
      'http://localhost:3000/api/kanban/sections'
    );
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe('POST /api/kanban/sections', () => {
  const boardId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('새 섹션을 생성한다', async () => {
    const req = createMockNextRequest(
      'http://localhost:3000/api/kanban/sections',
      {
        method: 'POST',
        body: {
          boardId: boardId.toString(),
          title: 'New Section',
          x: 0,
          y: 0,
          width: 300,
          height: 400,
        },
      }
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('New Section');
    expect(json.data.x).toBe(0);
    expect(json.data.y).toBe(0);
    expect(json.data.width).toBe(300);
    expect(json.data.height).toBe(400);

    // DB에 실제 저장되었는지 확인
    const saved = await Section.findOne({ boardId: boardId.toString() });
    expect(saved).not.toBeNull();
    expect(saved!.title).toBe('New Section');
  });
});
