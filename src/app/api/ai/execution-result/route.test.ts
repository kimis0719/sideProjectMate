import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import mongoose from 'mongoose';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import Note from '@/lib/models/kanban/NoteModel';
import AiInstructionHistory from '@/lib/models/AiInstructionHistory';
import AiExecutionLog from '@/lib/models/AiExecutionLog';
import { POST } from './route';

const BASE_URL = 'http://localhost:3000/api/ai/execution-result';

const mockSession = {
  user: {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'TestUser',
    email: 'test@test.com',
    memberType: 'user',
  },
  expires: '2099-12-31T23:59:59.999Z',
};

beforeAll(async () => await setupTestDB());
afterEach(async () => {
  await clearTestDB();
  vi.clearAllMocks();
});
afterAll(async () => await teardownTestDB());

// ── 공통 픽스처 ──

async function createNote(
  boardId: mongoose.Types.ObjectId,
  text: string,
  status: 'active' | 'done' = 'active'
) {
  return Note.create({
    text,
    boardId,
    creatorId: new mongoose.Types.ObjectId(),
    status,
    color: '#FFFB8F',
    width: 200,
    height: 140,
  });
}

async function createInstruction(boardId: mongoose.Types.ObjectId, noteIds: string[]) {
  return AiInstructionHistory.create({
    projectId: 1,
    boardId,
    creatorId: new mongoose.Types.ObjectId(),
    preset: '기능 구현',
    target: { type: 'notes', noteIds },
    resultMarkdown: '# 지시서',
    inputTokens: 100,
    outputTokens: 200,
    provider: 'gemini',
    modelName: 'gemini-2.0-flash',
  });
}

function makeSpmResult(
  instructionId: string,
  notes: { id: string; title: string; status: string }[]
) {
  return JSON.stringify({
    instructionId,
    completedNotes: notes.map((n) => ({
      noteId: n.id,
      noteTitle: n.title,
      status: n.status,
      summary: `${n.title} 완료`,
    })),
    testsResult: 'pass',
  });
}

// ── 테스트 ──

describe('POST /api/ai/execution-result', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: 'abc', rawInput: 'text' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('boardId 또는 rawInput 없으면 400을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawInput: '텍스트만' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('파싱 불가한 입력은 422를 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId().toString();
    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, rawInput: '파싱 불가한 자유 텍스트입니다.' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('유효하지 않은 instructionId는 400을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId().toString();
    const rawInput = JSON.stringify({
      instructionId: 'not-a-valid-objectid',
      completedNotes: [],
    });
    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, rawInput }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('존재하지 않는 instructionId는 404를 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId().toString();
    const fakeInstructionId = new mongoose.Types.ObjectId().toString();
    const rawInput = JSON.stringify({
      instructionId: fakeInstructionId,
      completedNotes: [],
    });
    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, rawInput }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('done 노트를 자동 완료처리한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();
    const note = await createNote(boardId, 'Redis 설정 구현');
    const instruction = await createInstruction(boardId, [note._id.toString()]);

    const rawInput = `\`\`\`spm-result\n${makeSpmResult(instruction._id.toString(), [
      { id: note._id.toString(), title: 'Redis 설정 구현', status: 'done' },
    ])}\n\`\`\``;

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: boardId.toString(), rawInput }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.autoCompleted).toHaveLength(1);
    expect(json.data.autoCompleted[0].noteId).toBe(note._id.toString());
    expect(json.data.autoCompleted[0].newStatus).toBe('done');
    expect(json.data.requiresConfirmation).toHaveLength(0);

    // DB 반영 확인
    const updated = await Note.findById(note._id).lean();
    expect(updated?.status).toBe('done');
    expect(updated?.completionNote).toBe('Redis 설정 구현 완료');
  });

  it('partial/failed 노트는 requiresConfirmation에 포함된다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();
    const note = await createNote(boardId, '캐시 무효화 로직');
    const instruction = await createInstruction(boardId, [note._id.toString()]);

    const rawInput = makeSpmResult(instruction._id.toString(), [
      { id: note._id.toString(), title: '캐시 무효화 로직', status: 'partial' },
    ]);

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: boardId.toString(), rawInput }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.autoCompleted).toHaveLength(0);
    expect(json.data.requiresConfirmation).toHaveLength(1);
    expect(json.data.requiresConfirmation[0].agentStatus).toBe('partial');

    // DB는 변경되지 않음
    const notChanged = await Note.findById(note._id).lean();
    expect(notChanged?.status).toBe('active');
  });

  it('이미 완료된 노트는 DB 재업데이트 없이 autoCompleted에 포함된다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();
    const note = await createNote(boardId, '이미 완료된 노트', 'done');
    const instruction = await createInstruction(boardId, [note._id.toString()]);

    const rawInput = makeSpmResult(instruction._id.toString(), [
      { id: note._id.toString(), title: '이미 완료된 노트', status: 'done' },
    ]);

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: boardId.toString(), rawInput }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.autoCompleted[0].previousStatus).toBe('done');
  });

  it('다른 boardId의 노트는 무시한다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();
    const otherBoardId = new mongoose.Types.ObjectId();
    const note = await createNote(otherBoardId, '다른 보드 노트');
    const instruction = await createInstruction(boardId, []);

    const rawInput = makeSpmResult(instruction._id.toString(), [
      { id: note._id.toString(), title: '다른 보드 노트', status: 'done' },
    ]);

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: boardId.toString(), rawInput }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.autoCompleted).toHaveLength(0);
    expect(json.data.requiresConfirmation).toHaveLength(0);

    // 원본 노트는 변경되지 않음
    const original = await Note.findById(note._id).lean();
    expect(original?.status).toBe('active');
  });

  it('AiExecutionLog가 저장된다', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();
    const note = await createNote(boardId, '로그 테스트 노트');
    const instruction = await createInstruction(boardId, [note._id.toString()]);

    const rawInput = `\`\`\`spm-result\n${makeSpmResult(instruction._id.toString(), [
      { id: note._id.toString(), title: '로그 테스트 노트', status: 'done' },
    ])}\n\`\`\``;

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: boardId.toString(), rawInput }),
    });
    await POST(req);

    const log = await AiExecutionLog.findOne({ instructionId: instruction._id }).lean();
    expect(log).not.toBeNull();
    expect(log?.parseMethod).toBe('json');
    expect(log?.results).toHaveLength(1);
    expect(log?.testsResult).toBe('pass');
  });

  it('복수 노트 혼합 처리 (done + partial)', async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const boardId = new mongoose.Types.ObjectId();
    const note1 = await createNote(boardId, '노트1');
    const note2 = await createNote(boardId, '노트2');
    const instruction = await createInstruction(boardId, [
      note1._id.toString(),
      note2._id.toString(),
    ]);

    const rawInput = makeSpmResult(instruction._id.toString(), [
      { id: note1._id.toString(), title: '노트1', status: 'done' },
      { id: note2._id.toString(), title: '노트2', status: 'partial' },
    ]);

    const req = new Request(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: boardId.toString(), rawInput }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(json.data.autoCompleted).toHaveLength(1);
    expect(json.data.requiresConfirmation).toHaveLength(1);
    expect((await Note.findById(note1._id).lean())?.status).toBe('done');
    expect((await Note.findById(note2._id).lean())?.status).toBe('active');
  });
});
