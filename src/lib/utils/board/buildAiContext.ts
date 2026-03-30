import dbConnect from '@/lib/mongodb';
import AiSettings from '@/lib/models/AiSettings';
import Project from '@/lib/models/Project';
import Note from '@/lib/models/kanban/NoteModel';
import Section from '@/lib/models/kanban/SectionModel';
import Board from '@/lib/models/kanban/BoardModel';
import ProjectMember from '@/lib/models/ProjectMember';
import { renderTemplate } from '@/lib/utils/ai/renderTemplate';
import { generateBoardMarkdown } from '@/lib/utils/board/generateBoardMarkdown';

interface BuildAiContextParams {
  boardId: string;
  target: {
    type: 'all' | 'sections' | 'notes';
    sectionIds?: string[];
    noteIds?: string[];
  };
  reference?: {
    sectionIds?: string[];
    noteIds?: string[];
  };
  presetInstruction?: string;
  additionalInstruction?: string;
}

interface AiContext {
  systemPrompt: string;
  userMessage: string;
}

const STATUS_LABELS: Record<string, string> = {
  recruiting: '모집중',
  in_progress: '진행중',
  completed: '완료',
  paused: '일시정지',
};

/**
 * LLM에 전달할 systemPrompt와 userMessage를 조립한다.
 */
export async function buildAiContext(params: BuildAiContextParams): Promise<AiContext> {
  await dbConnect();

  const { boardId, target, reference, presetInstruction, additionalInstruction } = params;

  // lean 결과 타입
  type LeanNote = {
    _id: string;
    text: string;
    tags?: string[];
    dueDate?: Date;
    sectionId?: string;
  };
  type LeanSection = { _id: string; title: string };
  type LeanProject = {
    _id: string;
    title: string;
    tags?: Array<{ name: string }>;
    status?: string;
    overview?: string;
    resources?: Array<{ category: string; type: string; content: string }>;
    deadline?: Date;
  };

  // 병렬로 데이터 수집
  const [settings, board] = await Promise.all([
    AiSettings.getInstance(),
    Board.findById(boardId).lean() as Promise<{ _id: string; pid: number } | null>,
  ]);

  if (!board) throw new Error('보드를 찾을 수 없습니다.');

  const [project, allSections] = await Promise.all([
    Project.findOne({ pid: board.pid })
      .populate('tags', 'name')
      .lean() as unknown as Promise<LeanProject | null>,
    Section.find({ boardId }).lean() as unknown as Promise<LeanSection[]>,
  ]);

  // ── 대상 노트 수집 ──
  let targetNotes: LeanNote[];
  if (target.type === 'all') {
    targetNotes = (await Note.find({ boardId, status: 'active' }).lean()) as unknown as LeanNote[];
  } else if (target.type === 'sections' && target.sectionIds?.length) {
    targetNotes = (await Note.find({
      boardId,
      sectionId: { $in: target.sectionIds },
      status: 'active',
    }).lean()) as unknown as LeanNote[];
  } else if (target.type === 'notes' && target.noteIds?.length) {
    targetNotes = (await Note.find({
      _id: { $in: target.noteIds },
      status: 'active',
    }).lean()) as unknown as LeanNote[];
  } else {
    targetNotes = [];
  }

  // ── 참조 노트 수집 ──
  const referenceNotes: LeanNote[] = [];
  if (reference?.sectionIds?.length) {
    const refBySections = (await Note.find({
      boardId,
      sectionId: { $in: reference.sectionIds },
      status: 'active',
    }).lean()) as unknown as LeanNote[];
    referenceNotes.push(...refBySections);
  }
  if (reference?.noteIds?.length) {
    const refByNotes = (await Note.find({
      _id: { $in: reference.noteIds },
      status: 'active',
    }).lean()) as unknown as LeanNote[];
    referenceNotes.push(...refByNotes);
  }

  // ── 프로젝트 메타 변수 ──
  const techStacks = project?.tags?.map((t) => t.name).join(', ') ?? '';

  let membersText = '';
  if (settings.contextIncludeMembers && project) {
    const members = (await ProjectMember.find({ projectId: project._id })
      .populate('userId', 'name')
      .lean()) as unknown as Array<{ userId?: { name?: string }; role?: string }>;
    membersText = members
      .map((m) => `- ${m.userId?.name ?? '알 수 없음'} (${m.role ?? '멤버'})`)
      .join('\n');
  }

  // ── 섹션 맵 (MD 변환용) ──
  const sectionDataList = allSections.map((s) => ({
    _id: String(s._id),
    title: s.title,
  }));

  // ── 참조 노트 → MD ──
  const referenceNotesMarkdown =
    referenceNotes.length > 0
      ? generateBoardMarkdown({
          notes: referenceNotes.map((n) => ({
            _id: String(n._id),
            text: n.text,
            tags: n.tags,
            dueDate: n.dueDate ? new Date(n.dueDate).toLocaleDateString('ko-KR') : null,
            sectionId: n.sectionId ? String(n.sectionId) : null,
          })),
          sections: sectionDataList,
        })
      : '';

  // ── 대상 노트 → MD (userMessage) ──
  const targetNotesMarkdown = generateBoardMarkdown({
    notes: targetNotes.map((n) => ({
      _id: String(n._id),
      text: n.text,
      tags: n.tags,
      dueDate: n.dueDate ? new Date(n.dueDate).toLocaleDateString('ko-KR') : null,
      sectionId: n.sectionId ? String(n.sectionId) : null,
    })),
    sections: sectionDataList,
  });

  // ── 템플릿 변수 ──
  const variables: Record<string, string | undefined> = {
    projectTitle: project?.title ?? '알 수 없는 프로젝트',
    techStacks,
    projectStatus: STATUS_LABELS[project?.status ?? ''] ?? '알 수 없음',
    deadline:
      settings.contextIncludeDeadline && project?.deadline
        ? new Date(project.deadline).toLocaleDateString('ko-KR')
        : '미정',
    overview: settings.contextIncludeOverview ? (project?.overview ?? undefined) : undefined,
    resources:
      settings.contextIncludeResources && project?.resources?.length
        ? project.resources.map((r) => `- [${r.category}] ${r.content}`).join('\n')
        : undefined,
    members: membersText || undefined,
    referenceNotes: referenceNotesMarkdown || undefined,
    targetNotes: targetNotesMarkdown,
    presetInstruction: presetInstruction || undefined,
    additionalInstruction: additionalInstruction || undefined,
    currentDate: new Date().toISOString().split('T')[0],
  };

  const systemPrompt = renderTemplate(settings.systemPromptTemplate, variables);

  // userMessage: 대상 노트 + 추가 지시
  const userParts: string[] = [
    '아래 노트들을 분석하여 AI 코딩 에이전트용 지시서(Markdown)를 생성해주세요.',
  ];
  if (presetInstruction) {
    userParts.push(`\n**역할 지시:** ${presetInstruction}`);
  }
  if (additionalInstruction) {
    userParts.push(`\n**추가 지시:** ${additionalInstruction}`);
  }
  userParts.push(`\n---\n\n${targetNotesMarkdown}`);

  return {
    systemPrompt,
    userMessage: userParts.join('\n'),
  };
}
