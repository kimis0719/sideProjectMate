import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

import Note from '@/lib/models/kanban/NoteModel';
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

async function createTestNote(overrides = {}) {
  const boardId = new mongoose.Types.ObjectId();
  return Note.create({
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

describe('PATCH /api/kanban/notes/[noteId]', () => {
  it('노트를 수정한다', async () => {
    const note = await createTestNote();

    const req = new Request('http://localhost:3000/api/kanban/notes/' + note._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Updated Note', x: 300 }),
    });
    const res = await PATCH(req, { params: { noteId: note._id.toString() } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.text).toBe('Updated Note');
    expect(json.data.x).toBe(300);
    expect(json.data.y).toBe(200); // 변경하지 않은 필드는 유지
  });

  it('노트를 완료 처리한다 (status=done)', async () => {
    const note = await createTestNote();
    const completedAt = new Date();

    const req = new Request('http://localhost:3000/api/kanban/notes/' + note._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', completedAt, completionNote: '작업 완료' }),
    });
    const res = await PATCH(req, { params: { noteId: note._id.toString() } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('done');
    expect(json.data.completionNote).toBe('작업 완료');
    expect(json.data.completedAt).toBeTruthy();
  });

  it('노트를 되돌린다 (status=active)', async () => {
    const note = await createTestNote({ status: 'done', completedAt: new Date() });

    const req = new Request('http://localhost:3000/api/kanban/notes/' + note._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', completedAt: null }),
    });
    const res = await PATCH(req, { params: { noteId: note._id.toString() } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('active');
    expect(json.data.completedAt).toBeNull();
  });

  it('존재하지 않는 노트면 404를 반환한다', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const req = new Request('http://localhost:3000/api/kanban/notes/' + fakeId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Updated' }),
    });
    const res = await PATCH(req, { params: { noteId: fakeId.toString() } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it('유효하지 않은 noteId면 400을 반환한다', async () => {
    const req = new Request('http://localhost:3000/api/kanban/notes/invalid-id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Updated' }),
    });
    const res = await PATCH(req, { params: { noteId: 'invalid-id' } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe('DELETE /api/kanban/notes/[noteId]', () => {
  it('노트를 삭제한다', async () => {
    const note = await createTestNote();

    const req = new Request('http://localhost:3000/api/kanban/notes/' + note._id, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { noteId: note._id.toString() } });

    expect(res.status).toBe(204);

    // DB에서 실제로 삭제되었는지 확인
    const deleted = await Note.findById(note._id);
    expect(deleted).toBeNull();
  });

  it('존재하지 않는 노트면 404를 반환한다', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const req = new Request('http://localhost:3000/api/kanban/notes/' + fakeId, {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { noteId: fakeId.toString() } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });
});
