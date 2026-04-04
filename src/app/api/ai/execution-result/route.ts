import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import Note, { INote } from '@/lib/models/kanban/NoteModel';
import AiInstructionHistory from '@/lib/models/AiInstructionHistory';
import AiExecutionLog from '@/lib/models/AiExecutionLog';
import { parseExecutionResult } from '@/lib/utils/ai/parseExecutionResult';

export const dynamic = 'force-dynamic';

// POST /api/ai/execution-result — 실행결과 파싱 & 노트 자동 완료처리
async function handlePost(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  const body = await request.json();
  const { boardId, instructionId, rawInput } = body as {
    boardId: string;
    instructionId?: string;
    rawInput: string;
  };

  if (!boardId || !rawInput) {
    return NextResponse.json(
      { success: false, message: 'boardId와 rawInput은 필수입니다.' },
      { status: 400 }
    );
  }

  // ── 1단계: JSON 파싱 ──
  const parsed = parseExecutionResult(rawInput);
  if (!parsed) {
    return NextResponse.json(
      { success: false, message: '실행결과를 파싱할 수 없습니다. spm-result 형식을 확인해주세요.' },
      { status: 422 }
    );
  }

  // ── 원본 지시서 확인 ──
  const resolvedInstructionId = instructionId ?? parsed.instructionId;
  if (!mongoose.Types.ObjectId.isValid(resolvedInstructionId)) {
    return NextResponse.json(
      { success: false, message: '유효하지 않은 instructionId입니다.' },
      { status: 400 }
    );
  }

  const instruction = await AiInstructionHistory.findById(resolvedInstructionId).lean();
  if (!instruction) {
    return NextResponse.json(
      { success: false, message: '해당 지시서를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // ── 노트 완료처리 ──
  const autoCompleted: { noteId: string; previousStatus: string; newStatus: string }[] = [];
  const requiresConfirmation: {
    noteId: string;
    noteTitle: string;
    agentStatus: string;
    summary: string;
  }[] = [];

  const now = new Date();

  for (const result of parsed.completedNotes) {
    if (!mongoose.Types.ObjectId.isValid(result.noteId)) continue;

    const note = await Note.findOne({ _id: result.noteId, boardId }).lean<INote>();
    if (!note) continue;

    // 이미 완료된 노트는 자동 완료 목록에만 포함 (DB 재업데이트 불필요)
    if (note.status === 'done') {
      autoCompleted.push({
        noteId: result.noteId,
        previousStatus: 'done',
        newStatus: 'done',
      });
      continue;
    }

    if (result.status === 'done') {
      await Note.findByIdAndUpdate(result.noteId, {
        status: 'done',
        completedAt: now,
        completionNote: result.summary,
        updaterId: session.user._id,
      });
      autoCompleted.push({
        noteId: result.noteId,
        previousStatus: note.status,
        newStatus: 'done',
      });
    } else {
      requiresConfirmation.push({
        noteId: result.noteId,
        noteTitle: result.noteTitle,
        agentStatus: result.status,
        summary: result.summary,
      });
    }
  }

  // ── 실행 로그 저장 ──
  await AiExecutionLog.create({
    instructionId: resolvedInstructionId,
    boardId,
    executorId: session.user._id,
    results: parsed.completedNotes.map((r) => ({
      noteId: mongoose.Types.ObjectId.isValid(r.noteId) ? r.noteId : undefined,
      noteTitle: r.noteTitle,
      status: r.status,
      summary: r.summary,
    })),
    additionalNotes: parsed.additionalNotes ?? '',
    filesChanged: parsed.filesChanged ?? [],
    testsResult: parsed.testsResult,
    rawInput,
    parseMethod: 'json',
  });

  return NextResponse.json({
    success: true,
    data: {
      parsed,
      autoCompleted,
      requiresConfirmation,
    },
  });
}

export const POST = withApiLogging(handlePost, '/api/ai/execution-result');
