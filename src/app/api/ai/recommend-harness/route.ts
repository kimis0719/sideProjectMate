import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Board from '@/lib/models/kanban/BoardModel';
import Note from '@/lib/models/kanban/NoteModel';
import { recommendHarness } from '@/lib/utils/ai/recommendHarness';

export const dynamic = 'force-dynamic';

interface TargetScope {
  type: 'all' | 'sections' | 'notes';
  sectionIds?: string[];
  noteIds?: string[];
}

// POST /api/ai/recommend-harness — 프로젝트/노트 기반 하네스 추천
async function handlePost(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  const body = await request.json();
  const { boardId, presetName, target } = body as {
    boardId: string;
    presetName?: string;
    target?: TargetScope;
  };

  if (!boardId) {
    return NextResponse.json({ success: false, message: 'boardId는 필수입니다.' }, { status: 400 });
  }

  // 보드 → 프로젝트 조회
  const board = (await Board.findById(boardId).lean()) as {
    _id: string;
    pid: number;
  } | null;
  if (!board) {
    return NextResponse.json(
      { success: false, message: '보드를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  const project = (await Project.findOne({ pid: board.pid }).lean()) as {
    title: string;
    description: string;
    techStacks: string[];
  } | null;

  // 대상 노트 텍스트 수집 — target 타입별로 generate-instruction과 동일하게 조회
  let targetNoteTexts: string[] = [];
  const targetType = target?.type || 'all';

  if (targetType === 'notes' && target?.noteIds?.length) {
    const notes = (await Note.find({ _id: { $in: target.noteIds } })
      .select('text')
      .lean()) as unknown as Array<{ text: string }>;
    targetNoteTexts = notes.map((n) => n.text);
  } else if (targetType === 'sections' && target?.sectionIds?.length) {
    const notes = (await Note.find(
      { sectionId: { $in: target.sectionIds }, boardId, status: 'active' },
      { text: 1 }
    ).lean()) as unknown as Array<{ text: string }>;
    targetNoteTexts = notes.map((n) => n.text);
  } else {
    // all 또는 target 미지정 시 보드 전체 active 노트 조회
    const notes = (await Note.find(
      { boardId, status: 'active' },
      { text: 1 }
    ).lean()) as unknown as Array<{ text: string }>;
    targetNoteTexts = notes.map((n) => n.text);
  }

  const recommendations = await recommendHarness({
    projectTechStacks: project?.techStacks || [],
    presetType: presetName || '기능 구현',
    targetNoteTexts,
    projectDescription: project?.description,
  });

  return NextResponse.json({
    success: true,
    data: { recommendations },
  });
}

export const POST = withApiLogging(handlePost, '/api/ai/recommend-harness');
