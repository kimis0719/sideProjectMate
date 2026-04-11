import HarnessCatalog, { IHarnessCatalog } from '@/lib/models/HarnessCatalog';
import { getLlmProvider } from '@/lib/ai';
import AiSettings from '@/lib/models/AiSettings';

export interface HarnessRecommendation {
  harnessId: string;
  name: string;
  domain: string;
  matchScore: number;
  matchReasons: string[];
  agents: Array<{ name: string; role: string; description: string }>;
  skills: Array<{ name: string; type: string; description: string }>;
  architecturePattern: string;
}

interface RecommendContext {
  projectTechStacks: string[];
  presetType: string;
  targetNoteTexts: string[];
  projectDescription?: string;
}

/**
 * 태그/기술스택 기반 빠른 필터링 후 AI 정밀 매칭으로 하네스를 추천한다.
 */
export async function recommendHarness(
  context: RecommendContext
): Promise<HarnessRecommendation[]> {
  // 1단계: 태그 기반 빠른 필터링
  const keywords = extractKeywords(context.targetNoteTexts);
  const searchTerms = [...context.projectTechStacks.map((t) => t.toLowerCase()), ...keywords];

  const candidates = (await HarnessCatalog.find(
    {
      $or: [{ techStacks: { $in: context.projectTechStacks } }, { tags: { $in: searchTerms } }],
    },
    { filesCache: 0 } // filesCache 제외하여 쿼리 경량화
  )
    .lean()
    .limit(15)) as unknown as IHarnessCatalog[];

  if (candidates.length === 0) {
    // 매칭 후보가 없으면 전체에서 상위 5개를 AI에게 맡김
    const fallback = (await HarnessCatalog.find({}, { filesCache: 0 })
      .lean()
      .limit(10)) as unknown as IHarnessCatalog[];
    return aiRank(fallback, context);
  }

  // 2단계: AI 정밀 매칭 (상위 후보에 대해)
  return aiRank(candidates, context);
}

/**
 * LLM을 사용하여 후보 하네스를 순위 매김
 */
async function aiRank(
  candidates: IHarnessCatalog[],
  context: RecommendContext
): Promise<HarnessRecommendation[]> {
  const settings = await AiSettings.getInstance();
  const modelNames = (settings.modelPriority || []).map((m: { modelName: string }) => m.modelName);
  const provider = getLlmProvider(settings.provider, modelNames);

  const candidateList = candidates
    .map((c) => `- ${c.harnessId}: ${c.name} (${c.domain}) — ${c.description.slice(0, 100)}`)
    .join('\n');

  const systemPrompt = `당신은 프로젝트에 가장 적합한 에이전트 팀 하네스를 추천하는 전문가입니다.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "harnessId": "하네스 ID",
    "matchScore": 0~100 사이의 정수,
    "matchReasons": ["추천 이유 1", "추천 이유 2"]
  }
]

최대 3개까지 추천하되, 매칭 점수가 30 미만인 것은 제외하세요.`;

  const userMessage = `프로젝트 기술 스택: ${context.projectTechStacks.join(', ') || '미지정'}
작업 유형: ${context.presetType || '일반'}
작업 내용:
${context.targetNoteTexts.join('\n').slice(0, 500)}
${context.projectDescription ? `프로젝트 설명: ${context.projectDescription}` : ''}

후보 하네스 목록:
${candidateList}`;

  try {
    const stream = provider.generateStream({ systemPrompt, userMessage });
    let result = '';
    for await (const chunk of stream) {
      if (chunk.type === 'token') result += chunk.content;
    }

    // JSON 파싱
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return buildFallbackRecommendations(candidates);

    const ranked: Array<{ harnessId: string; matchScore: number; matchReasons: string[] }> =
      JSON.parse(jsonMatch[0]);

    // 후보 매핑
    return ranked
      .filter((r) => r.matchScore >= 30)
      .slice(0, 3)
      .map((r) => {
        const candidate = candidates.find((c) => c.harnessId === r.harnessId);
        if (!candidate) return null;
        return {
          harnessId: candidate.harnessId,
          name: candidate.name,
          domain: candidate.domain,
          matchScore: r.matchScore,
          matchReasons: r.matchReasons,
          agents: candidate.agents.map((a) => ({
            name: a.name,
            role: a.role,
            description: a.description,
          })),
          skills: candidate.skills.map((s) => ({
            name: s.name,
            type: s.type,
            description: s.description,
          })),
          architecturePattern: candidate.architecturePattern,
        };
      })
      .filter(Boolean) as HarnessRecommendation[];
  } catch {
    // AI 호출 실패 시 태그 매칭 기반 폴백
    return buildFallbackRecommendations(candidates);
  }
}

/**
 * AI 호출 실패 시 태그 매칭 점수 기반 폴백 추천
 */
function buildFallbackRecommendations(candidates: IHarnessCatalog[]): HarnessRecommendation[] {
  return candidates.slice(0, 3).map((c, i) => ({
    harnessId: c.harnessId,
    name: c.name,
    domain: c.domain,
    matchScore: 70 - i * 10,
    matchReasons: ['태그/기술스택 기반 매칭'],
    agents: c.agents.map((a) => ({
      name: a.name,
      role: a.role,
      description: a.description,
    })),
    skills: c.skills.map((s) => ({
      name: s.name,
      type: s.type,
      description: s.description,
    })),
    architecturePattern: c.architecturePattern,
  }));
}

/**
 * 노트 텍스트에서 검색용 키워드 추출
 */
function extractKeywords(texts: string[]): string[] {
  const combined = texts.join(' ').toLowerCase();
  const words = combined.split(/[\s,./·\-_()[\]{}'"]+/);
  // 2글자 이상, 영문+한글 단어만
  return words.filter((w) => w.length >= 2 && /^[a-z가-힣]+$/i.test(w));
}
