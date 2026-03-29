# 칸반보드 → AI 에이전트 지시서 생성기 — 기획안 v6

> **핵심 비전**: 칸반보드의 노트들을 AI가 가공하여, 코딩 에이전트(Claude Code, Cursor 등)에 바로 붙여넣을 수 있는 **구조화된 지시용 MD 파일**을 만들어준다.
>
> AI는 코드를 만들지 않는다. 소스에 접근할 수 없는 AI가 코드를 만들어봤자 붙이기만 골치아프다.
> **AI의 역할은 단 하나 — 산발적인 노트를 에이전트가 즉시 실행할 수 있는 명확한 지시서로 정제하는 것.**

---

## 1. LLM 선정: 테스트용 무료 AI + 확장 구조

### 1-1. 추천: Google Gemini 2.0 Flash (무료 티어)

| 항목     | 내용                                               |
| -------- | -------------------------------------------------- |
| 모델     | Gemini 2.0 Flash                                   |
| 비용     | **완전 무료** (Google AI Studio 무료 티어)         |
| 제한     | 10 RPM / 250 요청/일 / 250K 토큰/분                |
| 컨텍스트 | **1,000,000 토큰** (보드 전체를 넣고도 남음)       |
| 품질     | 텍스트 정리/구조화에 충분, 코드 생성이 아니니까 OK |
| 신용카드 | **불필요**                                         |

**왜 Gemini인가?**

- 무료 요청 한도가 **250회/일**로 가장 넉넉함 (5인 팀이 하루 50회씩 써도 여유)
- 100만 토큰 컨텍스트로 대형 보드도 문제없음
- Google AI Studio에서 API 키 즉시 발급

**대안 (백업):**

| 모델                  | 무료 한도                 | 장점             | 단점                   |
| --------------------- | ------------------------- | ---------------- | ---------------------- |
| Groq (Llama 3.3 70B)  | 1,000 요청/일, 6K 토큰/분 | 응답 속도 최고   | 토큰/분 제한이 빡빡    |
| Cloudflare Workers AI | 10K Neurons/일            | 다양한 모델 선택 | Neurons 단위 환산 복잡 |
| GPT-4o-mini           | 유료 ($0.15/$0.60)        | 안정적 품질      | 무료 아님              |

### 1-2. 확장 가능한 LLM 추상화 레이어

추후 모델 교체를 위해 **Provider 패턴**으로 추상화:

```ts
// src/lib/ai/types.ts
interface LlmProvider {
  generateStream(params: {
    systemPrompt: string;
    userMessage: string;
  }): AsyncGenerator<{ type: 'token' | 'done'; content?: string; usage?: TokenUsage }>;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number; // USD (무료면 0)
}

// src/lib/ai/providers/gemini.ts   ← Phase 1 (무료)
// src/lib/ai/providers/anthropic.ts ← Phase 2 (유료 전환 시)
// src/lib/ai/providers/openai.ts    ← Phase 2 (대안)

// src/lib/ai/index.ts
export function getLlmProvider(provider: string): LlmProvider {
  switch (provider) {
    case 'gemini':
      return new GeminiProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'openai':
      return new OpenAiProvider();
    default:
      return new GeminiProvider();
  }
}
```

모델 변경 시 **새 Provider 파일 하나 추가**하면 끝. API Route는 손댈 필요 없음.

---

## 2. 프로젝트 컨텍스트 자동 수집

### 2-1. 이미 DB에 있는 컨텍스트 데이터

Project 모델에 이미 풍부한 컨텍스트가 있음:

| 필드               | 타입                     | 활용                                             |
| ------------------ | ------------------------ | ------------------------------------------------ |
| `title`            | string                   | 프로젝트명                                       |
| `overview`         | string (PM 전용)         | **프로젝트 개요 — 지시서 상단에 삽입**           |
| `resources`        | IResource[]              | **참고 링크/문서 — 지시서에 참조 섹션으로 포함** |
| `tags` → TechStack | ObjectId[]               | 기술스택 목록                                    |
| `status`           | '01'/'02'/'03'           | 프로젝트 상태                                    |
| `deadline`         | Date                     | 마감일                                           |
| `members`          | { role, current, max }[] | 팀 역할 구성                                     |
| `content`          | string                   | 프로젝트 상세 설명                               |

### 2-2. 모달에서 "참조 노트" 직접 지정

지시 대상과 참조 데이터를 **사용자가 모달에서 직접 구분**한다.

모달의 범위 선택 영역이 두 구역으로 나뉨:

```
── ① 지시 대상 (이 노트들을 작업 지시로 변환) ──
  ☑ 백엔드 리팩토링 섹션 (5개)
  ☑ 버그 섹션 (3개)

── ② 참조 컨텍스트 (배경 정보로 AI에게 전달) ──
  ☐ 프로젝트 기본 섹션 (4개)    ← 컨벤션, 아키텍처 메모 등
  ☐ 기획 논의 섹션 (6개)        ← 의사결정 배경
  ☐ 개별 노트 추가...
```

- **지시 대상**: AI가 "이걸 해라"라는 작업으로 변환하는 노트
- **참조 컨텍스트**: AI가 지시서를 쓸 때 참고하는 배경 정보 (컨벤션, 아키텍처 결정, 환경 설정 등)

참조 노트는 시스템 프롬프트의 `## 프로젝트 컨텍스트 노트` 블록에 삽입되고,
지시 대상 노트와 명확히 분리되어 AI가 혼동하지 않음.

키워드 매칭 같은 자동 감지 없이, **사용자의 판단에 맡기는 게 가장 정확하고 유연함.**

### 2-3. 시스템 프롬프트: 템플릿 변수 치환 방식

시스템 프롬프트를 소스에 하드코딩하지 않고, **AiSettings(싱글턴)에 저장된 템플릿**을 변수 치환하여 조립한다.
관리자가 어드민 페이지에서 자유롭게 편집 가능.

```markdown
당신은 프로젝트 관리 보드의 노트를 AI 코딩 에이전트가 즉시 실행 가능한
지시서(Markdown)로 변환하는 전문가입니다.

## 규칙

1. 코드를 직접 작성하지 마세요. 소스에 접근할 수 없습니다.
2. 코딩 에이전트가 무엇을 해야 하는지 명확하게 지시하세요.
3. 모호한 메모를 구체적인 작업 단위로 분해하세요.
4. 한국어로 작성하세요.

## 프로젝트 정보

- 이름: {{projectTitle}}
- 기술스택: {{techStacks}}
- 상태: {{projectStatus}}
- 마감일: {{deadline}}

{{#if overview}}

## 프로젝트 개요

{{overview}}
{{/if}}

{{#if resources}}

## 참고 리소스

{{resources}}
{{/if}}

{{#if referenceNotes}}

## 참조 컨텍스트

{{referenceNotes}}
{{/if}}

## 지시 대상 노트

{{targetNotes}}
```

**사용 가능한 변수:**

| 변수                        | 설명                               |
| --------------------------- | ---------------------------------- |
| `{{projectTitle}}`          | 프로젝트 이름                      |
| `{{techStacks}}`            | 기술스택 목록 (콤마 구분)          |
| `{{projectStatus}}`         | 프로젝트 상태 (모집중/진행중/완료) |
| `{{deadline}}`              | 마감일                             |
| `{{overview}}`              | 프로젝트 개요 (PM 필드)            |
| `{{resources}}`             | 프로젝트 리소스 목록               |
| `{{members}}`               | 팀원 목록 (이름, 역할)             |
| `{{referenceNotes}}`        | 사용자 지정 참조 노트 (MD)         |
| `{{targetNotes}}`           | 지시 대상 노트 (MD)                |
| `{{presetInstruction}}`     | 선택한 프리셋의 역할 지시          |
| `{{additionalInstruction}}` | 사용자 추가 지시                   |
| `{{currentDate}}`           | 현재 날짜                          |

**핵심**: `overview` + `resources` + 사용자가 지정한 참조 노트가 합쳐져서 에이전트에게 풍부한 배경 정보를 제공.
관리자가 토글로 각 컨텍스트 포함 여부를 제어할 수 있고, 변수 치환 실패 시 fallback 기본 템플릿 사용.

---

## 3. 관리자 페이지: AI 지시서 관리

### 3-1. 기존 어드민 구조에 추가

현재 어드민 페이지 구조:

```
/admin
  ├─ (대시보드)
  ├─ /projects    ← 프로젝트 관리
  ├─ /users       ← 사용자 관리
  ├─ /tech-stacks ← 기술스택 관리
  ├─ /common-codes ← 공통코드 관리
  └─ /ai-settings  ← 🆕 AI 지시서 관리
```

### 3-2. AI 설정 관리 화면 (탭 구조)

```
┌──────────────────────────────────────────────────────────┐
│  ⚙️ AI 지시서 설정                                        │
│                                                          │
│  [기본 설정]  [프롬프트 템플릿]  [기본 프리셋]  [사용량]    │
│  ══════════                                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── 전역 설정 ───────────────────────────────            │
│                                                          │
│  LLM 제공자    ┌──────────────────────┐                  │
│                │ Google Gemini       ▾│                  │
│                └──────────────────────┘                  │
│  모델          ┌──────────────────────┐                  │
│                │ gemini-2.0-flash    ▾│                  │
│                └──────────────────────┘                  │
│  API 키 상태   ✅ 연결됨                                  │
│                                                          │
│  ── 사용 제한 ───────────────────────────────            │
│                                                          │
│  생성 쿨다운   ┌──────┐                                  │
│  (분)         │  60  │  ← 사용자당 N분에 1회             │
│               └──────┘                                   │
│  일일 한도     ┌──────┐                                  │
│  (프로젝트당)  │  30  │  ← 프로젝트당 하루 N회            │
│               └──────┘                                   │
│  기능 활성화   ☑ AI 지시서 기능 ON                         │
│                                                          │
│  ┌──────────────┐                                        │
│  │   💾 저장하기  │                                        │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

**[프롬프트 템플릿] 탭:**

```
┌──────────────────────────────────────────────────────────┐
│  [기본 설정]  [프롬프트 템플릿]  [기본 프리셋]  [사용량]    │
│               ════════════════                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ── 시스템 프롬프트 템플릿 ──────────────────────────     │
│  ┌──────────────────────────────────────────────────┐    │
│  │ 당신은 프로젝트 관리 보드의 노트를 AI 코딩       │    │
│  │ 에이전트가 즉시 실행 가능한 지시서(Markdown)로    │    │
│  │ 변환하는 전문가입니다.                           │    │
│  │                                                  │    │
│  │ ## 규칙                                          │    │
│  │ 1. 코드를 직접 작성하지 마세요.                   │    │
│  │ ...                                              │    │
│  │                                                  │    │
│  │ ## 프로젝트 정보                                  │    │
│  │ - 이름: {{projectTitle}}                         │    │
│  │ - 기술스택: {{techStacks}}                       │    │
│  │ ...                                              │    │
│  └──────────────────────────────────────────────────┘    │
│  💡 사용 가능한 변수: 우측 참조 →                         │
│                                                          │
│  ── 컨텍스트 포함 설정 ─────────────────────────────     │
│  ☑ 프로젝트 개요 (overview) 포함                          │
│  ☑ 프로젝트 리소스 (resources) 포함                       │
│  ☑ 팀원 목록 포함                                        │
│  ☑ 마감일 포함                                           │
│                                                          │
│  ┌──────────────┐  ┌──────────────────┐                  │
│  │ 💾 저장하기   │  │ 🔄 기본값 복원   │                  │
│  └──────────────┘  └──────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

**[기본 프리셋] 탭:**

- 기본 제공 프리셋 5개의 이름/역할 지시를 관리자가 수정 가능
- 새 기본 프리셋 추가/삭제

**[사용량] 탭:**

```
┌──────────────────────────────────────────────────────────┐
│  [기본 설정]  [프롬프트 템플릿]  [기본 프리셋]  [사용량]    │
│                                                ════════  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  오늘: 23회 | 이번 주: 89회 | 이번 달: 312회              │
│                                                          │
│  ┌─ 프로젝트별 사용량 (이번 달) ───────────┐              │
│  │ 프로젝트명          │ 사용 횟수 │ 사용자 │              │
│  │ Side Project Mate   │    45    │  3명  │              │
│  │ Portfolio Builder   │    28    │  2명  │              │
│  │ ...                 │   ...    │  ...  │              │
│  └─────────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────┘
```

### 3-3. 관리 데이터 모델

```ts
// src/lib/models/AiSettings.ts — 싱글턴 (전역 설정)
interface IAiSettings extends Document {
  // 기본 설정
  provider: 'gemini' | 'anthropic' | 'openai';
  model: string;
  enabled: boolean;
  cooldownMinutes: number;
  dailyLimitPerProject: number;

  // 프롬프트 템플릿 관리
  systemPromptTemplate: string; // 메인 시스템 프롬프트 ({{변수}} 포함)
  contextIncludeOverview: boolean; // 프로젝트 overview 포함 여부
  contextIncludeResources: boolean; // 프로젝트 resources 포함 여부
  contextIncludeMembers: boolean; // 팀원 목록 포함 여부
  contextIncludeDeadline: boolean; // 마감일 포함 여부

  // 기본 프리셋 관리
  defaultPresets: Array<{
    name: string;
    roleInstruction: string;
    description: string;
  }>;

  updatedBy: ObjectId;
  updatedAt: Date;
}
```

### 3-4. 템플릿 렌더링 서버 로직

```ts
// src/lib/utils/ai/renderTemplate.ts
function renderTemplate(template: string, variables: Record<string, string>): string {
  // 1. {{#if variable}} ... {{/if}} 조건부 블록 처리
  // 2. {{variable}} 단순 치환
  // 3. 치환 실패 시 해당 변수 빈 문자열로 대체
}

// src/lib/utils/board/buildAiContext.ts
async function buildSystemPrompt(params: {
  boardId: string;
  targetNoteIds: string[];
  referenceNoteIds: string[];
  presetId?: string;
  additionalInstruction?: string;
}): Promise<string> {
  // 1. AiSettings에서 템플릿 로드
  const settings = await AiSettings.findOne();
  let template = settings.systemPromptTemplate;

  // 2. 프로젝트 데이터 수집 (settings의 토글에 따라)
  const project = await Project.findOne({ ... });
  const variables: Record<string, string> = {
    projectTitle: project.title,
    techStacks: techStacks.map(t => t.name).join(', '),
    currentDate: new Date().toISOString().split('T')[0],
    // ... 나머지 변수
  };

  // 3. 컨텍스트 토글에 따라 조건부 포함
  if (!settings.contextIncludeOverview) delete variables.overview;
  if (!settings.contextIncludeResources) delete variables.resources;

  // 4. 템플릿 변수 치환 (실패 시 fallback 기본 템플릿)
  try {
    return renderTemplate(template, variables);
  } catch {
    return renderTemplate(DEFAULT_TEMPLATE, variables);
  }
}
```

### 3-5. 관리자 API

```
GET    /api/admin/ai-settings          → 현재 설정 조회
PATCH  /api/admin/ai-settings          → 설정 변경
GET    /api/admin/ai-settings/usage    → 사용량 통계 (기간별, 프로젝트별)
```

### 3-6. 쿨다운 & 한도 체크 흐름

```ts
// /api/ai/generate-instruction/route.ts 내부
async function checkRateLimit(userId: string, projectId: number) {
  const settings = await AiSettings.findOne();
  if (!settings?.enabled) {
    return { allowed: false, message: 'AI 지시서 기능이 비활성화되었습니다.' };
  }

  // 1) 사용자 쿨다운 체크
  const lastUsage = await AiUsage.findOne({ userId }).sort({ createdAt: -1 });
  if (lastUsage) {
    const elapsed = Date.now() - lastUsage.createdAt.getTime();
    const cooldown = settings.cooldownMinutes * 60 * 1000;
    if (elapsed < cooldown) {
      const remaining = Math.ceil((cooldown - elapsed) / 60000);
      return { allowed: false, message: `${remaining}분 후에 다시 생성할 수 있습니다.` };
    }
  }

  // 2) 프로젝트 일일 한도 체크
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await AiUsage.countDocuments({
    projectId,
    createdAt: { $gte: todayStart },
  });
  if (todayCount >= settings.dailyLimitPerProject) {
    return { allowed: false, message: '오늘 프로젝트 일일 한도에 도달했습니다.' };
  }

  return { allowed: true };
}
```

---

## 4. UI: 모달 전용 범위 선택

지시서 대상 선택은 **모달 안에서만** 한다.
우클릭 메뉴나 외부 진입점 없음 → UI 단순화.

### 4-1. 진입점

보드 헤더의 **[📄 지시서 생성]** 버튼 **하나만** 존재.
클릭하면 InstructionModal이 열리고, 모달 안에서 범위를 선택.

### 4-2. 모달 UI

```
┌──────────────────────────────────────────────────────┐
│  📄 AI 지시서 생성                              ✕    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ── ① 지시 대상 (작업으로 변환할 노트) ──────────    │
│                                                      │
│  ○ 보드 전체 (24개 노트)                              │
│  ● 섹션 선택:                                        │
│    ☑ 백엔드 리팩토링 (5개 노트)                       │
│    ☐ 프론트엔드 (8개 노트)                            │
│    ☑ 버그 (3개 노트)                                 │
│  ○ 노트 직접 선택:                                   │
│    🔍 검색... ┌────────────────────────────┐         │
│              │ ☑ API 응답 형식 통일        │         │
│              │ ☑ Socket 이벤트 정리       │         │
│              │ ☐ 로고 디자인 후보 검토     │         │
│              └────────────────────────────┘         │
│                                                      │
│  ── 참조 컨텍스트 (배경 정보로 AI에게 전달) ─────    │
│  ☐ 프로젝트 기본 섹션 (4개 노트)                      │
│  ☐ 기획 논의 섹션 (6개 노트)                          │
│  ☐ 개별 노트 추가...                                 │
│                                                      │
│  ── ② 프리셋 ────────────────────────────────────    │
│  ┌────────────────────────────────────────────┐      │
│  │ 🛠️ 기능 구현 지시서                      ▾ │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ── ③ 추가 지시 (선택) ─────────────────────────     │
│  ┌────────────────────────────────────────────┐      │
│  │ 각 작업의 예상 소요시간도 포함해줘          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ┌────────────────────────────┐                      │
│  │         ✨ 생성하기         │                      │
│  └────────────────────────────┘                      │
│                                                      │
│  ── ④ 결과 미리보기 ────────────────────────────     │
│  ┌────────────────────────────────────────────┐      │
│  │ (마크다운 렌더링된 지시서 미리보기)          │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────┐ ┌───────────────┐ ┌──────────┐        │
│  │ 📋 복사  │ │ 💾 MD 다운로드 │ │ 🔄 재생성│        │
│  └──────────┘ └───────────────┘ └──────────┘        │
│                                                      │
│  💡 Gemini Flash · 입력 1,520 / 출력 830 토큰         │
│  ⏱️ 다음 생성 가능: 58분 후                           │
└──────────────────────────────────────────────────────┘
```

**포인트:**

- "프로젝트 기본" 같은 컨텍스트 섹션은 🔒 표시로 **자동 참조됨**을 보여줌 (체크 해제 불가)
- "노트 직접 선택" 모드에서는 검색으로 필터링 가능
- 하단에 쿨다운 남은 시간 표시

---

## 5. 지시서 히스토리

### 5-1. 데이터 모델

```ts
// src/lib/models/AiInstructionHistory.ts
interface IAiInstructionHistory extends Document {
  projectId: number; // pid
  boardId: ObjectId; // 보드 참조
  creatorId: ObjectId; // 생성한 사용자
  preset: string; // 사용한 프리셋 이름
  target: {
    // 지시 대상
    type: 'all' | 'sections' | 'notes';
    sectionIds?: ObjectId[];
    noteIds?: ObjectId[];
  };
  reference?: {
    // 참조 컨텍스트
    sectionIds?: ObjectId[];
    noteIds?: ObjectId[];
  };
  additionalInstruction?: string; // 추가 지시
  resultMarkdown: string; // 생성된 MD 원문
  inputTokens: number;
  outputTokens: number;
  provider: string; // 'gemini' | 'anthropic' 등
  model: string; // 'gemini-2.0-flash' 등
  createdAt: Date;
}
```

### 5-2. 히스토리 UI

보드 헤더에 [📄 지시서 생성] 옆에 [📜 히스토리] 버튼 추가:

```
┌──────────────────────────────────────────────────────┐
│  📜 지시서 히스토리                             ✕    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │ 🛠️ 기능 구현 지시서                        │      │
│  │ 주인 · 3시간 전 · 섹션: 백엔드 리팩토링     │      │
│  │ 노트 5개 → 작업 3개 생성                    │      │
│  │ ┌──────────┐ ┌──────────┐                  │      │
│  │ │ 📋 복사  │ │ 👁️ 보기  │                  │      │
│  │ └──────────┘ └──────────┘                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │ 🐛 버그 수정 지시서                         │      │
│  │ 김개발 · 어제 · 선택 노트 3개               │      │
│  │ 버그 3개 → 분석 3건 생성                    │      │
│  │ ┌──────────┐ ┌──────────┐                  │      │
│  │ │ 📋 복사  │ │ 👁️ 보기  │                  │      │
│  │ └──────────┘ └──────────┘                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  더 보기...                                          │
└──────────────────────────────────────────────────────┘
```

**기능:**

- 프로젝트 내 팀원 누구나 열람 가능
- "복사" → 클립보드에 바로 복사 (에이전트에 재사용)
- "보기" → 전문 미리보기 모달
- 최신순 정렬, 페이지네이션

### 5-3. 히스토리 API

```
GET /api/ai/history?boardId={boardId}&page=1&limit=20  → 히스토리 목록
GET /api/ai/history/{id}                                → 히스토리 상세
```

---

## 6. 전체 아키텍처 (v6)

```
┌─ 클라이언트 ──────────────────────────────────────────────┐
│                                                            │
│  BoardShell.tsx                                             │
│  ├─ 기존 캔버스 (노트 + 섹션)                               │
│  ├─ 헤더: [📄 지시서 생성] [📜 히스토리]                     │
│  ├─ InstructionModal.tsx (생성 모달)                        │
│  │   ├─ ScopeSelector   — 범위 선택 (전체/섹션/노트)        │
│  │   ├─ PresetSelector  — 프리셋 선택                       │
│  │   ├─ 추가 지시 입력                                      │
│  │   ├─ InstructionPreview — 결과 미리보기                   │
│  │   └─ 액션: 복사 / 다운로드 / 재생성                      │
│  └─ HistoryModal.tsx (히스토리 모달)                        │
│                                                            │
│  instructionStore.ts (모달 + 생성 상태)                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
          │ POST /api/ai/generate-instruction
          ▼
┌─ 서버 ──────────────────────────────────────────────────┐
│                                                          │
│  /api/ai/generate-instruction/route.ts                   │
│  ├─ 인증 확인                                             │
│  ├─ 쿨다운 & 일일 한도 체크 (AiSettings 참조)              │
│  ├─ 컨텍스트 수집                                         │
│  │   ├─ Project (title, overview, resources, tags)        │
│  │   ├─ 참조 노트/섹션 (사용자 지정, reference)            │
│  │   └─ 대상 노트/섹션 (사용자 지정, target)               │
│  ├─ 시스템 프롬프트 조립 (템플릿 변수 치환)                  │
│  ├─ LLM Provider 호출 (추상화 레이어)                      │
│  ├─ AiUsage + AiInstructionHistory 저장                   │
│  └─ ReadableStream 응답                                  │
│                                                          │
│  src/lib/ai/ (Provider 추상화)                            │
│  ├─ types.ts          — LlmProvider 인터페이스             │
│  ├─ index.ts          — Provider 팩토리                    │
│  └─ providers/                                            │
│      ├─ gemini.ts     — Phase 1 (무료)                    │
│      ├─ anthropic.ts  — 추후 확장                          │
│      └─ openai.ts     — 추후 확장                          │
│                                                          │
│  /api/admin/ai-settings/   — 관리자 설정                   │
│  /api/ai/history/          — 히스토리 CRUD                 │
│  /api/ai/presets/          — 프리셋 CRUD                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7. 데이터 모델 요약

| 모델                   | 용도                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `AiSettings`           | 전역 설정 (싱글턴) — provider, model, 쿨다운, 일일 한도, ON/OFF, 프롬프트 템플릿, 컨텍스트 토글, 기본 프리셋 |
| `AiUsage`              | 요청별 사용량 기록 — userId, projectId, 토큰, 비용                                                           |
| `AiPreset`             | 프롬프트 프리셋 — 프로젝트별, 팀 공유                                                                        |
| `AiInstructionHistory` | 생성 히스토리 — scope, 결과 MD, 메타데이터                                                                   |

---

## 8. API 설계 요약

| 엔드포인트                     | 메서드       | 용도                   |
| ------------------------------ | ------------ | ---------------------- |
| `/api/ai/generate-instruction` | POST         | 지시서 생성 (스트리밍) |
| `/api/ai/presets`              | GET/POST     | 프리셋 목록/생성       |
| `/api/ai/presets/[id]`         | PATCH/DELETE | 프리셋 수정/삭제       |
| `/api/ai/history`              | GET          | 히스토리 목록          |
| `/api/ai/history/[id]`         | GET          | 히스토리 상세          |
| `/api/admin/ai-settings`       | GET/PATCH    | 관리자 설정 조회/변경  |
| `/api/admin/ai-settings/usage` | GET          | 사용량 통계            |

---

## 9. 비용 분석

### 9-1. Phase 1: Gemini 무료 티어

| 항목        | 비용                    |
| ----------- | ----------------------- |
| LLM API     | **$0** (무료 티어)      |
| 서버 인프라 | $0 (기존 Render)        |
| DB          | $0 (기존 MongoDB Atlas) |
| **합계**    | **$0/월**               |

한도: 250 요청/일 × 30일 = **월 7,500회** 무료 사용 가능.
5인 팀이 하루 50회 써도 **여유**.

### 9-2. Phase 2 이후: 유료 전환 시

관리자가 어드민에서 provider를 Anthropic/OpenAI로 변경하면 비용 발생:

| 모델             | 요청당 비용 (중형 보드) | 5인 팀 월간 |
| ---------------- | ----------------------- | ----------- |
| Claude Haiku 4.5 | $0.015                  | $3~9        |
| GPT-4o-mini      | $0.002                  | $0.5~1.3    |

---

## 10. 구현 단계

### Phase 1: MVP (3~4일)

| 작업                         | 설명                                                      | 일정  |
| ---------------------------- | --------------------------------------------------------- | ----- |
| LLM Provider 추상화          | types.ts + GeminiProvider                                 | 0.5일 |
| generateBoardMarkdown        | 보드→MD 변환 순수 함수 + 테스트                           | 0.5일 |
| buildAiContext               | 프로젝트 메타 + overview + resources + 컨텍스트 섹션 조립 | 0.5일 |
| /api/ai/generate-instruction | 스트리밍 API Route + 쿨다운 체크                          | 0.5일 |
| AiSettings + AiUsage 모델    | 설정 싱글턴 + 사용량 기록                                 | 0.5일 |
| InstructionModal UI          | 범위 선택 + 미리보기 + 복사/다운로드                      | 1일   |

### Phase 2: 프리셋 + 히스토리 (2~3일)

| 작업                              | 설명                      | 일정  |
| --------------------------------- | ------------------------- | ----- |
| AiPreset 모델 + CRUD API          | 프리셋 저장/조회          | 0.5일 |
| PresetSelector UI + 기본 5개 시드 | 드롭다운                  | 0.5일 |
| AiInstructionHistory 모델 + API   | 생성 시 자동 저장         | 0.5일 |
| HistoryModal UI                   | 히스토리 목록 + 복사/보기 | 1일   |

### Phase 3: 관리자 + 템플릿 시스템 (2~3일)

| 작업                       | 설명                                                     | 일정  |
| -------------------------- | -------------------------------------------------------- | ----- |
| AiSettings 모델 확장       | 프롬프트 템플릿 + 컨텍스트 토글 + 기본 프리셋 필드       | 0.5일 |
| renderTemplate 유틸        | 변수 치환 함수 + {{#if}} 조건부 블록 + 테스트            | 0.5일 |
| /admin/ai-settings 페이지  | 탭 구조 UI (기본설정/프롬프트 템플릿/기본 프리셋/사용량) | 1일   |
| /api/admin/ai-settings API | 설정 CRUD + 사용량 조회                                  | 0.5일 |

**총 예상 기간: 7~10일**

---

## 11. 구현 파일 목록

```
신규 생성:
  # LLM 추상화 레이어
  src/lib/ai/types.ts                                    ← Provider 인터페이스
  src/lib/ai/index.ts                                    ← Provider 팩토리
  src/lib/ai/providers/gemini.ts                         ← Gemini Provider (Phase 1)

  # 모델
  src/lib/models/AiSettings.ts                           ← 전역 설정 (싱글턴)
  src/lib/models/AiUsage.ts                              ← 사용량 추적
  src/lib/models/AiPreset.ts                             ← 프롬프트 프리셋
  src/lib/models/AiInstructionHistory.ts                 ← 히스토리

  # 유틸
  src/lib/utils/ai/renderTemplate.ts                     ← 템플릿 변수 치환 함수
  src/lib/utils/ai/renderTemplate.test.ts                ← 테스트
  src/lib/utils/board/generateBoardMarkdown.ts           ← 보드→MD 변환
  src/lib/utils/board/buildAiContext.ts                  ← 컨텍스트 조립 (템플릿 기반)
  src/lib/utils/board/generateBoardMarkdown.test.ts
  src/lib/utils/board/buildAiContext.test.ts

  # API Routes
  src/app/api/ai/generate-instruction/route.ts           ← 지시서 생성 (스트리밍)
  src/app/api/ai/generate-instruction/route.test.ts
  src/app/api/ai/presets/route.ts                        ← 프리셋 CRUD
  src/app/api/ai/presets/[id]/route.ts
  src/app/api/ai/history/route.ts                        ← 히스토리 목록
  src/app/api/ai/history/[id]/route.ts                   ← 히스토리 상세
  src/app/api/admin/ai-settings/route.ts                 ← 관리자 설정
  src/app/api/admin/ai-settings/usage/route.ts           ← 사용량 통계

  # UI 컴포넌트
  src/components/board/InstructionModal.tsx               ← 생성 모달 (메인)
  src/components/board/ScopeSelector.tsx                  ← 범위 선택
  src/components/board/PresetSelector.tsx                 ← 프리셋 드롭다운
  src/components/board/InstructionPreview.tsx             ← 결과 미리보기
  src/components/board/HistoryModal.tsx                   ← 히스토리 모달
  src/components/admin/AiSettingsPanel.tsx                ← 관리자 AI 설정 (탭 구조)
  src/components/admin/AiPromptEditor.tsx                ← 프롬프트 템플릿 편집 UI
  src/components/admin/AiPresetManager.tsx               ← 기본 프리셋 관리 UI
  src/app/admin/ai-settings/page.tsx                     ← 관리자 페이지

  # 스토어
  src/store/instructionStore.ts                          ← 모달/생성 상태

수정:
  src/components/board/BoardShell.tsx                     ← 헤더에 버튼 2개 추가
  .env.local                                             ← GEMINI_API_KEY 추가
```

---

## 12. 완료 보고 → 노트 자동 완료처리

### 12-1. 문제

현재 보드에서 작업이 끝나면 사용자가 **일일이**:

- 노트를 "완료" 섹션으로 드래그하거나
- 노트 텍스트에 ~~취소선~~ 달거나
- 그냥 삭제하거나

이걸 수동으로 하면 귀찮아서 안 하게 되고, 보드가 점점 지저분해짐.

### 12-2. 핵심 아이디어: 완료 보고 붙여넣기 → AI가 노트 매칭 → 일괄 완료

```
[전체 흐름]

① 지시서 생성 → 복사 → Claude Code에 붙여넣기
② Claude Code가 작업 수행
③ 사용자: "완료된 작업 요약해줘" (Claude Code에게)
④ Claude Code가 완료 보고 텍스트 생성:

   "다음 작업을 완료했습니다:
    1. API 응답 형식 통일 — /api/projects, /api/wbs 수정 완료
    2. 에러 핸들링 미들웨어 추가 — errorHandler.ts 생성
    3. Socket 이벤트 정리 — 미사용 이벤트 5개 제거
    * 로그인 버그는 재현이 안 되어 추가 조사 필요"

⑤ 히스토리 상세에서 [📋 완료 보고] 버튼 클릭
⑥ 완료 보고 텍스트 붙여넣기
⑦ AI가 보고 내용 ↔ 원본 노트를 매칭 분석:

   ┌──────────────────────────────────────────────┐
   │ 📋 완료 보고 분석 결과                        │
   ├──────────────────────────────────────────────┤
   │                                              │
   │ ✅ 완료 매칭 (3건)                            │
   │ ┌──────────────────────────────────────────┐ │
   │ │ ☑ "API 응답 형식 통일" 노트               │ │
   │ │   ← "API 응답 형식 통일 — 수정 완료"      │ │
   │ │   매칭 신뢰도: 95%                        │ │
   │ │                                          │ │
   │ │ ☑ "에러 핸들링 추가" 노트                  │ │
   │ │   ← "에러 핸들링 미들웨어 추가"            │ │
   │ │   매칭 신뢰도: 90%                        │ │
   │ │                                          │ │
   │ │ ☑ "소켓 이벤트 정리" 노트                  │ │
   │ │   ← "Socket 이벤트 정리 — 5개 제거"       │ │
   │ │   매칭 신뢰도: 92%                        │ │
   │ └──────────────────────────────────────────┘ │
   │                                              │
   │ ⚠️ 미완료 / 매칭 실패 (1건)                   │
   │ ┌──────────────────────────────────────────┐ │
   │ │ ☐ "로그인 버그 수정" 노트                  │ │
   │ │   ← "재현 안 됨, 추가 조사 필요"           │ │
   │ │   → 노트에 메모 추가: "재현 불가, 추가조사" │ │
   │ └──────────────────────────────────────────┘ │
   │                                              │
   │ ┌──────────────────────────────┐             │
   │ │   ✅ 선택한 노트 완료처리     │             │
   │ └──────────────────────────────┘             │
   └──────────────────────────────────────────────┘

⑧ 사용자가 매칭 결과 확인 → 체크 조정 → [완료처리] 클릭
⑨ 선택된 노트들 일괄 완료
```

### 12-3. 노트 완료 상태 추가 (전제 조건)

현재 NoteModel에 상태 필드가 없으므로 추가 필요:

```ts
// NoteModel에 추가
status: {
  type: String,
  enum: ['active', 'done'],
  default: 'active',
},
completedAt: {
  type: Date,
  default: null,
},
completionNote: {       // 완료 시 AI가 붙인 요약
  type: String,
  default: null,
},
```

완료된 노트의 시각적 표현:

- 반투명 처리 (opacity: 0.5)
- 텍스트에 취소선
- 좌측 상단에 ✅ 뱃지
- "완료 노트 숨기기" 토글 (보드 헤더)

### 12-4. 완료 보고 API

```ts
// POST /api/ai/completion-report
{
  historyId: string;         // 어떤 지시서에 대한 완료 보고인지
  completionText: string;    // 에이전트가 생성한 완료 보고 텍스트
}

// Response (AI 분석 결과)
{
  matches: [
    {
      noteId: string;
      noteText: string;        // 원본 노트 텍스트 (미리보기용)
      reportExcerpt: string;   // 보고서에서 매칭된 부분
      confidence: number;      // 매칭 신뢰도 (0~1)
      status: 'done' | 'partial' | 'blocked';
      summary: string;         // AI가 생성한 완료 요약 1줄
    }
  ],
  unmatched: [
    {
      reportExcerpt: string;   // 보고서에 있지만 노트와 매칭 안 된 항목
      suggestion: string;      // "새 노트로 추가할까요?" 등
    }
  ]
}
```

```ts
// POST /api/ai/complete-notes (사용자 확인 후 실제 완료처리)
{
  noteIds: string[];                 // 완료 처리할 노트 ID들
  completionNotes: Record<string, string>; // noteId → AI 요약
}
```

### 12-5. 추가 아이디어

**A. 부분 완료 처리**

완료 보고에 "80% 했는데 테스트가 남았음" 같은 내용이 있으면:

- 원본 노트는 유지
- 노트에 AI가 진행 메모를 추가: `[80%] 구현 완료, 테스트 미작성`
- 노트 색상을 진행중 색으로 변경 (예: 노랑 → 파랑)

**B. 후속 작업 노트 자동 생성**

완료 보고에 "추가 조사 필요", "리팩토링 여지 있음" 같은 내용이 있으면:

- AI가 후속 작업 노트 생성을 제안
- "로그인 버그 — 재현 환경 특정 후 재시도" 같은 새 노트

```
⚠️ 후속 작업 제안 (1건)
┌──────────────────────────────────────────┐
│ 📝 "로그인 버그 재현 환경 조사"           │
│    원인: 완료 보고에서 "재현 안 됨" 언급   │
│    태그: #bug #investigation             │
│ ┌──────────┐ ┌──────────┐               │
│ │ 노트 추가 │ │ 무시     │               │
│ └──────────┘ └──────────┘               │
└──────────────────────────────────────────┘
```

**C. 완료 보고 없이 간편 완료**

완료 보고 텍스트 없이도 히스토리에서 바로 노트를 완료 처리할 수 있는 경로:

- 히스토리 상세 → 해당 지시서에 포함됐던 노트 목록 표시 → 체크박스로 직접 완료

이건 에이전트 없이 수동으로 작업한 경우에도 쓸 수 있음.

**D. 지시서 상태 자동 업데이트**

히스토리의 지시서에 상태가 붙음:

- 📝 생성됨 → ⏳ 진행중 (일부 노트 완료 시) → ✅ 완료 (모든 노트 완료 시)
- 히스토리 목록에서 한눈에 "이 지시서는 아직 처리 안 됐네" 파악 가능

**E. 타임라인 뷰**

노트의 생명 주기를 추적:

```
메모 작성 (3/25) → 지시서에 포함 (3/28) → 완료 보고 (3/29) → 완료 처리 (3/29)
```

프로젝트 설정에서 "평균 작업 처리 시간" 통계 확인 가능.

### 12-6. 구현 우선순위

| 순서 | 항목                                         | 의존성            |
| ---- | -------------------------------------------- | ----------------- |
| 1    | NoteModel에 status/completedAt 필드 추가     | 없음 (독립 작업)  |
| 2    | 노트 완료 시각적 표현 (반투명, 취소선, 뱃지) | 1번               |
| 3    | 히스토리 상세에서 간편 완료 (체크박스)       | 히스토리 기능     |
| 4    | 완료 보고 붙여넣기 → AI 매칭 분석            | 히스토리 + AI API |
| 5    | 매칭 확인 UI + 일괄 완료처리                 | 4번               |
| 6    | 부분 완료 / 후속 작업 제안                   | 5번               |
| 7    | 지시서 상태 자동 업데이트                    | 5번               |

1~3번은 AI 없이도 되는 기본 기능이라 먼저 만들 수 있고,
4~7번은 AI 지시서 기능 위에 올라가는 확장이야.

---

## 13. 추후 확장 방향

| 아이디어                  | 설명                                                     | 시기                  |
| ------------------------- | -------------------------------------------------------- | --------------------- |
| 유료 LLM 전환             | Anthropic/OpenAI Provider 추가, 관리자가 어드민에서 전환 | 무료 한도 부족 시     |
| CLAUDE.md 원클릭 업데이트 | 생성된 MD를 GitHub API로 PR 생성 or 직접 반영            | GitHub 연동 강화 시   |
| 프리셋 공개 마켓          | 잘 만든 프리셋을 다른 프로젝트에 공유                    | 사용자 풀 확대 시     |
| 채팅방 컨텍스트 통합      | 팀 채팅 내용을 지시서 컨텍스트에 선택적 포함             | 채팅 기능 완성 후     |
| 보이스 입력               | Web Speech API로 음성→텍스트 변환 후 추가 지시로 활용    | 모바일 지원 시        |
| 자체 API 키 입력          | 프로젝트별 API 키를 암호화 저장, 한도 해제               | 헤비 유저 요청 시     |
| 섹션+노트 자동 생성       | AI 응답을 structured output으로 받아 보드에 직접 반영    | 지시서 기능 안정화 후 |

---

## 14. 리스크 및 대응

| 리스크                         | 영향               | 대응                                             |
| ------------------------------ | ------------------ | ------------------------------------------------ |
| Gemini 무료 티어 한도 초과     | 생성 불가          | 쿨다운+일일 한도로 사전 방지 + 관리자 알림       |
| Gemini 무료 정책 변경          | 비용 발생          | Provider 추상화로 즉시 다른 모델 전환 가능       |
| AI가 프로젝트 구조를 잘못 추론 | 틀린 파일 경로     | "AI가 추론한 경로입니다, 확인 후 사용" 고지      |
| 노트가 너무 모호               | 지시서 품질 저하   | 모호한 노트 표시 + 구체화 제안                   |
| Render Free Plan 타임아웃      | 응답 끊김          | 30초 타임아웃 핸들링 + 노트 수 제한 경고         |
| 히스토리 DB 용량 증가          | MongoDB Atlas 한도 | 90일 지난 히스토리 자동 삭제 정책                |
| 프롬프트 템플릿 오류           | 변수 치환 실패     | fallback 기본 템플릿 사용 + 관리자에게 에러 표시 |

---

## 변경 이력

| 버전 | 날짜       | 변경 내용                                                                                                                                                                                                          |
| ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1   | 2026-03-28 | 초안 (단순 MD 내보내기)                                                                                                                                                                                            |
| v2   | 2026-03-28 | AI 채팅 패널 통합                                                                                                                                                                                                  |
| v3   | 2026-03-28 | WBS 제거, 팀원 역량 분석 제거                                                                                                                                                                                      |
| v4   | 2026-03-28 | 코드 생성 제거, AI 역할을 "프롬프트 가공기"로 재정의                                                                                                                                                               |
| v5   | 2026-03-28 | Gemini 무료 티어 채택, Provider 추상화, 프로젝트 컨텍스트 자동 수집, 관리자 페이지, 모달 전용 범위 선택, 히스토리 기능                                                                                             |
| v5.1 | 2026-03-28 | 컨텍스트 섹션 키워드 자동 매칭 제거 → 모달에서 "참조 컨텍스트" 직접 지정 방식으로 변경                                                                                                                             |
| v5.2 | 2026-03-28 | 완료 보고 → 노트 자동 완료처리 기능 추가 (섹션 12)                                                                                                                                                                 |
| v6   | 2026-03-28 | 시스템 프롬프트 템플릿 변수 치환 방식 도입, AiSettings 모델에 프롬프트 템플릿/컨텍스트 토글/기본 프리셋 필드 통합, 관리자 UI 탭 구조(기본설정/프롬프트 템플릿/기본 프리셋/사용량)로 확장, renderTemplate 유틸 추가 |
