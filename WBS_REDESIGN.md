# WBS 전면 개편 기획서

> **목적**: 현재 WBS 기능의 UI/UX·코드 문제를 진단하고, 실제 팀이 사용할 수 있는 수준으로 전면 재설계하기 위한 Claude AI Agent용 구현 가이드입니다.

---

## 1. 현황 진단

### 1-1. UX 문제

**문제 1 — 화면에 너무 많은 정보가 동시에 노출된다**

현재 WBS 페이지는 아래 요소를 수직으로 쌓아 한 화면에 보여준다.
```
[툴바]
[일정 충돌 통계 배너]   ← 숫자만 보여주고 맥락 없음
[TaskForm 인라인 폼]    ← 항상 펼쳐져 있음
[GanttChart]
[TaskList 테이블]       ← 9개 컬럼 + 인라인 편집 컨트롤
[DependencySettingModal (별도 팝업)]
```
결과적으로 스크롤 없이는 간트차트와 테이블을 동시에 볼 수 없고, 사용자가 무엇을 봐야 하는지 혼란스럽다.

**문제 2 — 작업 수정 경로가 두 갈래로 분리되어 있다**

- **간트차트 작업 클릭** → `DependencySettingModal` 열림 (의존관계만 설정 가능)
- **테이블 수정 버튼 클릭** → `TaskForm` 인라인 표시 (모든 필드 수정 가능)
- **테이블 행 인라인** → 진행률(슬라이더), 상태(버튼 3개) 즉시 편집

동일한 작업 하나를 편집하는데 3가지 경로가 존재한다. 사용자는 어디서 무엇을 수정해야 하는지 파악하기 어렵다.

**문제 3 — TaskList 테이블이 지나치게 밀집되어 있다**

| 작업명 | 단계 | 담당자 | 시작일 | 종료일 | 소요기간 | 진행률(슬라이더) | 상태(버튼×3) | 수정/삭제 |
|--------|------|--------|--------|--------|---------|----------------|-------------|----------|

9개 컬럼이 하나의 행에 들어가고, 그 안에 슬라이더·버튼 등 인터랙티브 요소가 섞여 있어 모바일은 물론 데스크탑에서도 조작하기 어렵다.

**문제 4 — 인라인 TaskForm이 레이아웃을 밀어낸다**

작업 추가/수정 시 페이지 중간에 폼이 삽입되어 간트차트가 아래로 밀린다. 작업을 추가하는 동안 간트차트를 참조할 수 없다.

**문제 5 — 일정 충돌 배너가 행동 유도를 못 한다**

"⚠ 일정 충돌 2건, 영향받는 작업자 1명"처럼 숫자만 표시하며, 어떤 작업이 어떻게 충돌하는지 바로 알 수 없다.

**문제 6 — "WBS (Work Breakdown Structure)"라는 레이블**

비개발자 팀원에게 WBS는 낯선 용어다. 기능을 설명하는 이름이 필요하다.

---

### 1-2. 기술 문제

**BUG-1 — 배치 삭제 API의 의존관계 정리 쿼리 오류**
`src/app/api/wbs/tasks/batch/route.ts`

```ts
// ❌ 현재 (동작하지 않음)
Task.updateMany(
  { dependencies: { $in: ids } },
  { $pull: { dependencies: { $in: ids } } }
)

// ✅ 수정
Task.updateMany(
  { 'dependencies.taskId': { $in: ids } },
  { $pull: { dependencies: { taskId: { $in: ids } } } }
)
```
`dependencies`는 `[{ taskId, type }]` 객체 배열이므로 `$in`으로 비교하려면 `dependencies.taskId`를 지정해야 한다.

**BUG-2 — GanttChart.tsx 타이머 다중 실행 및 메모리 누수**

- 텍스트 스타일링: `setTimeout(150ms)` 초기화 + `setInterval(800ms)` 반복 업데이트
- 의존관계 선 그리기: `setTimeout(500ms)`
- 다크모드 감지: `MutationObserver` (cleanup 미구현)

총 3개의 비동기 루프가 라이브러리 DOM을 직접 조작한다. 페이지 이탈 후에도 인터벌이 살아있을 수 있다.

**BUG-3 — API 응답 형식 불일치**

현재 WBS API들이 CLAUDE.md 컨벤션(`{ success, data | message }`)을 따르지 않는다.

```ts
// ❌ 현재 GET /api/wbs/tasks
return NextResponse.json(tasks) // 배열 직접 반환

// ❌ 현재 POST /api/wbs/tasks
return NextResponse.json(task, { status: 201 }) // 객체 직접 반환

// ✅ 목표
return NextResponse.json({ success: true, data: tasks })
return NextResponse.json({ success: true, data: task }, { status: 201 })
```

`wbsStore.ts`의 클라이언트 코드도 `response.data` 형식에 맞게 수정이 필요하다.

**BUG-4 — `wbsStore.ts` addTask Optimistic Update 후 임시 ID 교체 타이밍**

```ts
// 임시 ID로 추가
const tempTask = { ...task, id: `temp-${Date.now()}` }
set(state => ({ tasks: [...state.tasks, tempTask] }))

// 서버 응답 후 교체
const savedTask = transformDoc(data)
set(state => ({
  tasks: state.tasks.map(t => t.id === tempTask.id ? savedTask : t)
}))
```
서버 응답 전에 사용자가 방금 추가된 임시 작업을 클릭(선택)하면 `selectedTaskId`가 `temp-xxx`로 설정된다. 이후 실제 ID로 교체되어도 `selectedTaskId`는 갱신되지 않아 선택이 해제된다.

**CODE-1 — GanttChart.tsx가 `gantt-task-react` 라이브러리를 과도하게 우회한다**

라이브러리 렌더링 결과물을 DOM 쿼리로 찾아 스타일을 덮어쓰고, 삭제 후 새 요소로 교체하는 방식은 라이브러리 버전 변경 시 전부 깨질 수 있다. 렌더링 기본 책임을 라이브러리에 맡기거나, 라이브러리 없이 직접 SVG로 구현하는 편이 유지보수에 유리하다.

**CODE-2 — TaskForm이 내부에서 API를 직접 호출한다**

`fetchApplicants`, `fetchOwner`를 `TaskForm` 컴포넌트 내부에서 호출한다. 동일한 데이터를 부모 페이지에서도 이미 조회하므로 중복 요청이 발생한다. 담당자 목록은 부모에서 한 번 조회 후 props로 전달하면 된다.

**CODE-3 — 실시간 협업 미지원**

칸반 보드는 Socket.io로 실시간 동기화가 구현되어 있지만, WBS에는 전혀 없다. 여러 팀원이 동시에 WBS를 열면 한 명이 작업을 추가해도 다른 사람 화면에서는 갱신되지 않는다.

---

## 2. 재설계 방향

### 핵심 원칙

1. **"한 화면 = 하나의 주인공"** — 간트차트가 메인, 나머지는 보조
2. **"작업 편집은 한 경로로"** — 어디를 클릭해도 같은 사이드패널이 열린다
3. **"충돌은 차트 위에서 바로 보인다"** — 별도 배너 없이 시각적 표시
4. **"비개발자도 이해할 수 있는 언어"** — WBS → "일정 관리"

---

## 3. 새 레이아웃 설계

### 3-1. 페이지 구조 (After)

```
┌──────────────────────────────────────────────────┬──────────────────┐
│  [일정 관리]  [일 | 주 | 월]  [+ 작업 추가]        │  ← 툴바 (h-14)   │
├──────────────────────────────────────────────────┤                  │
│                                                  │  작업 상세 패널  │
│  간트차트 (Gantt Chart)                           │  (슬라이드인)    │
│                                                  │  - 작업명        │
│  [████ 기획] [███ 개발] [██ 테스트]               │  - 담당자        │
│  [██ 기획 ⚠충돌]                                  │  - 날짜          │
│                                                  │  - 진행률        │
│  ← 드래그로 날짜 조정 가능 →                      │  - 상태          │
│                                                  │  - 선행 작업     │
│                                                  │  - [저장] [삭제] │
├──────────────────────────────────────────────────┘                  │
│  작업 목록 (접기/펴기 가능, 기본 접힘)                               │
│  ▶ 작업 목록 보기 (총 12개 · 충돌 2건)                              │
└──────────────────────────────────────────────────────────────────────
```

### 3-2. 인터랙션 흐름 (After)

```
간트차트 작업 바 클릭
    └→ 오른쪽에 [작업 상세 패널] 슬라이드인
         ├ 작업명, 담당자, 날짜, 진행률, 상태 수정
         ├ 선행 작업(의존관계) 설정 (패널 내 섹션)
         └ [저장] / [삭제] 버튼

[+ 작업 추가] 버튼 클릭
    └→ 오른쪽에 [작업 상세 패널] 슬라이드인 (빈 폼)
         └ 작성 후 [저장]

간트차트 드래그
    └→ 날짜 범위 조정 (드래그 종료 시 자동 저장)

작업 목록 "▶ 작업 목록 보기" 클릭
    └→ 간트차트 아래 테이블 펼침 (간결한 읽기 전용 뷰)
         └ 테이블 행 클릭 → 작업 상세 패널 열기

충돌 표시
    └→ 별도 배너 없음
         └ 충돌 작업 바에 ⚠ 아이콘 + 주황색 테두리로 직접 표시
```

---

## 4. 컴포넌트별 재설계 명세

### 4-1. `WbsPage` (`/dashboard/[pid]/wbs/page.tsx`)

**변경 사항**

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 페이지 제목 | "WBS (Work Breakdown Structure)" | "일정 관리" |
| 레이아웃 | 수직 스택 (모든 컴포넌트 항상 표시) | Gantt(메인) + TaskPanel(슬라이드 사이드) |
| TaskForm | 인라인 (항상 표시) | 제거 → TaskPanel로 통합 |
| DependencySettingModal | 별도 팝업 | 제거 → TaskPanel 내 섹션으로 통합 |
| 충돌 통계 배너 | 항상 표시 (숫자만) | 제거 → 간트차트 내 시각 표시로 대체 |
| 담당자 로딩 | 페이지 + TaskForm 이중 호출 | 페이지에서 한 번만 조회 후 props 전달 |

**담당자 목록 조회 통합 (현재 2곳 → 1곳)**

```ts
// 페이지에서 한 번 조회
useEffect(() => {
  const loadMembers = async () => {
    const [projectRes, applicantsRes] = await Promise.all([
      fetch(`/api/projects/${pid}`),
      fetch(`/api/applications/by-project/${pid}`)
    ]);
    // 작성자 + 승인된 지원자 합산 후 중복 제거
    setProjectMembers(mergedMembers);
  };
  loadMembers();
}, [pid]);
```

---

### 4-2. `TaskPanel` (신규 — 작업 상세 + 편집 사이드패널)

기존 `TaskForm` + `DependencySettingModal`을 하나로 통합한 오른쪽 슬라이드인 패널.

**파일 위치**: `src/components/wbs/TaskPanel.tsx`

**Props**

```ts
type TaskPanelProps = {
  task: Task | null;          // null이면 신규 추가 모드
  tasks: Task[];              // 의존관계 선택용 전체 작업 목록
  projectMembers: Member[];   // 담당자 선택 목록 (부모에서 전달)
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
};
```

**섹션 구성**

```
┌─────────────────────────────────┐
│ ← 닫기   작업 상세              │
├─────────────────────────────────┤
│ 작업명 *               [input]  │
│ 단계/그룹              [input]  │
│ 담당자 *            [select]    │
│                                 │
│ 시작일 *    종료일 *             │
│ [date]      [date]              │
│                                 │
│ 마일스톤  □                     │
│                                 │
│ 설명                            │
│ [textarea]                      │
│─────────────────────────────────│
│ 진행 상태                       │
│ [대기] [진행 중] [완료]          │
│                                 │
│ 진행률  ████░░░░ 40%            │
│         [슬라이더]               │
│─────────────────────────────────│
│ 선행 작업 (의존관계)             │
│ + 선행 작업 추가                 │
│ [기획 완료  ▾FS ] [×]           │
│─────────────────────────────────│
│  ⚠ 일정 충돌: 담당자 홍길동이   │
│    3/12-3/15에 "기획" 작업과    │
│    겹칩니다.                    │
│─────────────────────────────────│
│          [삭제]    [저장]       │
└─────────────────────────────────┘
```

**핵심 동작 규칙**
- `task === null`이면 빈 폼 (신규 추가 모드)
- 패널이 열린 상태에서 간트차트의 다른 작업 클릭 → 해당 작업으로 전환
- 충돌 감지는 `담당자` 또는 `날짜` 변경 시 실시간으로 표시 (패널 하단)
- `[저장]` 클릭 시 충돌이 있어도 저장 가능 (경고만 표시)
- `[삭제]` 버튼은 수정 모드에서만 표시

---

### 4-3. `GanttChart` 리팩토링

현재 `gantt-task-react` 라이브러리를 사용하면서 DOM을 직접 조작하는 방식은 유지보수성이 떨어진다. 아래 두 가지 방향 중 선택한다.

**방향 A: 라이브러리 직접 제거 후 경량 SVG Gantt 직접 구현 (권장)**

`gantt-task-react`를 제거하고 SVG + React로 직접 렌더링한다. 현재 사용하는 기능이 제한적이므로 직접 구현이 현실적이다.

구현해야 할 기능 범위:
- 타임라인 헤더 (월·주·일 모드)
- 작업 바 (색상, 크기, 클릭, 드래그 날짜 조정)
- 마일스톤 (다이아몬드)
- 의존관계 화살표 (SVG line/path)
- 충돌 시 주황색 테두리 표시
- 오늘 날짜 세로선

**방향 B: 라이브러리 유지 + DOM 조작 코드 최소화**

DOM 직접 조작 코드(`setInterval`, `setTimeout`, SVG text 재생성)를 제거하고, `gantt-task-react`가 제공하는 공식 props만 사용하도록 제한한다. 단, 커스터마이징에 한계가 있다.

> **추천**: 방향 A. 현재 `gantt-task-react` 0.3.x는 오래된 버전이고 커스터마이징을 위해 이미 library internals를 직접 조작하고 있다. 유지보수 비용이 누적되는 것보다 지금 교체하는 편이 낫다.

**GanttChart 재구현 핵심 설계**

```
GanttChart
├── GanttHeader          — 날짜 헤더 (월/주/일)
├── GanttRows            — 작업별 행
│   ├── GanttBar         — 작업 바 (드래그 가능)
│   ├── GanttMilestone   — 마일스톤 다이아몬드
│   └── GanttConflict    — 충돌 표시 오버레이
├── GanttArrows          — 의존관계 화살표 (SVG)
└── GanttTodayLine       — 오늘 날짜 세로선
```

**충돌 시각화 변경**

```
현재: [⚠ 충돌 2건, 영향받는 작업자 1명] 배너 표시

변경: 간트차트 충돌 작업 바에 직접 표시
      ┌─────────────────────────┐
      │ ⚠ 기획 작업  홍길동     │  ← 주황 테두리 + 아이콘
      └─────────────────────────┘
      마우스 오버 시 툴팁: "3/12-3/15에 '디자인' 작업과 일정 충돌"
```

---

### 4-4. `TaskList` 개선

전면 표시에서 "접기/펴기 토글" 컴포넌트로 변경한다. 테이블을 항상 보여줄 필요가 없으며, 간트차트를 보는 동안 방해가 된다.

**변경 사항**

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 표시 방식 | 항상 표시 | 기본 접힘, 토글 클릭 시 펼침 |
| 편집 기능 | 인라인 (슬라이더, 상태 버튼) | 제거 → 행 클릭 시 TaskPanel 오픈 |
| 컬럼 수 | 9개 (과밀) | 5~6개 (읽기 전용 핵심 정보만) |
| 헤더 | "작업 목록" | "▶ 작업 목록 (12개 · 충돌 2건)" |

**간소화된 컬럼**

| 작업명 (충돌배지) | 단계 | 담당자 | 기간 | 진행률(바) | 상태 |
|-----------------|------|--------|------|-----------|------|

- 슬라이더, 상태 버튼, 편집/삭제 버튼을 테이블에서 제거
- 행 클릭 시 TaskPanel 열기 (편집은 패널에서)
- 진행률은 슬라이더가 아닌 정적인 컬러 바로 표시

---

## 5. 버그 수정 명세

아래 버그들은 리팩토링 전에 먼저 수정한다.

### FIX-1. 배치 삭제 의존관계 쿼리 오류 (필수)

**파일**: `src/app/api/wbs/tasks/batch/route.ts`

```ts
// ❌ 현재
Task.updateMany(
  { dependencies: { $in: ids } },
  { $pull: { dependencies: { $in: ids } } }
)

// ✅ 수정
Task.updateMany(
  { 'dependencies.taskId': { $in: ids } },
  { $pull: { dependencies: { taskId: { $in: ids } } } }
)
```

### FIX-2. API 응답 형식 통일 (필수)

**파일**: `src/app/api/wbs/tasks/route.ts`, `[taskId]/route.ts`, `batch/route.ts`

모든 WBS API 응답을 CLAUDE.md 컨벤션에 맞게 수정한다.

```ts
// GET /api/wbs/tasks
return NextResponse.json({ success: true, data: tasks })

// POST /api/wbs/tasks
return NextResponse.json({ success: true, data: task }, { status: 201 })

// PATCH /api/wbs/tasks/:id
return NextResponse.json({ success: true, data: updatedTask })

// DELETE /api/wbs/tasks/:id
return NextResponse.json({ success: true, message: '작업이 삭제되었습니다.' })
```

`wbsStore.ts`의 클라이언트 코드도 `res.data`를 읽도록 수정.

### FIX-3. addTask Optimistic Update 후 selectedTaskId 갱신

**파일**: `src/store/wbsStore.ts`

```ts
// 서버 응답 후 실제 ID로 교체할 때 selectedTaskId도 함께 갱신
set(state => ({
  tasks: state.tasks.map(t => t.id === tempTask.id ? savedTask : t),
  selectedTaskId: state.selectedTaskId === tempTask.id ? savedTask.id : state.selectedTaskId,
}))
```

### FIX-4. GanttChart 타이머 cleanup

**파일**: `src/components/wbs/GanttChart.tsx`

모든 `setInterval`, `setTimeout`, `MutationObserver`에 cleanup 추가.

```ts
useEffect(() => {
  const interval = setInterval(updateTextStyles, 800);
  return () => clearInterval(interval); // ← 반드시 추가
}, [tasks, viewMode]);

useEffect(() => {
  const observer = new MutationObserver(handleDarkModeChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect(); // ← 반드시 추가
}, []);
```

---

## 6. 구현 순서 (Phase)

> 각 Phase는 독립적으로 배포 가능한 단위로 구성한다.

### Phase 1 — 버그 수정 (즉시, 1~2일)

- [ ] **FIX-1**: 배치 삭제 의존관계 쿼리 수정 (`batch/route.ts`)
- [ ] **FIX-2**: WBS API 응답 형식 통일 (route.ts 전체)
- [ ] **FIX-3**: `addTask` Optimistic Update의 `selectedTaskId` 갱신
- [ ] **FIX-4**: GanttChart 타이머 cleanup 추가
- [ ] **FIX-5**: `TaskForm` 내 중복 API 호출 제거 (applicants → props로 받도록)

### Phase 2 — UX 핵심 개선 (1~2주)

- [ ] **TaskPanel 신규 구현** (`src/components/wbs/TaskPanel.tsx`)
  - 기존 `TaskForm` + `DependencySettingModal` 기능 통합
  - 오른쪽 슬라이드인 패널 형태
  - 신규/수정 모드 통합
  - 충돌 감지 패널 내 표시

- [ ] **WbsPage 레이아웃 재구성**
  - 충돌 통계 배너 제거
  - 인라인 `TaskForm` 제거 → `TaskPanel` 사용
  - `DependencySettingModal` 제거 → `TaskPanel` 사용
  - 페이지 제목 "WBS (Work Breakdown Structure)" → "일정 관리"
  - 담당자 조회 통합 (한 번만 호출)

- [ ] **TaskList 슬림화**
  - 접기/펴기 토글
  - 인라인 편집 컨트롤 제거 → 행 클릭 시 `TaskPanel` 열기
  - 컬럼 9개 → 6개로 축소

### Phase 3 — GanttChart 재구현 (2~3주)

- [ ] `gantt-task-react` 의존성 제거
- [ ] 커스텀 SVG 간트차트 구현
  - `GanttHeader` (일/주/월 뷰)
  - `GanttBar` (드래그로 날짜 조정)
  - `GanttMilestone` (다이아몬드)
  - `GanttArrows` (의존관계 화살표)
  - `GanttTodayLine` (오늘 날짜 세로선)
  - 충돌 작업 바 시각 표시 (주황 테두리 + 툴팁)

### Phase 4 — 실시간 협업 (선택, 추가 1주)

Socket.io를 활용하여 칸반 보드와 동일한 실시간 동기화 추가.

- [ ] `server.ts`에 WBS 전용 소켓 이벤트 추가
  ```
  join-wbs-project, leave-wbs-project
  task-created, task-updated, task-deleted
  ```
- [ ] `wbsStore.ts`에 소켓 초기화 / 이벤트 핸들러 추가
- [ ] WbsPage에 소켓 연결/해제 처리

---

## 7. 파일 변경 요약

### 삭제할 파일

```
src/components/wbs/TaskForm.tsx             → TaskPanel로 통합
src/components/wbs/DependencySettingModal.tsx → TaskPanel로 통합
```

### 새로 만들 파일

```
src/components/wbs/TaskPanel.tsx            → 작업 상세/편집 사이드패널
src/components/wbs/GanttBar.tsx             → 커스텀 간트 작업 바 (Phase 3)
src/components/wbs/GanttHeader.tsx          → 커스텀 간트 헤더 (Phase 3)
src/components/wbs/GanttArrows.tsx          → 의존관계 화살표 (Phase 3)
src/components/wbs/GanttChart.tsx           → 전면 재작성 (Phase 3)
```

### 수정할 파일

```
src/app/dashboard/[pid]/wbs/page.tsx        → 레이아웃 재구성, 담당자 조회 통합
src/components/wbs/TaskList.tsx             → 접기/펴기, 인라인 편집 제거
src/store/wbsStore.ts                       → API 응답 형식 대응, selectedTaskId 버그 수정
src/app/api/wbs/tasks/route.ts              → 응답 형식 통일
src/app/api/wbs/tasks/[taskId]/route.ts     → 응답 형식 통일
src/app/api/wbs/tasks/batch/route.ts        → 의존관계 쿼리 버그 수정 + 응답 형식 통일
```

---

## 8. 코딩 시 주의사항 (Claude AI Agent용)

1. **`TaskPanel`은 `'use client'`로 선언해야 한다.** useState, useEffect를 사용하는 클라이언트 컴포넌트다.

2. **담당자 목록은 `TaskPanel`에서 API를 호출하지 않는다.** 부모(WbsPage)에서 받은 `projectMembers` prop을 사용한다.

3. **의존관계 타입 드롭다운**은 `FS | SS | FF` 세 가지다. 표시 레이블은 아래를 따른다.
   - `FS` → "완료 후 시작 (FS)"
   - `SS` → "동시 시작 (SS)"
   - `FF` → "동시 완료 (FF)"

4. **TaskPanel 슬라이드인 애니메이션**은 Tailwind의 `translate-x-full` → `translate-x-0` 전환으로 구현한다.

5. **충돌 감지 함수**는 `src/lib/utils/`에 별도 파일(`wbsConflictUtils.ts`)로 분리한다. 현재 컴포넌트에 인라인으로 있는 `checkScheduleConflict`, `checkAllScheduleConflicts`, `generateAdjustmentSuggestions`를 옮긴다.

6. **WBS API 응답 형식 수정 후**, `wbsStore.ts`에서 데이터를 읽는 방식도 아래처럼 수정한다.
   ```ts
   // ❌ 현재
   const data = await res.json() // 배열/객체 직접
   set({ tasks: data.map(transformDoc) })

   // ✅ 수정
   const { success, data } = await res.json()
   if (!success) throw new Error(...)
   set({ tasks: data.map(transformDoc) })
   ```

7. **Phase 3 커스텀 간트차트**를 구현할 때, `gantt-task-react` import를 제거하기 전에 먼저 신규 컴포넌트를 완성하고 교체한다. 중간에 동작하지 않는 상태가 되지 않도록 한다.

8. **CLAUDE.md 코드 생성 체크리스트**를 매 파일 작성 전 확인한다.
