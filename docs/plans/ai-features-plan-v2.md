# AI 기능 확장 상세 기획서

> 작성일: 2026-04-04
> 대상 프로젝트: Side Project Mate (SPM)
> 관련 회의 키워드: 회의록 AI 정리, Harness 100 SKILL, 실행결과 자동 완료처리

---

## 목차

1. [기능 1: 회의록 AI 자동 정리](#기능-1-회의록-ai-자동-정리)
2. [기능 2: Harness 100 SKILL 적용](#기능-2-harness-100-skill-적용)
3. [기능 3: AI 지시서 실행결과 자동 완료처리](#기능-3-ai-지시서-실행결과-자동-완료처리)
4. [구현 우선순위 및 일정](#구선순위-및-일정)
5. [공통 기술 고려사항](#공통-기술-고려사항)

---

## 기능 1: 회의록 AI 자동 정리

### 1.1 개요

칸반보드의 노트(메모)들을 AI가 분석하여, 회의록 형태의 구조화된 노트+섹션으로 자동 재배치하는 기능. 사용자가 회의 중 자유롭게 작성한 메모들을 AI가 주제별로 분류하고, 의사결정·액션아이템·논의사항 등의 섹션으로 정리해준다.

### 1.2 핵심 문제: UI 안정성

**문제**: AI가 마크다운 텍스트를 그대로 반환하면 칸반보드 UI에 렌더링 이슈 발생 가능 (긴 텍스트 overflow, 마크다운 파싱 불일치 등).

**해결 방향**: 마크다운 → JSON 구조화 변환 (봉식 의견 반영)

AI 응답을 마크다운이 아닌 **JSON 구조체**로 받아서, SPM이 이를 파싱하여 실제 Section + Note 객체로 변환한다. 이렇게 하면 UI는 기존 칸반 렌더링 로직을 그대로 사용할 수 있어 깨짐 위험이 없다.

### 1.3 데이터 흐름

```
[사용자가 노트들 선택]
    ↓
[AI 컨텍스트 빌드] ← buildAiContext.ts 확장
    ↓
[LLM 호출 - JSON 모드]
    ↓
[JSON 응답 수신]
    {
      "title": "2026-04-04 스프린트 회의",
      "sections": [
        {
          "title": "의사결정 사항",
          "color": "#4CAF50",
          "notes": [
            { "text": "Redis 캐싱 도입 결정", "tags": ["인프라"], "assignee": null },
            { "text": "배포 주기 2주 → 1주로 변경", "tags": ["프로세스"], "assignee": null }
          ]
        },
        {
          "title": "액션 아이템",
          "color": "#FF9800",
          "notes": [
            { "text": "Redis 설정 파일 작성", "tags": ["인프라"], "assignee": "userId123", "dueDate": "2026-04-11" },
            { "text": "CI/CD 파이프라인 수정", "tags": ["DevOps"], "assignee": "userId456", "dueDate": "2026-04-08" }
          ]
        },
        {
          "title": "추가 논의 필요",
          "color": "#9C27B0",
          "notes": [
            { "text": "모니터링 도구 선정 (Datadog vs Grafana)", "tags": ["인프라"] }
          ]
        }
      ]
    }
    ↓
[SPM 파싱 + 칸반 객체 생성]
    ↓
[Section.insertMany() + Note.insertMany()]
    ↓
[Socket.io 브로드캐스트 → UI 실시간 반영]
```

### 1.4 AI 응답 JSON 스키마

```typescript
// src/types/ai-meeting.ts (신규)

interface AiMeetingSection {
  title: string;                    // 섹션 제목
  color: string;                    // 섹션 컬러 (hex)
  notes: AiMeetingNote[];
}

interface AiMeetingNote {
  text: string;                     // 노트 본문 (plain text, 마크다운 X)
  tags: string[];                   // 태그 배열
  assignee?: string;                // userId 또는 null
  dueDate?: string;                 // ISO date string 또는 null
  priority?: 'high' | 'medium' | 'low';
}

interface AiMeetingResponse {
  title: string;                    // 회의록 전체 제목
  date: string;                     // 회의 날짜
  sections: AiMeetingSection[];
  summary?: string;                 // 한줄 요약 (선택)
}
```

### 1.5 구현 상세

#### 1.5.1 신규 API 엔드포인트

**`POST /api/ai/organize-meeting`**

```typescript
// src/app/api/ai/organize-meeting/route.ts

// 요청 Body:
{
  boardId: string;
  targetNoteIds: string[];        // 정리할 노트 ID 목록
  templateType: 'sprint' | 'brainstorm' | 'retrospective' | 'general';
  additionalInstruction?: string; // 추가 지시사항
}

// 응답: SSE 스트림 (기존 generate-instruction과 동일 패턴)
// 단, 최종 결과는 JSON 파싱하여 유효성 검증 후 반환
```

**처리 플로우:**

1. 대상 노트들 조회 (Note.find + populate)
2. 시스템 프롬프트 구성 (회의록 정리 전용 프롬프트)
3. LLM 호출 (JSON 모드 강제)
4. 응답 JSON 파싱 + 스키마 검증
5. 검증 실패 시 → 재시도 1회 (프롬프트에 에러 피드백 포함)
6. Section + Note 배치 생성
7. 원본 노트 상태 업데이트 (정리 완료 마킹)
8. 히스토리 저장 (AiInstructionHistory 확장 또는 별도 모델)

#### 1.5.2 시스템 프롬프트 설계

```
너는 프로젝트 회의록 정리 전문가다.
주어진 메모들을 분석하여 아래 JSON 형식으로 구조화해라.

규칙:
1. 각 메모의 핵심 내용을 파악하여 적절한 섹션에 배치
2. 비슷한 주제의 메모는 하나로 병합 가능 (원문 의미 보존)
3. 액션아이템이 있으면 반드시 "액션 아이템" 섹션 생성
4. 의사결정 내용이 있으면 "의사결정 사항" 섹션 생성
5. 노트 텍스트는 plain text만 사용 (마크다운 금지)
6. 태그는 기존 태그를 최대한 보존하되, 없으면 주제 기반으로 생성
7. 담당자 정보가 있으면 assignee 필드에 매핑

회의 템플릿: {{templateType}}

응답 형식: (반드시 아래 JSON만 출력)
{
  "title": "회의 제목",
  "date": "YYYY-MM-DD",
  "sections": [...]
}
```

#### 1.5.3 칸반 배치 알고리즘

AI가 반환한 섹션+노트를 칸반보드에 배치할 때, 기존 노트와 겹치지 않도록 자동 배치가 필요하다.

```typescript
// src/lib/utils/board/autoLayout.ts (신규)

interface LayoutConfig {
  startX: number;          // 배치 시작 X좌표
  startY: number;          // 배치 시작 Y좌표
  sectionGap: number;      // 섹션 간 간격 (기본 40px)
  noteGap: number;         // 노트 간 간격 (기본 16px)
  sectionWidth: number;    // 섹션 너비 (기본 320px)
  noteWidth: number;       // 노트 너비 (기본 280px)
  noteHeight: number;      // 노트 높이 (기본 120px)
  direction: 'horizontal' | 'vertical';  // 섹션 배치 방향
}

function calculateMeetingLayout(
  sections: AiMeetingSection[],
  existingElements: { x: number; y: number; width: number; height: number }[],
  config: LayoutConfig
): { sections: SectionPosition[]; notes: NotePosition[] }
```

**배치 전략:**
- 기존 요소들의 bounding box를 계산
- bounding box 오른쪽 또는 아래에 새 섹션들을 배치
- 각 섹션 내부의 노트는 세로로 나열
- 섹션 간에는 가로로 배치 (기본값)

#### 1.5.4 프론트엔드 UI

**트리거 방법 (2가지):**

1. **칸반 보드 툴바 버튼**: "AI 회의록 정리" 버튼 추가
2. **노트 다중선택 후 우클릭 컨텍스트 메뉴**: "AI로 정리하기"

**모달 구성 (`MeetingOrganizeModal.tsx` 신규):**

```
┌─────────────────────────────────────────┐
│  🤖 AI 회의록 정리                        │
├─────────────────────────────────────────┤
│                                         │
│  📋 정리할 노트 (12개 선택됨)             │
│  ┌─────────────────────────────────┐    │
│  │ ☑ Redis 도입 검토              │    │
│  │ ☑ 배포 주기 논의               │    │
│  │ ☑ CI/CD 개선 필요              │    │
│  │ ...                            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📌 회의 템플릿                          │
│  ┌─────────────────────────────────┐    │
│  │ ▾ 스프린트 회의                 │    │
│  └─────────────────────────────────┘    │
│  (스프린트 / 브레인스토밍 / 회고 / 일반)  │
│                                         │
│  💬 추가 지시사항 (선택)                  │
│  ┌─────────────────────────────────┐    │
│  │ 예: "담당자별로 분류해줘"        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ⚙️ 옵션                                │
│  ☑ 원본 노트 유지 (정리 후에도 삭제하지 않음) │
│  ☐ 기존 섹션에 추가 (새 섹션 대신)       │
│                                         │
│         [취소]  [🤖 정리 시작]            │
└─────────────────────────────────────────┘
```

**결과 미리보기:**
- 정리 완료 후, 실제 보드에 반영하기 전에 미리보기 제공
- "적용" 버튼을 누르면 실제 Section + Note 생성

#### 1.5.5 관련 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/api/ai/organize-meeting/route.ts` | 신규 | API 엔드포인트 |
| `src/types/ai-meeting.ts` | 신규 | JSON 스키마 타입 정의 |
| `src/lib/utils/board/autoLayout.ts` | 신규 | 자동 배치 알고리즘 |
| `src/store/meetingStore.ts` | 신규 | 회의록 정리 상태 관리 |
| `src/components/board/MeetingOrganizeModal.tsx` | 신규 | 모달 UI |
| `src/lib/utils/board/buildAiContext.ts` | 수정 | 회의록 전용 컨텍스트 빌더 추가 |
| `src/lib/models/AiSettings.ts` | 수정 | 회의록 템플릿 프롬프트 설정 추가 |
| `src/components/board/BoardToolbar.tsx` | 수정 | "AI 회의록 정리" 버튼 추가 |

---

## 기능 2: Harness 100 연동 — 지시서 + 하네스 통합 다운로드

### 2.1 개요

[revfactory/harness-100](https://github.com/revfactory/harness-100)은 10개 도메인에 걸친 100개의 프로덕션 레디 에이전트 팀 하네스 컬렉션이다. 각 하네스는 4~5명의 전문 에이전트, 오케스트레이터 스킬, 2~3개의 에이전트 확장 스킬로 구성되어 있으며, `.claude/` 디렉토리 구조를 따른다.

**핵심 목표**: SPM에서 AI 지시서를 생성하고 다운로드할 때, 해당 작업에 적합한 harness-100 하네스를 **AI가 자동 추천**하여 함께 제공한다. 사용자는 다운로드 받은 패키지를 프로젝트에 풀기만 하면 Claude Code 등의 Agent가 지시서와 하네스를 함께 인식하여 더 높은 품질로 작업을 수행한다.

**다운로드 방식**: 기본은 **통합 마크다운 복사** (간단한 작업용), 옵션으로 **ZIP 다운로드** (`.claude/` 디렉토리 구조 포함)도 제공한다.

### 2.2 Harness 100 패키지 구조 이해

```
{NN}-{harness-name}/
└── .claude/
    ├── CLAUDE.md                    # 프로젝트 오버뷰 + 하네스 설명
    ├── agents/                      # 에이전트 정의 파일들
    │   ├── architect.md             # 설계 전문 에이전트
    │   ├── implementer.md           # 구현 전문 에이전트
    │   ├── tester.md                # 테스트 전문 에이전트
    │   ├── reviewer.md              # 코드 리뷰 에이전트
    │   └── cross-validator.md       # 교차 검증 에이전트
    └── skills/
        ├── {orchestrator}/
        │   └── SKILL.md             # 팀 오케스트레이션 스킬
        ├── {domain-skill-1}/
        │   └── SKILL.md             # 도메인 특화 스킬
        └── {domain-skill-2}/
            └── SKILL.md             # 도메인 특화 스킬
```

각 SKILL.md는 YAML frontmatter + 마크다운 지침으로 구성:

```yaml
---
name: skill-name
description: 이 스킬이 무엇을 하고 언제 사용해야 하는지 설명
allowed-tools: Bash Read Grep
---

# 스킬 이름

[Claude가 이 스킬이 활성화될 때 따를 지침]

## Examples
## Guidelines
```

### 2.3 하네스 카탈로그 DB 모델

harness-100의 100개 하네스 메타데이터를 SPM DB에 저장하여 AI 추천에 활용한다.

```typescript
// src/lib/models/HarnessCatalog.ts (신규)

const HarnessCatalogSchema = new Schema({
  harnessId: { type: String, required: true, unique: true },  // e.g., "01-nextjs-fullstack"
  name: { type: String, required: true },                      // e.g., "Next.js Fullstack"
  domain: { type: String, required: true },                    // 10개 도메인 중 하나
  description: String,
  tags: [String],                    // 매칭용 키워드 ["nextjs", "react", "fullstack", "typescript"]
  techStacks: [String],              // 관련 기술 스택 ["Next.js", "React", "TypeScript"]
  agents: [{                         // 포함된 에이전트 목록
    name: String,
    role: String,                    // "architect", "implementer", "tester" 등
    description: String,
  }],
  skills: [{                         // 포함된 스킬 목록
    name: String,
    type: { type: String, enum: ['orchestrator', 'domain'] },
    description: String,
  }],
  architecturePattern: {             // 아키텍처 패턴
    type: String,
    enum: ['pipeline', 'fan-out-fan-in', 'expert-pool',
           'producer-reviewer', 'supervisor', 'hierarchical']
  },
  language: { type: String, enum: ['ko', 'en'], default: 'ko' },
  // 실제 파일 내용은 GitHub에서 가져오거나 로컬 캐시
  filesCache: Schema.Types.Mixed,    // { "agents/architect.md": "...", ... }
  lastSyncAt: Date,
});
```

### 2.4 AI 자동 추천 시스템

#### 2.4.1 추천 로직

지시서 생성 시, 프로젝트 기술 스택 + 노트 내용 + 프리셋 유형을 분석하여 harness-100 중 가장 적합한 하네스를 추천한다.

```typescript
// src/lib/utils/ai/recommendHarness.ts (신규)

interface HarnessRecommendation {
  harnessId: string;
  name: string;
  matchScore: number;        // 0~100 매칭 점수
  matchReasons: string[];    // 추천 이유
}

async function recommendHarness(context: {
  projectTechStacks: string[];
  presetType: string;           // "기능 구현", "버그 수정" 등
  targetNoteTexts: string[];
  projectDescription?: string;
}): Promise<HarnessRecommendation[]> {

  // 1단계: 태그 기반 빠른 필터링
  const candidates = await HarnessCatalog.find({
    $or: [
      { techStacks: { $in: context.projectTechStacks } },
      { tags: { $in: extractKeywords(context.targetNoteTexts) } },
    ]
  }).lean();

  // 2단계: AI 정밀 매칭 (상위 후보 5개에 대해)
  // 프로젝트 상황과 노트 내용을 고려한 LLM 기반 추천
  const topCandidates = candidates.slice(0, 5);

  const aiRecommendation = await callLlm({
    prompt: `
      프로젝트: ${context.projectTechStacks.join(', ')}
      작업 유형: ${context.presetType}
      대상 노트: ${context.targetNoteTexts.join('\n')}

      아래 하네스 후보 중 가장 적합한 것을 1~3개 추천하고, 각각 점수(0~100)와 추천 이유를 제공해라:
      ${topCandidates.map(c => `- ${c.harnessId}: ${c.description}`).join('\n')}
    `,
    jsonMode: true,
  });

  return aiRecommendation;
}
```

#### 2.4.2 추천 타이밍

InstructionModal에서 프리셋과 대상 노트를 선택하면, 백그라운드에서 하네스 추천이 실행된다. 결과는 모달 하단의 "하네스 추천" 영역에 표시.

### 2.5 다운로드 방식 설계

#### 2.5.1 방식 A: 통합 마크다운 복사 (기본)

지시서 마크다운 안에 하네스의 핵심 스킬 내용을 인라인으로 포함한다. Agent에게 복사/붙여넣기만으로 전달 가능.

```markdown
# 지시서: Redis 캐시 레이어 구현

## 에이전트 팀 구성 (Harness: 01-nextjs-fullstack)

이 작업은 아래 전문 에이전트 팀이 협력하여 수행합니다:
- **Architect**: 캐시 전략 설계 및 아키텍처 결정
- **Implementer**: 실제 코드 구현
- **Tester**: 테스트 코드 작성 및 검증

### 오케스트레이터 스킬
> 아래는 팀 오케스트레이션 지침입니다.
> [SKILL.md 핵심 내용 인라인]

---

## 구현 지시사항

[AI가 생성한 기존 지시서 내용]

---

## 실행결과 보고 (SPM 자동 완료처리용)
[기능 3의 결과 템플릿]
```

**장점**: 복사 한 번으로 Agent에 전달 가능, 별도 파일 관리 불필요
**한계**: .claude/ 디렉토리 구조가 아니므로 Claude Code의 자동 스킬 인식은 불가

#### 2.5.2 방식 B: ZIP 다운로드 (옵션)

지시서 + 완전한 `.claude/` 디렉토리 구조를 ZIP으로 묶어 다운로드.

```
spm-instruction-{timestamp}.zip
├── instruction.md               # AI 생성 지시서
├── .claude/
│   ├── CLAUDE.md                # 프로젝트 컨텍스트 (SPM에서 자동 생성)
│   ├── agents/                  # harness-100에서 가져온 에이전트 정의
│   │   ├── architect.md
│   │   ├── implementer.md
│   │   └── tester.md
│   └── skills/
│       ├── orchestrator/
│       │   └── SKILL.md         # 오케스트레이터 스킬
│       └── project-context/
│           └── SKILL.md         # SPM이 생성한 프로젝트 컨텍스트 스킬
└── README.md                    # 사용법 안내
```

**SPM이 자동 생성하는 CLAUDE.md:**

```markdown
# {{projectTitle}}

## 기술 스택
{{techStacks}}

## 현재 작업
{{targetNotes를 기반으로 생성된 작업 요약}}

## 팀 구성
{{projectMembers}}

## 참조 사항
{{referenceNotes 내용}}
```

**SPM이 자동 생성하는 project-context SKILL.md:**

```yaml
---
name: spm-project-context
description: Side Project Mate에서 내보낸 프로젝트 컨텍스트. 칸반보드 노트, 팀 정보, 기술 스택 참조용.
user-invocable: false
---

# 프로젝트 컨텍스트

## 칸반보드 노트 (대상)
{{targetNotes 마크다운}}

## 참조 노트
{{referenceNotes 마크다운}}

## 프로젝트 정보
- 제목: {{projectTitle}}
- 기술 스택: {{techStacks}}
- 마감일: {{deadline}}
```

**장점**: Claude Code가 `.claude/` 구조를 자동 인식, 에이전트 팀이 즉시 활성화
**적합**: 큰 프로젝트, 복잡한 기능 구현, 장기 작업

### 2.6 API 엔드포인트

#### 2.6.1 하네스 추천 API

**`POST /api/ai/recommend-harness`**

```typescript
// src/app/api/ai/recommend-harness/route.ts (신규)

// 요청:
{
  projectId: string;
  presetName: string;
  targetNoteIds: string[];
}

// 응답:
{
  success: true,
  data: {
    recommendations: [
      {
        harnessId: "01-nextjs-fullstack",
        name: "Next.js Fullstack",
        matchScore: 92,
        matchReasons: ["기술 스택 일치: Next.js, TypeScript", "작업 유형 적합: 기능 구현"],
        agents: ["architect", "implementer", "tester", "reviewer"],
        skills: ["team-orchestrator", "code-review-checklist"]
      }
    ]
  }
}
```

#### 2.6.2 지시서 다운로드 API 확장

**`GET /api/ai/history/{id}/download`** (기존 수정)

```typescript
// 쿼리 파라미터:
// ?format=markdown  → 통합 마크다운 (기본, 하네스 내용 인라인 포함)
// ?format=zip       → ZIP 다운로드 (.claude/ 구조 포함)
// ?harnessId=01-nextjs-fullstack  → 적용할 하네스 (AI 추천 또는 사용자 선택)

// ZIP 생성 로직:
async function generateZipPackage(
  instruction: IAiInstructionHistory,
  harness: IHarnessCatalog,
  project: IProject,
  targetNotes: INote[],
  referenceNotes: INote[]
): Promise<Buffer> {
  const zip = new JSZip();

  // 1. 지시서 파일
  zip.file('instruction.md', instruction.resultMarkdown);

  // 2. .claude/CLAUDE.md (SPM이 프로젝트 컨텍스트로 생성)
  zip.file('.claude/CLAUDE.md', buildClaudeMd(project, targetNotes));

  // 3. .claude/agents/ (하네스에서 가져옴)
  for (const agent of harness.filesCache.agents) {
    zip.file(`.claude/agents/${agent.filename}`, agent.content);
  }

  // 4. .claude/skills/ (하네스 스킬 + SPM 컨텍스트 스킬)
  for (const skill of harness.filesCache.skills) {
    zip.file(`.claude/skills/${skill.dirname}/SKILL.md`, skill.content);
  }
  zip.file('.claude/skills/spm-project-context/SKILL.md',
    buildProjectContextSkill(project, targetNotes, referenceNotes));

  // 5. README.md
  zip.file('README.md', buildReadme(harness, instruction));

  return zip.generateAsync({ type: 'nodebuffer' });
}
```

#### 2.6.3 하네스 카탈로그 동기화 API

**`POST /api/admin/harness/sync`** (관리자 전용)

GitHub에서 harness-100 레포를 가져와 HarnessCatalog를 업데이트한다.

```typescript
// 동기화 전략:
// 1. GitHub API로 harness-100 레포 디렉토리 목록 조회
// 2. 각 하네스의 CLAUDE.md + SKILL.md 파일 내용 가져오기
// 3. 메타데이터 추출 (name, description, tags, agents, skills)
// 4. HarnessCatalog upsert
// 5. lastSyncAt 갱신
```

### 2.7 프론트엔드 변경

#### 2.7.1 InstructionModal.tsx 수정

기존 결과 표시 영역에 하네스 추천 + 다운로드 옵션을 추가한다.

```
┌──────────────────────────────────────────────────┐
│  🤖 AI 지시서 생성                                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  [기존 스코프 선택, 참조 선택, 프리셋 등 UI 동일]   │
│                                                  │
│  ... (지시서 생성 완료 후) ...                     │
│                                                  │
│  ┌── 📋 결과 ─────────────────────────────────┐  │
│  │ [생성된 지시서 마크다운 미리보기]            │  │
│  └─────────────────────────────────────────────┘  │
│                                                  │
│  ┌── 🔧 Harness 추천 ─────────────────────────┐  │
│  │                                             │  │
│  │  AI 추천: 01-nextjs-fullstack (92점)        │  │
│  │  "Next.js + TypeScript 풀스택 개발에 최적화" │  │
│  │  에이전트 4명 | 스킬 2개 | Pipeline 패턴     │  │
│  │  [✓ 적용]  [다른 하네스 보기 ▾]             │  │
│  │                                             │  │
│  └─────────────────────────────────────────────┘  │
│                                                  │
│  다운로드 옵션:                                    │
│  [📋 마크다운 복사]  [📦 ZIP 다운로드]  [🔄 재생성] │
│                                                  │
│  ☑ 하네스 포함 (추천: 01-nextjs-fullstack)        │
│  ☑ 실행결과 보고 템플릿 포함                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

**다운로드 버튼 동작:**

- **📋 마크다운 복사**: 지시서 + 하네스 핵심 내용을 하나의 마크다운으로 합쳐서 클립보드에 복사 (통합 마크다운)
- **📦 ZIP 다운로드**: `.claude/` 디렉토리 구조 포함 ZIP 파일 다운로드. 프로젝트 루트에 풀면 Claude Code가 에이전트/스킬 자동 인식

#### 2.7.2 하네스 브라우저 (선택 기능)

AI 추천 대신 직접 하네스를 선택하고 싶을 때, "다른 하네스 보기" 드롭다운을 통해 카탈로그를 탐색할 수 있다.

```
┌── 하네스 카탈로그 ──────────────────────────────┐
│  🔍 검색: [          ] 도메인: [전체 ▾]         │
│                                                │
│  ★ 01-nextjs-fullstack (92점 추천)             │
│    Next.js 14 풀스택 | Pipeline | 에이전트 4    │
│                                                │
│  02-react-component-library                     │
│    React 컴포넌트 라이브러리 | Fan-out | 에이전트 5 │
│                                                │
│  15-api-backend-express                         │
│    Express.js REST API | Expert Pool | 에이전트 4 │
│                                                │
│  [선택]                                         │
└─────────────────────────────────────────────────┘
```

### 2.8 하네스 데이터 초기 동기화

#### 2.8.1 방법 1: GitHub API 직접 동기화

```typescript
// src/lib/utils/harness/syncFromGithub.ts (신규)

async function syncHarnessCatalog() {
  const REPO = 'revfactory/harness-100';

  // 1. 레포 루트의 디렉토리 목록 조회
  const dirs = await fetchGithubApi(`/repos/${REPO}/contents`);
  const harnessDirs = dirs.filter(d => d.type === 'dir' && /^\d{2}-/.test(d.name));

  for (const dir of harnessDirs) {
    // 2. .claude/ 디렉토리 내용 재귀 조회
    const files = await fetchGithubTree(`/repos/${REPO}/git/trees/${dir.sha}?recursive=1`);

    // 3. CLAUDE.md, agents/*.md, skills/*/SKILL.md 파일 내용 가져오기
    const claudeMd = await fetchFileContent(files, '.claude/CLAUDE.md');
    const agents = await fetchAgentFiles(files);
    const skills = await fetchSkillFiles(files);

    // 4. 메타데이터 추출 + DB 저장
    await HarnessCatalog.findOneAndUpdate(
      { harnessId: dir.name },
      { name, domain, description, tags, agents, skills, filesCache, lastSyncAt: new Date() },
      { upsert: true }
    );
  }
}
```

#### 2.8.2 방법 2: 정적 카탈로그 JSON 사용 (MVP)

MVP 단계에서는 harness-100의 메타데이터를 수동으로 JSON 파일로 정리하여 시드 데이터로 사용한다.

```typescript
// src/lib/data/harness-catalog-seed.json
[
  {
    "harnessId": "01-nextjs-fullstack",
    "name": "Next.js Fullstack",
    "domain": "web-development",
    "tags": ["nextjs", "react", "typescript", "fullstack"],
    "techStacks": ["Next.js", "React", "TypeScript", "Tailwind"],
    "agents": [
      { "name": "architect", "role": "architect", "description": "시스템 설계 전문" },
      { "name": "implementer", "role": "implementer", "description": "코드 구현 전문" }
    ],
    "skills": [
      { "name": "team-orchestrator", "type": "orchestrator", "description": "팀 작업 조율" }
    ],
    "architecturePattern": "pipeline"
  }
  // ... 100개
]
```

### 2.9 Harness 100 이식 계획

#### 2.9.1 라이센스: Apache License 2.0

harness-100 레포는 **Apache License 2.0**으로 배포된다. 이식 시 아래 조건을 준수해야 한다:

| 조건 | 대응 방법 |
|------|----------|
| LICENSE 파일 포함 | `src/lib/data/harness-100/LICENSE` 에 원본 그대로 복사 |
| NOTICE 파일 포함 (있는 경우) | `src/lib/data/harness-100/NOTICE` 에 원본 그대로 복사 |
| 수정 파일에 변경 명시 | SPM에 맞게 수정한 파일 상단에 `// Modified by SPM Team - [날짜]` 주석 추가 |
| 원저작자 상표 미사용 | SPM UI에서 "Powered by revfactory/harness-100 (Apache 2.0)" 출처 표기 |

#### 2.9.2 이식 디렉토리 구조

harness-100의 100개 하네스 파일을 SPM 프로젝트 내부에 정적 데이터로 포함한다.

```
src/lib/data/harness-100/
├── LICENSE                              # Apache 2.0 원본
├── NOTICE                               # (있는 경우) 원본
├── catalog.json                         # 100개 하네스 메타데이터 인덱스 (SPM이 생성)
├── ko/                                  # 한국어 버전
│   ├── 01-nextjs-fullstack/
│   │   └── .claude/
│   │       ├── CLAUDE.md
│   │       ├── agents/
│   │       │   ├── architect.md
│   │       │   ├── implementer.md
│   │       │   └── ...
│   │       └── skills/
│   │           ├── team-orchestrator/
│   │           │   └── SKILL.md
│   │           └── ...
│   ├── 02-react-component-library/
│   │   └── .claude/ ...
│   └── ... (100개)
└── en/                                  # 영어 버전
    ├── 01-nextjs-fullstack/
    │   └── .claude/ ...
    └── ... (100개)
```

#### 2.9.3 catalog.json 자동 생성

이식 후 각 하네스의 메타데이터를 파싱하여 `catalog.json`을 빌드하는 스크립트를 작성한다. 이 파일이 DB 시드 및 AI 추천의 기초 데이터가 된다.

```typescript
// scripts/build-harness-catalog.ts (신규)

// 각 하네스 디렉토리를 순회하며:
// 1. CLAUDE.md에서 프로젝트 설명 추출
// 2. agents/*.md에서 에이전트 이름/역할 추출
// 3. skills/*/SKILL.md에서 YAML frontmatter 파싱 (name, description)
// 4. 기술 스택, 도메인 키워드 자동 태깅
// 5. catalog.json으로 출력

// 실행: npx ts-node scripts/build-harness-catalog.ts
```

#### 2.9.4 이식 작업 순서

1. harness-100 레포를 git clone
2. `LICENSE` (+ `NOTICE`) 파일을 `src/lib/data/harness-100/` 에 복사
3. `ko/`, `en/` 디렉토리 전체를 복사
4. `build-harness-catalog.ts` 스크립트 실행하여 `catalog.json` 생성
5. DB 시드 스크립트로 `HarnessCatalog` 컬렉션 초기화
6. `.gitignore` 에 대용량 불필요 파일 제외 (있다면)
7. SPM UI에 출처 표기 추가 ("Powered by harness-100, Apache 2.0")

#### 2.9.5 업데이트 전략

harness-100 원본이 업데이트될 때 SPM에도 반영하는 방법:

- **수동 동기화 (MVP)**: 관리자가 `/api/admin/harness/sync` 호출 시 GitHub API로 최신 파일 가져와 로컬 데이터 갱신
- **자동 동기화 (향후)**: GitHub Webhook 또는 주기적 cron으로 변경 감지 → 자동 업데이트

### 2.10 관련 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/data/harness-100/` | 신규 | 하네스 파일 이식 (LICENSE 포함) |
| `scripts/build-harness-catalog.ts` | 신규 | catalog.json 빌드 스크립트 |
| `src/lib/models/HarnessCatalog.ts` | 신규 | 하네스 카탈로그 DB 모델 |
| `src/lib/utils/ai/recommendHarness.ts` | 신규 | AI 하네스 추천 로직 |
| `src/lib/utils/harness/syncFromGithub.ts` | 신규 | GitHub 동기화 유틸 |
| `src/lib/utils/harness/buildZipPackage.ts` | 신규 | ZIP 패키지 생성 유틸 |
| `src/lib/utils/harness/buildInlineMarkdown.ts` | 신규 | 통합 마크다운 생성 유틸 |
| `src/app/api/ai/recommend-harness/route.ts` | 신규 | 하네스 추천 API |
| `src/app/api/ai/history/[id]/download/route.ts` | 신규 | 지시서 다운로드 API (마크다운/ZIP) |
| `src/app/api/admin/harness/sync/route.ts` | 신규 | 카탈로그 동기화 API (관리자) |
| `src/store/instructionStore.ts` | 수정 | 하네스 추천 상태 + 다운로드 옵션 관리 |
| `src/components/board/InstructionModal.tsx` | 수정 | 하네스 추천 UI + 다운로드 버튼 + 출처 표기 |
| `src/components/board/HarnessBrowser.tsx` | 신규 | 하네스 카탈로그 브라우저 컴포넌트 |

---

## 기능 3: AI 지시서 실행결과 자동 완료처리

### 3.1 개요

AI가 생성한 지시서를 Agent(Claude Code, Cursor 등)가 실행한 후, 그 **실행결과를 SPM에 붙여넣으면 관련 노트를 자동으로 완료 처리**하는 기능.

핵심 아이디어: 지시서에 **실행결과 보고 템플릿**을 포함시키고, Agent가 해당 템플릿 형태로 결과를 출력하면, SPM이 이를 파싱하여 어떤 노트가 완료되었는지 자동 판별한다.

### 3.2 전체 플로우

```
[1. 지시서 생성 시]
    AI가 지시서 끝에 "실행결과 보고 템플릿" 자동 삽입
    ↓
[2. Agent 실행]
    사용자가 지시서를 Agent에게 전달 → Agent가 작업 수행
    ↓
[3. Agent 결과 출력]
    Agent가 템플릿 형태로 실행 결과 출력
    ↓
[4. 사용자가 SPM에 결과 붙여넣기]
    전용 입력 영역 또는 특정 노트에 붙여넣기
    ↓
[5. SPM 파싱]
    결과 텍스트에서 구조화된 데이터 추출
    ↓
[6. 자동 완료처리]
    매칭된 노트의 status: 'active' → 'done'
    completedAt, completionNote 자동 기록
    ↓
[7. UI 반영]
    Socket.io 브로드캐스트 → 칸반보드 실시간 업데이트
```

### 3.3 실행결과 보고 템플릿 설계

#### 3.3.1 지시서에 삽입되는 템플릿

AI가 지시서를 생성할 때, 마지막에 자동으로 아래 템플릿을 추가한다:

```markdown
---

## 실행결과 보고

작업 완료 후, 아래 템플릿을 채워서 보고해주세요:

\```spm-result
{
  "instructionId": "{{historyId}}",
  "completedNotes": [
    {
      "noteId": "{{noteId1}}",
      "noteTitle": "{{noteTitle1}}",
      "status": "done | partial | failed",
      "summary": "실행 결과 요약"
    }
  ],
  "additionalNotes": "기타 특이사항",
  "filesChanged": ["경로/파일명"],
  "testsResult": "pass | fail | skip"
}
\```
```

#### 3.3.2 Agent가 작성하는 실행결과 예시

```json
{
  "instructionId": "663f1a2b...",
  "completedNotes": [
    {
      "noteId": "663f1a2c...",
      "noteTitle": "Redis 설정 파일 작성",
      "status": "done",
      "summary": "redis.config.ts 생성, 연결 풀 설정 완료, 환경변수 REDIS_URL 추가"
    },
    {
      "noteId": "663f1a2d...",
      "noteTitle": "캐시 미들웨어 구현",
      "status": "done",
      "summary": "withCache HOC 패턴으로 구현, TTL 기본값 300초"
    },
    {
      "noteId": "663f1a2e...",
      "noteTitle": "캐시 무효화 로직",
      "status": "partial",
      "summary": "기본 무효화는 완료, 패턴 기반 무효화는 추가 논의 필요"
    }
  ],
  "additionalNotes": "Redis 서버는 로컬 환경에서 테스트 완료. 프로덕션 Redis 설정 필요.",
  "filesChanged": [
    "src/lib/redis/config.ts",
    "src/lib/middleware/withCache.ts",
    "src/lib/redis/invalidate.ts"
  ],
  "testsResult": "pass"
}
```

### 3.4 데이터 모델

#### 3.4.1 실행결과 스키마

```typescript
// src/types/ai-execution-result.ts (신규)

interface ExecutionNoteResult {
  noteId: string;
  noteTitle: string;
  status: 'done' | 'partial' | 'failed';
  summary: string;
}

interface AiExecutionResult {
  instructionId: string;            // AiInstructionHistory._id
  completedNotes: ExecutionNoteResult[];
  additionalNotes?: string;
  filesChanged?: string[];
  testsResult?: 'pass' | 'fail' | 'skip';
}
```

#### 3.4.2 AiExecutionLog 모델 (신규)

```typescript
// src/lib/models/AiExecutionLog.ts (신규)

const AiExecutionLogSchema = new Schema({
  instructionId: { type: Schema.Types.ObjectId, ref: 'AiInstructionHistory', required: true },
  boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  executorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  results: [{
    noteId: { type: Schema.Types.ObjectId, ref: 'Note' },
    noteTitle: String,
    status: { type: String, enum: ['done', 'partial', 'failed'] },
    summary: String,
  }],
  additionalNotes: String,
  filesChanged: [String],
  testsResult: { type: String, enum: ['pass', 'fail', 'skip'] },
  rawInput: String,                   // 원본 붙여넣기 텍스트 (디버깅용)
  parseMethod: { type: String, enum: ['json', 'ai-fallback'] },  // 파싱 방식
}, { timestamps: true });
```

### 3.5 파싱 엔진

#### 3.5.1 2단계 파싱 전략

**1단계: 정규식 JSON 파싱 (빠르고 정확)**

```typescript
// src/lib/utils/parseExecutionResult.ts (신규)

function parseExecutionResult(input: string): AiExecutionResult | null {
  // spm-result 코드블록 추출
  const codeBlockRegex = /```spm-result\s*\n([\s\S]*?)\n```/;
  const match = input.match(codeBlockRegex);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return validateExecutionResult(parsed);
    } catch (e) {
      // JSON 파싱 실패 → 2단계로
    }
  }

  // 코드블록 없이 JSON만 있는 경우
  const jsonRegex = /\{[\s\S]*"instructionId"[\s\S]*"completedNotes"[\s\S]*\}/;
  const jsonMatch = input.match(jsonRegex);
  if (jsonMatch) {
    try {
      return validateExecutionResult(JSON.parse(jsonMatch[0]));
    } catch (e) {
      // 2단계로
    }
  }

  return null;  // 정규식 파싱 실패
}
```

**2단계: AI 폴백 파싱 (자유 텍스트 처리)**

Agent가 템플릿을 정확히 따르지 않고 자유 텍스트로 결과를 보고한 경우, AI를 사용하여 파싱한다.

```typescript
async function aiParseExecutionResult(
  input: string,
  instructionHistory: IAiInstructionHistory
): Promise<AiExecutionResult> {
  // LLM에게 자유 텍스트를 JSON으로 변환 요청
  const prompt = `
    아래 텍스트는 AI 지시서의 실행 결과 보고이다.
    원래 지시서에서 다룬 노트 목록:
    ${instructionHistory.targetNotes.map(n => `- ${n._id}: ${n.text}`).join('\n')}

    실행 결과 텍스트:
    ${input}

    위 텍스트를 분석하여, 각 노트의 완료 상태를 JSON으로 출력해라.
    (스키마 제공)
  `;

  // LLM 호출 → JSON 파싱 → 반환
}
```

### 3.6 API 엔드포인트

**`POST /api/ai/execution-result`**

```typescript
// src/app/api/ai/execution-result/route.ts (신규)

// 요청:
{
  boardId: string;
  instructionId?: string;     // 연관 지시서 (없으면 AI가 매칭 시도)
  rawInput: string;           // 붙여넣은 텍스트
}

// 응답:
{
  success: true,
  data: {
    parsed: AiExecutionResult,
    autoCompleted: {
      noteId: string;
      previousStatus: string;
      newStatus: string;
    }[],
    requiresConfirmation: {     // partial/failed는 사용자 확인 필요
      noteId: string;
      noteTitle: string;
      agentStatus: string;
      summary: string;
    }[]
  }
}
```

**처리 로직:**

1. rawInput에서 JSON 파싱 시도 (1단계)
2. 실패 시 AI 폴백 파싱 (2단계)
3. instructionId로 원본 지시서 조회
4. completedNotes와 실제 Note 매칭 (noteId 또는 noteTitle 유사도)
5. status가 'done'인 노트 → 자동 완료 처리 (`status: 'done'`, `completedAt: now`)
6. status가 'partial' 또는 'failed' → `requiresConfirmation`으로 반환 (사용자 확인 필요)
7. AiExecutionLog 저장
8. Socket.io로 보드 변경 브로드캐스트

### 3.7 프론트엔드 UI

#### 3.7.1 실행결과 입력 방법 (2가지)

**방법 A: 전용 패널**

지시서 생성 히스토리에서 "결과 보고" 버튼을 추가한다.

```
┌────────────────────────────────────────────────┐
│  📋 지시서 히스토리                               │
├────────────────────────────────────────────────┤
│                                                │
│  2026-04-04 14:30 - 기능 구현 지시서            │
│  프리셋: 기능 구현 | 노트 3개 | 토큰: 1,240     │
│  [📋 복사] [📥 다운로드] [🔄 재생성]             │
│  [✅ 결과 보고]  ← 신규 버튼                     │
│                                                │
└────────────────────────────────────────────────┘

↓ "결과 보고" 클릭 시

┌────────────────────────────────────────────────┐
│  ✅ 실행결과 보고                                │
├────────────────────────────────────────────────┤
│                                                │
│  관련 지시서: 기능 구현 (2026-04-04 14:30)       │
│  대상 노트: Redis 설정, 캐시 미들웨어, 무효화    │
│                                                │
│  📝 실행결과 붙여넣기                            │
│  ┌────────────────────────────────────────┐    │
│  │ Agent의 실행결과를 여기에 붙여넣으세요  │    │
│  │                                        │    │
│  │                                        │    │
│  │                                        │    │
│  └────────────────────────────────────────┘    │
│                                                │
│           [취소]  [✅ 파싱 & 완료처리]            │
└────────────────────────────────────────────────┘
```

**파싱 결과 확인 화면:**

```
┌────────────────────────────────────────────────┐
│  ✅ 파싱 결과 확인                               │
├────────────────────────────────────────────────┤
│                                                │
│  자동 완료 처리 (2건):                           │
│  ✅ Redis 설정 파일 작성 → 완료                   │
│     "redis.config.ts 생성, 연결 풀 설정 완료"    │
│  ✅ 캐시 미들웨어 구현 → 완료                     │
│     "withCache HOC 패턴으로 구현"                 │
│                                                │
│  확인 필요 (1건):                                │
│  ⚠️ 캐시 무효화 로직 → 부분 완료                 │
│     "기본 무효화 완료, 패턴 기반은 추가 논의"     │
│     [✅ 완료처리] [⏸ 유지] [❌ 실패처리]          │
│                                                │
│  테스트: ✅ pass                                  │
│  변경 파일: 3개                                   │
│                                                │
│           [취소]  [✅ 확인 및 적용]                │
└────────────────────────────────────────────────┘
```

**방법 B: 노트 컨텍스트 메뉴**

개별 노트에서 우클릭 → "실행결과 보고" 옵션으로도 접근 가능. 이 경우 해당 노트와 연관된 최근 지시서를 자동 매칭한다.

### 3.8 지시서 생성 시 템플릿 자동 삽입

#### 3.8.1 generate-instruction API 수정

```typescript
// src/app/api/ai/generate-instruction/route.ts 수정

// 기존 LLM 응답 수신 후, 실행결과 템플릿 자동 추가
const resultTemplate = generateResultTemplate(historyId, targetNotes);
const finalMarkdown = `${llmResponse}\n\n${resultTemplate}`;
```

#### 3.8.2 템플릿 생성 함수

```typescript
// src/lib/utils/ai/generateResultTemplate.ts (신규)

function generateResultTemplate(
  historyId: string,
  targetNotes: INote[]
): string {
  const noteEntries = targetNotes.map(note => ({
    noteId: note._id.toString(),
    noteTitle: note.text.substring(0, 50),  // 50자 제한
    status: 'done | partial | failed',
    summary: '실행 결과를 여기에 작성',
  }));

  return `
---

## 실행결과 보고 (SPM 자동 완료처리용)

작업 완료 후 아래 JSON을 채워서 보고해주세요.
\`\`\`spm-result
${JSON.stringify({
    instructionId: historyId,
    completedNotes: noteEntries,
    additionalNotes: '',
    filesChanged: [],
    testsResult: 'pass | fail | skip'
  }, null, 2)}
\`\`\`
  `.trim();
}
```

### 3.9 관련 파일 변경 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/api/ai/execution-result/route.ts` | 신규 | 실행결과 파싱 & 완료처리 API |
| `src/lib/models/AiExecutionLog.ts` | 신규 | 실행결과 로그 모델 |
| `src/types/ai-execution-result.ts` | 신규 | 타입 정의 |
| `src/lib/utils/ai/parseExecutionResult.ts` | 신규 | 2단계 파싱 엔진 |
| `src/lib/utils/ai/generateResultTemplate.ts` | 신규 | 결과 보고 템플릿 생성 |
| `src/store/executionResultStore.ts` | 신규 | 실행결과 UI 상태 관리 |
| `src/components/board/ExecutionResultModal.tsx` | 신규 | 결과 보고 모달 |
| `src/components/board/ExecutionResultConfirm.tsx` | 신규 | 파싱 결과 확인 UI |
| `src/app/api/ai/generate-instruction/route.ts` | 수정 | 결과 템플릿 자동 삽입 |
| `src/components/board/InstructionModal.tsx` | 수정 | "결과 보고" 버튼 추가 |
| `src/lib/models/kanban/NoteModel.ts` | 수정 | completionNote 필드 활용 확대 |

---

## 구현 우선순위 및 일정

### 추천 순서

| 순서 | 기능 | 이유 | 예상 공수 |
|------|------|------|----------|
| 1순위 | 기능 3: 실행결과 자동 완료처리 | 실현 가능성 높고, 기존 구조 변경 최소. 즉시 체감 가능한 UX 개선 | 3~4일 |
| 2순위 | 기능 2: Harness 100 연동 | 지시서 다운로드 확장 + 하네스 카탈로그 구축. 기능 3과 시너지 (다운로드 시 결과 템플릿도 포함) | 5~7일 |
| 3순위 | 기능 1: 회의록 AI 정리 | 신규 기능이 많고, 자동 배치 알고리즘 등 복잡도 높음 | 5~7일 |

### 단계별 상세 일정

**Phase 1 (1주차): 실행결과 자동 완료처리**

- Day 1: 타입 정의 + AiExecutionLog 모델 + 파싱 엔진
- Day 2: API 엔드포인트 + 지시서 생성 시 템플릿 삽입
- Day 3: 프론트엔드 (ExecutionResultModal + 확인 UI)
- Day 4: 테스트 + Socket.io 연동 + 엣지 케이스 처리

**Phase 2 (2~3주차): Harness 100 연동**

- Day 1: HarnessCatalog 모델 + 시드 데이터 JSON 작성 (MVP)
- Day 2: 하네스 추천 API (`/api/ai/recommend-harness`) + 태그 기반 필터링
- Day 3: AI 정밀 매칭 로직 + 추천 결과 캐싱
- Day 4: 통합 마크다운 생성 유틸 (`buildInlineMarkdown.ts`)
- Day 5: ZIP 패키지 생성 유틸 (`buildZipPackage.ts`) + 다운로드 API
- Day 6: InstructionModal에 하네스 추천 UI + 다운로드 옵션 추가
- Day 7: HarnessBrowser 컴포넌트 + GitHub 동기화 API (관리자) + 테스트

**Phase 3 (4주차): 회의록 AI 자동 정리**

- Day 1~2: API 엔드포인트 + JSON 스키마 검증 + 프롬프트 설계
- Day 3: 자동 배치 알고리즘 (autoLayout.ts)
- Day 4: MeetingOrganizeModal UI
- Day 5: 미리보기 기능 + Socket.io 연동
- Day 6~7: 템플릿별 테스트 + 엣지 케이스

---

## 공통 기술 고려사항

### 1. LLM JSON 모드

기능 1, 3 모두 AI에게 JSON 출력을 요구한다. Gemini의 `responseMimeType: "application/json"` 옵션을 활용하되, 파싱 실패 시 재시도 로직이 필수.

```typescript
// GeminiProvider 수정: JSON 모드 옵션 추가
async *generateStream(systemPrompt, userMessage, options?: { jsonMode?: boolean }) {
  const config = {
    ...baseConfig,
    ...(options?.jsonMode && { responseMimeType: 'application/json' }),
  };
}
```

### 2. Rate Limiting 통합

세 기능 모두 기존 쿨다운/일일 한도 시스템을 공유한다. 회의록 정리는 토큰 사용량이 크므로 별도 가중치를 고려할 수 있다.

### 3. 에러 핸들링 원칙

- JSON 파싱 실패 → 최대 1회 재시도 (에러 피드백 포함)
- 재시도 실패 → 사용자에게 마크다운 원문 제공 + 수동 처리 유도
- 토큰 한도 초과 → 대상 노트 수 줄이기 제안

### 4. 테스트 전략

- 각 기능별 `*.test.ts` 파일 생성 (기존 `src/__tests__/` 구조 준수)
- JSON 파싱 엔진: 다양한 형태의 입력에 대한 유닛 테스트 필수
- 자동 배치 알고리즘: 겹침 없음 검증 테스트
- E2E: 지시서 생성 → 결과 보고 → 노트 완료 전체 플로우
