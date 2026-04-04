import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiSettings from '@/lib/models/AiSettings';
import AiUsage from '@/lib/models/AiUsage';
import AiInstructionHistory from '@/lib/models/AiInstructionHistory';
import Board from '@/lib/models/kanban/BoardModel';
import Note from '@/lib/models/kanban/NoteModel';
import { getLlmProvider } from '@/lib/ai';
import { buildAiContext } from '@/lib/utils/board/buildAiContext';
import { generateResultTemplate } from '@/lib/utils/ai/generateResultTemplate';
import { validateAdditionalInstruction } from '@/lib/utils/ai/validateAdditionalInstruction';
import type { TokenUsage } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

// POST /api/ai/generate-instruction — 지시서 생성 (스트리밍)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { boardId, target, reference, preset, presetInstruction, additionalInstruction } = body;

    if (!boardId || !target?.type) {
      return NextResponse.json(
        { success: false, message: 'boardId와 target.type은 필수입니다.' },
        { status: 400 }
      );
    }

    // ── 설정 조회 ──
    const settings = await AiSettings.getInstance();
    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, message: 'AI 지시서 기능이 비활성화되어 있습니다.' },
        { status: 403 }
      );
    }

    // ── 어드민 여부 ──
    const isAdmin = session.user.memberType === 'admin';

    // ── 보드 → 프로젝트 PID 조회 ──
    const board = (await Board.findById(boardId).lean()) as { _id: string; pid: number } | null;
    if (!board) {
      return NextResponse.json(
        { success: false, message: '보드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // ── 쿨다운 체크 (어드민 스킵) ──
    if (!isAdmin) {
      const lastUsage = (await AiUsage.findOne({ userId: session.user._id })
        .sort({ createdAt: -1 })
        .lean()) as { createdAt: Date } | null;

      if (lastUsage) {
        const elapsed = Date.now() - new Date(lastUsage.createdAt).getTime();
        const cooldown = settings.cooldownMinutes * 60 * 1000;
        if (elapsed < cooldown) {
          const remaining = Math.ceil((cooldown - elapsed) / 60000);
          return NextResponse.json(
            { success: false, message: `${remaining}분 후에 다시 생성할 수 있습니다.` },
            { status: 429 }
          );
        }
      }
    }

    // ── 일일 한도 체크 (어드민 스킵) ──
    if (!isAdmin) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCount = await AiUsage.countDocuments({
        projectId: board.pid,
        createdAt: { $gte: todayStart },
      });
      if (todayCount >= settings.dailyLimitPerProject) {
        return NextResponse.json(
          { success: false, message: '오늘 프로젝트 일일 한도에 도달했습니다.' },
          { status: 429 }
        );
      }
    }

    // ── 추가 지시사항 가드레일 검증 (어드민 스킵) ──
    if (!isAdmin && additionalInstruction) {
      const guardRailError = validateAdditionalInstruction(
        additionalInstruction,
        settings.guardRailPatterns ?? []
      );
      if (guardRailError) {
        return NextResponse.json({ success: false, message: guardRailError }, { status: 400 });
      }
    }

    // ── 컨텍스트 조립 ──
    const { systemPrompt, userMessage } = await buildAiContext({
      boardId,
      target,
      reference,
      presetInstruction,
      additionalInstruction,
    });

    // ── LLM 스트리밍 ──
    // 모델 우선순위 목록 생성 (modelPriority가 있으면 사용, 없으면 modelName 단독)
    const modelList = settings.modelPriority?.length
      ? settings.modelPriority
          .sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority)
          .map((m: { modelName: string }) => m.modelName)
      : [settings.modelName];
    const provider = getLlmProvider(settings.provider, modelList);
    const stream = provider.generateStream({ systemPrompt, userMessage });

    let fullResult = '';
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, estimatedCost: 0 };

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'token') {
              fullResult += chunk.content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'token', content: chunk.content })}\n\n`
                )
              );
            } else if (chunk.type === 'done') {
              usage = chunk.usage;
            }
          }

          // ── 사용량 기록 ──
          await AiUsage.create({
            userId: session.user._id,
            projectId: board.pid,
            boardId,
            provider: settings.provider,
            modelName: settings.modelName,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            estimatedCost: usage.estimatedCost,
          });

          // ── 실행결과 템플릿용 대상 노트 조회 ──
          type LeanNote = { _id: string; text: string };
          let targetNotes: LeanNote[] = [];
          if (target.type === 'notes' && target.noteIds?.length) {
            targetNotes = (await Note.find(
              { _id: { $in: target.noteIds } },
              { _id: 1, text: 1 }
            ).lean()) as unknown as LeanNote[];
          } else if (target.type === 'sections' && target.sectionIds?.length) {
            targetNotes = (await Note.find(
              { sectionId: { $in: target.sectionIds }, boardId, status: 'active' },
              { _id: 1, text: 1 }
            ).lean()) as unknown as LeanNote[];
          } else if (target.type === 'all') {
            targetNotes = (await Note.find(
              { boardId, status: 'active' },
              { _id: 1, text: 1 }
            ).lean()) as unknown as LeanNote[];
          }

          // ── 히스토리 저장 (resultMarkdown에 실행결과 템플릿 포함) ──
          // 템플릿은 DB에만 저장하고 스트리밍에는 포함하지 않음
          // 클라이언트는 히스토리 조회 시 전체 마크다운(템플릿 포함)을 받음
          const tempHistory = new AiInstructionHistory();
          const historyId = tempHistory._id.toString();
          const resultTemplate = generateResultTemplate(historyId, targetNotes);
          const finalMarkdown = `${fullResult}\n\n${resultTemplate}`;

          const history = await AiInstructionHistory.create({
            _id: tempHistory._id,
            projectId: board.pid,
            boardId,
            creatorId: session.user._id,
            preset: preset ?? '',
            target,
            reference: reference ?? undefined,
            additionalInstruction: additionalInstruction ?? '',
            resultMarkdown: finalMarkdown,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            provider: settings.provider,
            modelName: settings.modelName,
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'done',
                usage,
                historyId: history._id,
                hasResultTemplate: true,
              })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : '스트리밍 중 오류 발생';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `지시서 생성 중 오류가 발생했습니다: ${message}` },
      { status: 500 }
    );
  }
}
