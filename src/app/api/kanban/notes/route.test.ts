import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/dbConnect', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Note from '@/lib/models/kanban/NoteModel';
import { GET, POST } from './route';

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

const BASE_URL = 'http://localhost:3000/api/kanban/notes';

const mockSession = {
  user: {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'TestUser',
    email: 'test@test.com',
    memberType: 'user',
  },
  expires: '2099-12-31T23:59:59.999Z',
};

describe('GET /api/kanban/notes', () => {
  it('보드의 노트 목록을 조회한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();

    await Note.create({
      text: 'Test Note 1',
      x: 100,
      y: 200,
      color: '#FFFB8F',
      width: 200,
      height: 140,
      boardId,
      creatorId: new mongoose.Types.ObjectId(),
    });
    await Note.create({
      text: 'Test Note 2',
      x: 300,
      y: 400,
      color: '#FFFB8F',
      width: 200,
      height: 140,
      boardId,
      creatorId: new mongoose.Types.ObjectId(),
    });

    const req = new Request(`${BASE_URL}?boardId=${boardId.toString()}`);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].text).toBe('Test Note 1');
    expect(json.data[1].text).toBe('Test Note 2');
  });

  it('boardId가 없으면 400을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);

    const req = new Request(BASE_URL);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const boardId = new mongoose.Types.ObjectId();
    const req = new Request(`${BASE_URL}?boardId=${boardId.toString()}`);
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});

describe('POST /api/kanban/notes', () => {
  it('새 노트를 생성한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'New Note',
        x: 150,
        y: 250,
        boardId: boardId.toString(),
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.text).toBe('New Note');
    expect(json.data.x).toBe(150);
    expect(json.data.y).toBe(250);
    expect(json.data.creatorId).toBe(mockSession.user._id);

    // DB에 실제로 저장되었는지 확인
    const savedNote = await Note.findById(json.data._id);
    expect(savedNote).not.toBeNull();
    expect(savedNote!.text).toBe('New Note');
  });

  it('필수 필드가 누락되면 400을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Missing fields' }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const boardId = new mongoose.Types.ObjectId();

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'New Note',
        x: 100,
        y: 200,
        boardId: boardId.toString(),
      }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });
});
