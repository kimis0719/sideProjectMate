import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiInstructionHistory, { IAiInstructionHistory } from '@/lib/models/AiInstructionHistory';
import HarnessCatalog, { IHarnessCatalog } from '@/lib/models/HarnessCatalog';
import Board from '@/lib/models/kanban/BoardModel';
import Note from '@/lib/models/kanban/NoteModel';
import Project from '@/lib/models/Project';
import { buildZipPackage } from '@/lib/utils/harness/buildZipPackage';

export const dynamic = 'force-dynamic';

// GET /api/ai/history/[id]/download — 지시서 + 하네스 ZIP 다운로드
// ?harnessId=01-nextjs-fullstack&lang=ko
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const harnessId = searchParams.get('harnessId');
  const lang = (searchParams.get('lang') as 'ko' | 'en') || 'ko';

  // 지시서 히스토리 조회
  const history = (await AiInstructionHistory.findById(params.id).lean()) as
    | (IAiInstructionHistory & { _id: string })
    | null;
  if (!history) {
    return NextResponse.json(
      { success: false, message: '히스토리를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 하네스 ID가 없으면 지시서만 텍스트로 반환
  if (!harnessId) {
    return new Response(history.resultMarkdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="instruction-${params.id}.md"`,
      },
    });
  }

  // 하네스 조회
  const harness = (await HarnessCatalog.findOne({
    harnessId,
  }).lean()) as IHarnessCatalog | null;
  if (!harness) {
    return NextResponse.json(
      { success: false, message: `하네스를 찾을 수 없습니다: ${harnessId}` },
      { status: 404 }
    );
  }

  // 보드 → 프로젝트 정보 조회
  const board = (await Board.findById(history.boardId).lean()) as {
    pid: number;
  } | null;
  const project = board
    ? ((await Project.findOne({ pid: board.pid }).populate('techStacks').lean()) as {
        title: string;
        description: string;
        techStacks: Array<string | { name: string }>;
        members: Array<{ userId: string; role: string }>;
      } | null)
    : null;

  // 대상 노트 — resolvedNoteIds(생성 시 실제 사용된 노트) 우선 사용
  let targetNotesQuery;
  const resolvedIds = (history as unknown as Record<string, unknown>).resolvedNoteIds as
    | string[]
    | undefined;
  if (resolvedIds && resolvedIds.length > 0) {
    targetNotesQuery = Note.find({ _id: { $in: resolvedIds } })
      .select('text')
      .lean();
  } else {
    // 레거시 히스토리 (resolvedNoteIds 없는 경우) — target.type으로 폴백
    const targetType = history.target?.type || 'all';
    if (targetType === 'notes' && history.target?.noteIds?.length) {
      targetNotesQuery = Note.find({ _id: { $in: history.target.noteIds } })
        .select('text')
        .lean();
    } else if (targetType === 'sections' && history.target?.sectionIds?.length) {
      targetNotesQuery = Note.find({
        sectionId: { $in: history.target.sectionIds },
        status: 'active',
      })
        .select('text')
        .lean();
    } else {
      targetNotesQuery = Note.find({ boardId: history.boardId, status: 'active' })
        .select('text')
        .lean();
    }
  }

  // 참조 노트 — 섹션 기반
  let referenceNotesQuery;
  const refSectionIds = history.reference?.sectionIds || [];
  const refNoteIds = history.reference?.noteIds || [];
  if (refSectionIds.length > 0) {
    referenceNotesQuery = Note.find({ sectionId: { $in: refSectionIds } })
      .select('text')
      .lean();
  } else if (refNoteIds.length > 0) {
    referenceNotesQuery = Note.find({ _id: { $in: refNoteIds } })
      .select('text')
      .lean();
  } else {
    referenceNotesQuery = Promise.resolve([]);
  }

  const [targetNotes, referenceNotes] = await Promise.all([targetNotesQuery, referenceNotesQuery]);

  const techStackNames = (project?.techStacks || []).map((t) =>
    typeof t === 'string' ? t : t.name
  );

  // ZIP 생성
  const zipBuffer = await buildZipPackage({
    instruction: {
      resultMarkdown: history.resultMarkdown,
      preset: history.preset,
      createdAt: history.createdAt,
    },
    harness: harness as IHarnessCatalog,
    lang,
    project: {
      title: project?.title || 'Untitled Project',
      description: project?.description,
      techStacks: techStackNames,
    },
    targetNoteTexts: (targetNotes as unknown as Array<{ text: string }>).map((n) => n.text),
    referenceNoteTexts: (referenceNotes as unknown as Array<{ text: string }>).map((n) => n.text),
  });

  const filename = `spm-instruction-${harness.harnessId}-${lang}.zip`;

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zipBuffer.length),
    },
  });
}
