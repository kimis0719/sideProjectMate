# 칸반보드 선행 작업 — 구현 계획

> AI 지시서 기능을 붙이기 전에 보드 자체를 개선하는 작업.
>
> 1. 섹션 중첩, 2) 메모 완료, 3) AI 컨텍스트 관리자 페이지

---

## 현재 구조 분석 요약

```
Board (pid 기반, 프로젝트당 1개)
 ├─ Section[] — 캔버스 위 사각형 컨테이너 (x, y, width, height, zIndex)
 └─ Note[]    — 캔버스 위 스티키 노트 (x, y, sectionId로 소속 결정)

관계: Section ← Note (1:N, sectionId FK)
중첩: 불가 (Section에 parentId 없음)
완료: 불가 (Note에 status 없음)
```

**핵심 특성:**

- 섹션과 노트는 별도 배열, DOM도 독립적 (절대 좌표 배치)
- 노트의 섹션 소속은 `sectionId`로만 관리 (DOM 중첩이 아님)
- 섹션 드래그 시 자식 노트를 delta만큼 같이 이동 (DOM 캐시로 최적화)
- 섹션 리사이즈 시 경계 안팎으로 노트 자동 캡처/릴리즈
- zIndex: 고아 노트 = 1, 섹션 내 노트 = 부모 zIndex + 1

---

## 1. 섹션 중첩 (Section-in-Section)

### 1-1. 설계 방향

**1단계 중첩만 허용** (부모 → 자식, 손자는 불가)

이유:

- 캔버스 보드에서 3단계 이상 중첩은 시각적으로 혼란스러움
- 드래그/리사이즈 로직의 복잡도가 기하급수적으로 증가
- 실제 사용 패턴상 "큰 분류 → 세부 분류" 2단계면 충분

### 1-2. 모델 변경

```ts
// SectionModel.ts에 추가
parentSectionId: {
  type: Schema.Types.ObjectId,
  ref: 'Section',
  default: null,           // null = 최상위 섹션
},
depth: {
  type: Number,
  default: 0,              // 0 = 최상위, 1 = 자식 (최대)
},
```

### 1-3. zIndex 계층 구조

```
기존:
  섹션        → zIndex: N
  섹션 내 노트 → zIndex: N + 1

변경 후:
  부모 섹션         → zIndex: N
  자식 섹션         → zIndex: N + 2
  자식 섹션 내 노트  → zIndex: N + 3
  부모 섹션 내 노트  → zIndex: N + 1  (자식 섹션 아래)
```

BoardShell.tsx의 zIndex 계산:

```ts
// 섹션 zIndex
function getSectionZIndex(section: ISection, sections: ISection[]): number {
  if (!section.parentSectionId) return section.zIndex || 10;
  const parent = sections.find((s) => s.id === section.parentSectionId);
  return (parent?.zIndex || 10) + 2;
}

// 노트 zIndex
function getNoteZIndex(note: INote, sections: ISection[]): number {
  if (!note.sectionId) return 1; // 고아
  const section = sections.find((s) => s.id === note.sectionId);
  if (!section) return 1;
  if (!section.parentSectionId) return (section.zIndex || 10) + 1;
  // 자식 섹션 내 노트
  const parent = sections.find((s) => s.id === section.parentSectionId);
  return (parent?.zIndex || 10) + 3;
}
```

### 1-4. 드래그 동작

**부모 섹션 드래그 시:**

```
1. 부모 섹션 이동 (deltaX, deltaY)
2. 부모에 직접 소속된 노트들 이동 (기존 로직)
3. 🆕 자식 섹션들 이동 (parentSectionId === 부모.id)
4. 🆕 자식 섹션에 소속된 노트들 이동
```

SectionItem.tsx의 드래그 핸들러에서:

```ts
// 기존: 자식 노트 DOM 캐시
const childNotes = document.querySelectorAll(`[data-section-id="${section.id}"]`);

// 추가: 자식 섹션 + 자식 섹션의 노트 캐시
const childSections = sections.filter((s) => s.parentSectionId === section.id);
childSections.forEach((child) => {
  // 자식 섹션 DOM
  const childEl = document.querySelector(`[data-section-item-id="${child.id}"]`);
  // 자식 섹션의 노트 DOM
  const grandchildNotes = document.querySelectorAll(`[data-section-id="${child.id}"]`);
});
```

**자식 섹션 드래그 시:**

- 자식 섹션 + 소속 노트만 이동 (부모는 안 움직임)
- 부모 경계를 벗어나면 자동 릴리즈 (parentSectionId = null, depth = 0)

### 1-5. 자동 캡처/릴리즈

**섹션 → 섹션 캡처 (신규):**

- 부모 섹션 리사이즈 시, 경계 안의 최상위 섹션(depth=0)을 자식으로 캡처
- 자식 섹션 드래그 후 부모 경계 밖이면 릴리즈

```ts
// 캡처 조건
sectionCenter.x >= parent.x &&
  sectionCenter.x <= parent.x + parent.width &&
  sectionCenter.y >= parent.y &&
  sectionCenter.y <= parent.y + parent.height &&
  candidateSection.depth === 0; // 이미 자식이 아닌 것만
```

**기존 노트 캡처는 그대로 유지** — 단, 자식 섹션 경계 안의 노트는 자식 섹션에 소속.

### 1-6. 삭제 동작

| 삭제 대상                  | 동작                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| 자식 섹션 삭제             | 기존과 동일 (노트 삭제 or 고아화 선택)                                   |
| 부모 섹션 삭제 (노트 포함) | 자식 섹션 + 자식의 노트 + 부모의 노트 전부 삭제                          |
| 부모 섹션 삭제 (구조만)    | 자식 섹션은 최상위로 승격 (depth=0, parentSectionId=null), 노트는 고아화 |

### 1-7. API 변경

```
POST   /api/kanban/sections     → parentSectionId, depth 필드 추가
PATCH  /api/kanban/sections/[id] → parentSectionId 변경 가능
DELETE /api/kanban/sections/[id] → cascade 옵션에 자식 섹션 처리 추가
```

### 1-8. UI 시각적 표현

- 자식 섹션은 부모보다 **약간 짙은 배경** (opacity 차이)
- 부모 섹션 헤더에 자식 섹션 개수 뱃지: `📋 백엔드 (섹션 2개, 노트 5개)`
- 자식 섹션은 부모 경계 내에서만 이동 가능 (경계 밖으로 나가면 릴리즈)

---

## 2. 메모 완료 기능

### 2-1. 확정 방식: 레이어 전환

**같은 캔버스 위에서 레이어를 전환**하는 방식으로 확정.
"보드 반전" 컨셉을 살리되, 물리적으로는 동일 캔버스에서 모드만 전환한다.

```
[보드 헤더]
┌──────────────────────────────────────────────────────────┐
│  📝 Project Board    [📌 진행중 24] [✅ 완료 12]   + 노트 │
│                       ─────────────  ─────────────        │
│                       ◀ 현재 활성 ▶                       │
└──────────────────────────────────────────────────────────┘
```

**📌 진행중 탭 (기본 뷰):**

- 기존 보드 그대로 (active 노트만 표시)
- 완료된 노트는 완전히 숨김 → 보드가 깔끔

**✅ 완료 탭 클릭 시:**

- 같은 캔버스이지만 **완료된 노트만 표시**
- 노트는 **원래 있던 위치 그대로** 표시 (어디서 완료됐는지 맥락 유지)
- 배경 톤이 살짝 바뀜 (약간 어두운 톤으로 "아카이브 모드" 느낌)
- 섹션 경계는 반투명으로 유지 (구조 파악용)
- 노트에 완료 날짜 뱃지 표시
- 노트 클릭 → "되돌리기" 버튼으로 active 복귀 가능
- **편집 불가** (읽기 전용, 실수로 완료된 노트 수정 방지)

**선정 이유:**

- 탭으로 뒤집는 느낌 → "보드 반전" 컨셉과 일치
- 같은 캔버스라 위치 컨텍스트 유지 → "이 버그는 백엔드 섹션에서 완료됐구나"
- 완료 뷰에서 드래그/편집 불가 → 실수 방지
- 진행중 뷰는 완전히 깨끗 → 집중력 향상

### 2-2. 모델 변경

```ts
// NoteModel.ts에 추가
status: {
  type: String,
  enum: ['active', 'done'],
  default: 'active',
},
completedAt: {
  type: Date,
  default: null,
},
completionNote: {
  type: String,        // 완료 메모 (선택 — AI 완료보고 연동 시 자동 입력)
  default: null,
},
```

인덱스 추가:

```ts
NoteSchema.index({ boardId: 1, status: 1 }); // 상태별 조회 최적화
```

### 2-3. 완료 처리 UX

**개별 완료:**

- 노트 우측 상단에 ☐ 체크박스 추가 (hover 시 표시)
- 체크 → 확인 없이 즉시 완료 (실수하면 완료 탭에서 되돌리기)
- 완료 시 사라지는 애니메이션 (scale down + fade out, 0.3s)

**일괄 완료:**

- 멀티셀렉트 → 헤더 액션바에 [✅ 선택 완료] 버튼 표시
- 클릭 → 선택된 노트 일괄 완료

**되돌리기:**

- 완료 탭에서 노트 클릭 → [↩️ 되돌리기] 버튼
- 되돌리면 진행중 탭으로 복귀 (원래 위치)

### 2-4. 완료 탭 시각 디자인

```
[✅ 완료 탭 활성 시]
┌──────────────────────────────────────────────────────────┐
│  📝 Project Board    [📌 진행중 24] [✅ 완료 12]          │
│                                      ═══════════          │
│  배경: 기존보다 약간 어두운 톤 (bg-gray-100 → bg-gray-200) │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ 백엔드 리팩토링 (반투명 경계) ──────────────────┐     │
│  │                                                  │     │
│  │  ┌──────────────────────┐                        │     │
│  │  │ ✅ API 응답 형식 통일  │                        │     │
│  │  │ 완료: 3월 27일         │                        │     │
│  │  │ ──────────────────── │                        │     │
│  │  │ "전체 Route 수정 완료" │  ← completionNote     │     │
│  │  │                      │                        │     │
│  │  │      [↩️ 되돌리기]    │                        │     │
│  │  └──────────────────────┘                        │     │
│  │                                                  │     │
│  │  ┌──────────────────────┐                        │     │
│  │  │ ✅ Socket 이벤트 정리  │                        │     │
│  │  │ 완료: 3월 28일         │                        │     │
│  │  └──────────────────────┘                        │     │
│  │                                                  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                          │
│  완료된 노트가 없는 섹션은 표시하지 않음                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 2-5. API 변경

```
GET  /api/kanban/notes?boardId={id}&status=active   ← 기본 (진행중)
GET  /api/kanban/notes?boardId={id}&status=done      ← 완료 탭
PATCH /api/kanban/notes/{noteId}                     ← status 변경
PUT  /api/kanban/notes/batch                         ← 일괄 status 변경
```

### 2-6. 스토어 변경

```ts
// boardStore.ts에 추가
viewMode: 'active' | 'done',           // 현재 보드 뷰 모드
setViewMode: (mode) => void,
completedNotes: INote[],               // 완료 노트 (별도 배열)
fetchCompletedNotes: (boardId) => void, // 완료 탭 전환 시 lazy load
completeNote: (noteId, completionNote?) => void,
revertNote: (noteId) => void,
```

완료 노트는 **lazy loading** — 완료 탭을 처음 클릭할 때만 fetch.
진행중 탭의 notes 배열에는 active 노트만 유지 → 성능 영향 없음.

### 2-7. Socket 이벤트 추가

```
'note-completed'  → { noteId, completedAt, completionNote }
'note-reverted'   → { noteId }
```

다른 사용자가 노트를 완료하면 실시간으로 사라지는 것을 볼 수 있음.

---

## 3. AI 컨텍스트 관리자 페이지

### 3-1. 문제

현재 기획에서 시스템 프롬프트가 소스코드에 하드코딩됨:

```ts
// buildAiContext.ts
const systemPrompt = `당신은 프로젝트 관리 보드의 노트를...`; // ← 수정하려면 배포 필요
```

### 3-2. 해결: AiSettings 모델에 프롬프트 템플릿 포함

```ts
// AiSettings.ts 확장 (기존 v5의 AiSettings에 추가)
interface IAiSettings extends Document {
  // 기존 필드
  provider: 'gemini' | 'anthropic' | 'openai';
  model: string;
  enabled: boolean;
  cooldownMinutes: number;
  dailyLimitPerProject: number;

  // 🆕 프롬프트 템플릿 관리
  systemPromptTemplate: string; // 메인 시스템 프롬프트 (변수 포함)
  contextIncludeOverview: boolean; // 프로젝트 overview 포함 여부
  contextIncludeResources: boolean; // 프로젝트 resources 포함 여부
  contextIncludeMembers: boolean; // 팀원 목록 포함 여부
  contextIncludeDeadline: boolean; // 마감일 포함 여부

  // 🆕 프리셋 기본값 관리
  defaultPresets: Array<{
    name: string;
    roleInstruction: string;
    description: string;
  }>;
}
```

### 3-3. 프롬프트 템플릿 — 변수 치환 방식

관리자가 편집하는 템플릿에서 `{{변수}}`로 동적 데이터 삽입:

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

### 3-4. 관리자 UI 확장

기존 AI 설정 페이지에 탭 추가:

```
┌──────────────────────────────────────────────────────────┐
│  ⚙️ AI 지시서 설정                                        │
│                                                          │
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

**기본 프리셋 탭:**

- 기본 제공 프리셋 5개의 이름/역할 지시를 관리자가 수정 가능
- 새 기본 프리셋 추가/삭제

### 3-5. 서버 로직

```ts
// buildAiContext.ts
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

  // 4. 템플릿 변수 치환
  const rendered = renderTemplate(template, variables);
  return rendered;
}
```

---

## 4. 구현 순서

### Phase 0: 노트 완료 기본 (2일) — 독립 작업, 바로 시작 가능

| 작업                   | 설명                                  | 일정  |
| ---------------------- | ------------------------------------- | ----- |
| NoteModel 필드 추가    | status, completedAt, completionNote   | 0.5일 |
| 노트 완료/되돌리기 API | PATCH 확장 + batch 지원               | 0.5일 |
| 레이어 전환 UI         | 헤더 탭 + viewMode 스토어             | 0.5일 |
| 완료 탭 렌더링         | 완료 노트 표시 + 읽기 전용 + 되돌리기 | 0.5일 |

### Phase 1: 섹션 중첩 (3~4일) — 가장 복잡

| 작업                   | 설명                              | 일정  |
| ---------------------- | --------------------------------- | ----- |
| SectionModel 필드 추가 | parentSectionId, depth            | 0.5일 |
| 섹션 API 확장          | 생성/수정/삭제에 중첩 로직        | 0.5일 |
| 부모 드래그 로직       | 자식 섹션+손자 노트 동시 이동     | 1일   |
| 자동 캡처/릴리즈       | 섹션↔섹션 캡처 + 경계 이탈 릴리즈 | 0.5일 |
| zIndex 재설계          | 3단 계층 (부모→자식→노트)         | 0.5일 |
| 삭제 동작              | 캐스케이드/승격 옵션 + UI         | 0.5일 |

### Phase 2: AI 컨텍스트 관리 (1.5일)

| 작업                 | 설명                                          | 일정  |
| -------------------- | --------------------------------------------- | ----- |
| AiSettings 모델 확장 | 프롬프트 템플릿 + 컨텍스트 토글 필드          | 0.5일 |
| 관리자 UI 탭         | 프롬프트 편집기 + 변수 레퍼런스 + 프리셋 관리 | 0.5일 |
| 템플릿 렌더링 로직   | 변수 치환 함수 + buildAiContext 연동          | 0.5일 |

### Phase 3: 통합 테스트 (1일)

| 작업                  | 설명                                | 일정  |
| --------------------- | ----------------------------------- | ----- |
| 중첩 섹션 + 완료 통합 | 자식 섹션 내 노트 완료 시 동작 검증 | 0.5일 |
| Socket 이벤트         | 완료/되돌리기 실시간 동기화 테스트  | 0.5일 |

**총 예상 기간: 7.5~9.5일**

---

## 5. 파일 변경 목록

```
수정:
  src/lib/models/kanban/NoteModel.ts        ← status, completedAt, completionNote 추가
  src/lib/models/kanban/SectionModel.ts     ← parentSectionId, depth 추가
  src/store/boardStore.ts                   ← viewMode, completedNotes, 완료/되돌리기 액션
  src/components/board/BoardShell.tsx        ← 레이어 전환 탭, zIndex 재계산, 완료 뷰 렌더링
  src/components/board/SectionItem.tsx       ← 부모 드래그 시 자식 연동, 삭제 캐스케이드
  src/components/board/NoteItem.tsx          ← 완료 체크박스, 완료 뷰 읽기 전용 모드
  src/app/api/kanban/sections/route.ts      ← parentSectionId 지원
  src/app/api/kanban/sections/[id]/route.ts ← 중첩 삭제 로직
  src/app/api/kanban/notes/route.ts         ← status 필터 쿼리
  src/app/api/kanban/notes/[noteId]/route.ts ← 완료/되돌리기 PATCH
  src/app/api/kanban/notes/batch/route.ts   ← 일괄 완료 지원

신규 (AI 컨텍스트 관리):
  src/lib/models/AiSettings.ts              ← 프롬프트 템플릿 + 컨텍스트 토글 (v5 모델 확장)
  src/lib/utils/ai/renderTemplate.ts        ← 변수 치환 함수
  src/lib/utils/ai/renderTemplate.test.ts   ← 테스트
  src/app/admin/ai-settings/page.tsx        ← 관리자 페이지 (탭 구조)
  src/components/admin/AiPromptEditor.tsx   ← 프롬프트 편집 UI
  src/components/admin/AiPresetManager.tsx  ← 기본 프리셋 관리 UI
  src/app/api/admin/ai-settings/route.ts    ← 설정 CRUD API
```

---

## 6. 리스크

| 리스크                   | 대응                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| 섹션 중첩 드래그 성능    | DOM 캐시 전략 유지 + 자식이 너무 많으면 requestAnimationFrame 최적화 |
| 중첩 depth 제한 우회     | API에서 depth 검증 (depth > 1이면 거부)                              |
| 완료 노트 DB 증가        | 완료 후 90일 지나면 자동 아카이브/삭제 정책 (선택적)                 |
| 기존 데이터 마이그레이션 | status 필드 추가 시 기존 노트는 default 'active'로 자동 설정         |
| 프롬프트 템플릿 오류     | 변수 치환 실패 시 fallback 기본 템플릿 사용 + 관리자에게 에러 표시   |

---

## 7. 추후 확장 방향

### 칸반 보드 자체 확장

| 아이디어                | 설명                                                                                 | 시기                       |
| ----------------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| 섹션 중첩 2단계+        | depth 제한 해제 (재귀적 중첩). 현재는 1단계로 제한하되, 데이터 구조는 이미 확장 가능 | 실사용 피드백 후 필요 시   |
| 완료 노트 자동 아카이브 | 완료 후 90일 경과 시 별도 아카이브 컬렉션으로 이동, 보드 성능 유지                   | 완료 노트 누적 시          |
| 완료 통계 대시보드      | 주간/월간 완료 개수, 평균 체류 시간, 섹션별 완료율 차트                              | 프로젝트 관리 고도화 시    |
| 섹션 템플릿             | 자주 쓰는 섹션+하위 구조를 템플릿으로 저장, 원클릭 생성                              | 반복 프로젝트 패턴 발생 시 |
| 멀티셀렉트 섹션 이동    | 여러 노트를 드래그로 한번에 다른 섹션으로 이동                                       | UX 개선 시                 |

### AI 지시서 관련 확장

| 아이디어                  | 설명                                                          | 시기                     |
| ------------------------- | ------------------------------------------------------------- | ------------------------ |
| 유료 LLM 전환             | Anthropic/OpenAI Provider 추가, 관리자가 어드민에서 전환      | 무료 한도 부족 시        |
| 완료 보고 → 자동 완료처리 | AI에게 완료보고 텍스트 입력 → 관련 노트 자동 매칭 → 일괄 완료 | AI 지시서 기능 안정화 후 |
| CLAUDE.md 원클릭 업데이트 | 생성된 MD를 GitHub API로 PR 생성 or 직접 반영                 | GitHub 연동 강화 시      |
| 프리셋 공개 마켓          | 잘 만든 프리셋을 다른 프로젝트에 공유                         | 사용자 풀 확대 시        |
| 채팅방 컨텍스트 통합      | 팀 채팅 내용을 지시서 컨텍스트에 선택적 포함                  | 채팅 기능 완성 후        |
| 자체 API 키 입력          | 프로젝트별 API 키를 암호화 저장, 무료 한도 해제               | 헤비 유저 요청 시        |
| 섹션+노트 자동 생성       | AI 응답을 structured output으로 받아 보드에 직접 반영         | 지시서 기능 안정화 후    |
| 보이스 입력               | Web Speech API로 음성→텍스트 변환 후 추가 지시로 활용         | 모바일 지원 시           |
