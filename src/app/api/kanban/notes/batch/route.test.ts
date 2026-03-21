import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';
import NoteModel from '@/lib/models/kanban/NoteModel';
import { PATCH, DELETE } from './route';

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

const BASE_URL = 'http://localhost:3000/api/kanban/notes/batch';

async function createTestNote(overrides = {}) {
  const boardId = new mongoose.Types.ObjectId();
  return NoteModel.create({
    text: 'Test Note',
    x: 100,
    y: 200,
    color: '#FFFB8F',
    width: 200,
    height: 140,
    boardId,
    creatorId: new mongoose.Types.ObjectId(),
    ...overrides,
  });
}

describe('PATCH /api/kanban/notes/batch', () => {
  it('여러 노트를 일괄 수정한다', async () => {
    const note1 = await createTestNote({ text: 'Note 1' });
    const note2 = await createTestNote({ text: 'Note 2' });

    const req = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: {
        updates: [
          { id: note1._id.toString(), changes: { text: 'Updated 1' } },
          { id: note2._id.toString(), changes: { text: 'Updated 2' } },
        ],
      },
    });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);

    // DB에서 실제로 수정되었는지 확인
    const updated1 = await NoteModel.findById(note1._id);
    const updated2 = await NoteModel.findById(note2._id);
    expect(updated1!.text).toBe('Updated 1');
    expect(updated2!.text).toBe('Updated 2');
  });

  it('updates가 배열이 아니면 400을 반환한다', async () => {
    const req = createMockNextRequest(BASE_URL, {
      method: 'PATCH',
      body: { updates: 'not-an-array' },
    });
    const res = await PATCH(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe('DELETE /api/kanban/notes/batch', () => {
  it('여러 노트를 일괄 삭제한다', async () => {
    const note1 = await createTestNote({ text: 'Delete 1' });
    const note2 = await createTestNote({ text: 'Delete 2' });

    const req = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: {
        ids: [note1._id.toString(), note2._id.toString()],
      },
    });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);

    // DB에서 실제로 삭제되었는지 확인
    const deleted1 = await NoteModel.findById(note1._id);
    const deleted2 = await NoteModel.findById(note2._id);
    expect(deleted1).toBeNull();
    expect(deleted2).toBeNull();
  });

  it('ids가 배열이 아니면 400을 반환한다', async () => {
    const req = createMockNextRequest(BASE_URL, {
      method: 'DELETE',
      body: { ids: 'not-an-array' },
    });
    const res = await DELETE(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
