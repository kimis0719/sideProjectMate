# Phase 3.5 — 칸반보드 2.0 개발 및 디자인 전면 개편

> 이 문서는 칸반보드의 디자인 전면 교체 + 신규 기능 구현을 위한 개발 기획서입니다.
> 코딩 에이전트는 이 문서를 처음부터 끝까지 읽은 후, 작업 단위별로 순서대로 진행합니다.
>
> 작성일: 2026-04-03
> 디자인 에셋 위치: `docs/design/kanban_final/`
> - `pc_inbox_close/` — PC 칸반 (인박스 닫힘)
> - `pc_inbox_open/` — PC 칸반 (인박스 열림)
> - `mo_todo/` — 모바일 칸반 (진행중 탭)
> - `mo_done/` — 모바일 칸반 (완료 탭)
> 각 폴더에 `screen.png` (스크린샷)과 `code.html` (Stitch 생성 HTML) 포함

---

## 작업 진행 규칙 (반드시 준수)

### 규칙 1: 기능별 사전 확인

각 작업 항목을 시작하기 전에, 해당 기능이 아래 세 가지 중 어디에 해당하는지 사용자에게 보고하고 컨펌을 받습니다.

- **[디자인만 변경]** — 기능은 이미 구현되어 있고, CSS/Tailwind 클래스만 교체
- **[기능 수정]** — 기능이 일부 구현되어 있지만, 디자인 변경과 함께 로직 수정이 필요
- **[신규 구현]** — 현재 코드에 없는 완전히 새로운 기능

사용자 컨펌 없이 작업을 시작하지 않습니다.

### 규칙 2: 디자인 상충 시 자체 판단 금지

디자인 에셋(screen.png, code.html)과 현재 소스코드 사이에 요구사항이 부족하거나 상충된다고 판단될 때:
- 작업을 중단합니다
- 현재 상황(어떤 부분이 상충하는지, 어떤 선택지가 있는지)을 사용자에게 공유합니다
- 사용자가 방향을 지정해주면 그때 진행합니다

### 규칙 3: 기능 완료 → 테스트 → 컨펌 사이클

하나의 작업 항목이 끝날 때마다:
1. 사용자에게 "로컬에서 직접 테스트해보세요"라고 보고합니다
2. 해당 기능에서 예상되는 인터랙션 테스트 케이스를 목록으로 설명합니다
3. 사용자가 E2E 테스트 후 발견한 버그/수정점을 알려주면, 해당 버그를 먼저 수정합니다
4. 사용자가 "확인 완료"라고 컨펌하면 다음 작업으로 넘어갑니다

---

## 현재 구현 상태 분석

### 이미 구현된 기능 (PR #177 기준)

| 기능 | 파일 | 상태 |
|------|------|------|
| 노트 완료/되돌리기 (개별) | NoteModel.ts, NoteItem.tsx, boardStore.ts | ✅ 구현됨 |
| 노트 status 필드 (active/done) | NoteModel.ts | ✅ DB 필드 추가됨 |
| 노트 completedAt 필드 | NoteModel.ts | ✅ DB 필드 추가됨 |
| 노트 completionNote 필드 | NoteModel.ts | ✅ DB 필드 추가됨 |
| 진행중/완료 탭 전환 (viewMode) | BoardShell.tsx, boardStore.ts | ✅ 구현됨 |
| 완료 체크박스 (hover 시 표시) | NoteItem.tsx | ✅ 구현됨 |
| 되돌리기 버튼 | NoteItem.tsx | ✅ 구현됨 |
| 완료 뷰 읽기 전용 모드 (isDoneView) | NoteItem.tsx | ✅ 구현됨 |
| 섹션 중첩 (1단계) | SectionModel.ts, SectionItem.tsx | ✅ 구현됨 |
| parentSectionId, depth 필드 | SectionModel.ts | ✅ DB 필드 추가됨 |
| zIndex 3단 계층 | BoardShell.tsx | ✅ 구현됨 |
| 부모 섹션 드래그 시 자식 연동 | SectionItem.tsx, boardStore.ts | ✅ 구현됨 |
| 자식 섹션 자동 캡처/릴리즈 | SectionItem.tsx | ✅ 구현됨 |
| 삭제 시 캐스케이드/승격 | sections/[id]/route.ts | ✅ 구현됨 |
| status 필터 API | notes/route.ts | ✅ 구현됨 |
| 완료/되돌리기 소켓 이벤트 | server.ts | ✅ 구현됨 |
| 줌 컨트롤러 | ZoomController 컴포넌트 | ✅ 기존 구현 |
| 미니맵 | Minimap 컴포넌트 | ✅ 기존 구현 |

### 미구현 기능 (이번 Phase에서 구현 필요)

| 기능 | 분류 | 비고 |
|------|------|------|
| 섹션 완료 처리 (일괄 완료) | [신규 구현] | SectionModel에 status, completedAt 추가 필요 |
| 인박스 패널 (PC) | [신규 구현] | InboxPanel.tsx 신규 생성 |
| 모바일 리스트 뷰 | [신규 구현] | KanbanMobileView.tsx 신규 생성 |
| AI 플로팅 바 | [신규 구현] | 하단 중앙 AI ASSISTANT 버튼 |
| 노트 마크다운 첨삭 | [기능 수정] | preprocessMarkdown 함수 변경 |
| 완료 뷰 페이드 효과 | [기능 수정] | 기존 isDoneView에 시각적 처리 추가 |
| 완료 날짜 표시 | [기능 수정] | completedAt을 화면에 렌더링 |
| 2단 헤더 구조 | [디자인만 변경] | 글로벌 + 칸반 전용 헤더 |
| 섹션/노트 스타일 교체 | [디자인만 변경] | 파스텔 + dashed border + 쉐도우 |
| 캔버스 배경 | [디자인만 변경] | dot-grid 패턴 적용 |
| 하단 컨트롤 바 레이아웃 변경 | [디자인만 변경] | 줌/AI/미니맵 배치 변경 |

---

## PC 칸반 — 디자인 상세 스펙

> 디자인 참조: `pc_inbox_close/screen.png`, `pc_inbox_open/screen.png`
> HTML 참조: `pc_inbox_close/code.html`, `pc_inbox_open/code.html`

### PC-1. 2단 헤더 구조

**분류: [디자인만 변경]**

기존 칸반은 단일 헤더를 사용합니다. 새 디자인은 2단 헤더입니다.

**1단 — 글로벌 헤더 (높이 64px, `h-16`)**

```
┌──────────────────────────────────────────────────────────────┐
│ ⚡ Side Project Mate    프로필  프로젝트  [대시보드]  관리자    │
│                                    🌙  💬  🔔•  [C▾]        │
└──────────────────────────────────────────────────────────────┘
```

- 좌측: 로고(파란 bolt 아이콘 + "Side Project Mate" 텍스트)
- 중앙: 메뉴 (프로필 / 프로젝트 / 대시보드 / 관리자)
  - 현재 활성 메뉴("대시보드"): `bg-blue-50 text-blue-600 px-4 py-1.5 rounded-lg font-bold`
  - 비활성: `text-zinc-600 hover:text-zinc-900`
- 우측: 다크모드 아이콘(비활성, 표시만) + 채팅 아이콘 + 알림 아이콘(빨간 점) + 유저 아바타(파란 원, 이니셜) + 드롭다운 화살표
- 배경: `bg-white`, 하단에 `shadow-sm`

**2단 — 칸반 전용 헤더 (높이 64px, `h-16`)**

```
┌──────────────────────────────────────────────────────────────┐
│ Project Board #26   📌진행중 3  ✅완료 17  👤+2               │
│                        [📄지시서] [🕐히스토리] [?]  │[+노트추가] [+섹션추가]│
└──────────────────────────────────────────────────────────────┘
```

- 좌측: 보드 타이틀 ("Project Board" bold + "#26" 회색) + 상태 뱃지들 + 멤버 아바타 그룹
  - 진행중 뱃지: `bg-red-50 text-red-600` + 📌 아이콘 + 숫자
  - 완료 뱃지: `bg-green-50 text-green-600` + ✅ 아이콘 + 숫자
  - 멤버 아바타: `-space-x-2` 겹침 + "+N" 뱃지
- 우측: 액션 버튼들
  - [📄 지시서]: `bg-[#7c3aed] text-white` (보라색, InstructionModal 열기)
  - [🕐 히스토리]: `bg-orange-50 text-orange-600` (HistoryModal 열기)
  - [?]: `text-zinc-400` (도움말)
  - 구분선 (`h-6 w-px bg-zinc-200`)
  - [+ 노트 추가]: `bg-blue-600 text-white` (노트 생성)
  - [+ 섹션 추가]: `bg-blue-600 text-white` (섹션 생성)
- 배경: `bg-white/80 backdrop-blur-md`, 상단에 `border-t border-zinc-100`

**레이아웃 적용:**
- 두 헤더 모두 `fixed top-0 w-full z-50`
- 캔버스 영역은 `pt-32` (64px + 64px = 128px 패딩)

**현재 코드와의 차이:**
- 기존 BoardShell.tsx의 헤더를 2단으로 분리
- 진행중/완료 탭이 기존에는 탭 형태였는데, 새 디자인에서는 뱃지 형태로 변경 (탭 전환 기능은 유지하되 UI만 변경)
- [지시서], [히스토리] 버튼이 헤더로 이동 (기존에는 다른 위치에 있었을 수 있음)

**테스트 케이스:**
- 글로벌 헤더의 메뉴 클릭 시 정상 라우팅
- 진행중/완료 뱃지 클릭 시 viewMode 전환
- [+ 노트 추가] 클릭 시 노트 생성
- [+ 섹션 추가] 클릭 시 섹션 생성
- [지시서] 클릭 시 InstructionModal 열림
- [히스토리] 클릭 시 HistoryModal 열림
- 스크롤 시 헤더 고정 유지 확인

---

### PC-2. 캔버스 영역

**분류: [디자인만 변경]**

**배경:**
- dot-grid 패턴 적용
- CSS: `background-image: radial-gradient(#d1d1d1 1px, transparent 1px); background-size: 24px 24px;`
- 기본 배경색: `bg-surface` (#f9f9f8)

**캔버스 크기:**
- `min-w-[2000px] min-h-[2000px]` (기존 무한 캔버스 유지)
- 내부 패딩: `p-12`

**현재 코드와의 차이:**
- 배경색/패턴만 변경, 캔버스 로직(드래그, 줌, 팬)은 그대로 유지

---

### PC-3. 섹션 디자인

**분류: [디자인만 변경]**

기존 섹션 스타일을 새 디자인으로 교체합니다.

**섹션 컨테이너:**
```css
.canvas-section {
  border: 2px dashed rgba(0,0,0,0.1);
  background-color: rgba(243, 244, 243, 0.2);
  border-radius: 1rem; /* rounded-2xl */
  padding: 1.5rem; /* p-6 */
}
```

**섹션별 색상 구분:**
- 디자인에서 섹션마다 dashed border 색상이 다릅니다 (blue-200, purple-200, green-200)
- 기존 섹션의 `color` 필드를 활용하여 border 색상 매핑
- 예시: `color: 'blue'` → `border-blue-200`, `color: 'purple'` → `border-purple-200`

**섹션 헤더:**
```
┌──────────────────────────────────────┐
│ 할 일들                           ✕  │
│                                      │
│  (노트들...)                         │
│                                      │
│                                   ↘  │  ← 리사이즈 핸들
└──────────────────────────────────────┘
```
- 좌측: 섹션 타이틀 (`text-base font-bold`, 섹션 색상에 맞는 text 컬러)
- 우측: ✕ 닫기/삭제 버튼 (`text-zinc-400 hover:text-zinc-600`)
- 우하단: 리사이즈 핸들 (`south_east` Material 아이콘, `text-zinc-300`)

**현재 코드와의 차이:**
- SectionItem.tsx의 className만 교체
- 기존 보더 스타일 → dashed border + 반투명 배경
- 리사이즈 핸들 아이콘 변경
- 드래그/리사이즈 로직은 절대 변경하지 않음

---

### PC-4. 노트(스티커 메모) 디자인

**분류: [디자인만 변경]**

**노트 스타일:**
```css
.sticky-note {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 0.5rem; /* rounded-lg */
  padding: 1.5rem; /* p-6 */
  cursor: grab;
}
.sticky-note:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 10;
}
```

**파스텔 컬러 매핑 (기존 color 필드 활용):**
| color 값 | 배경색 | Tailwind |
|----------|--------|----------|
| yellow | #fef9c3 | `bg-[#fef9c3]` |
| green | #dcfce7 | `bg-[#dcfce7]` |
| pink | #fce7f3 | `bg-[#fce7f3]` |
| blue | #dbeafe | `bg-[#dbeafe]` |
| purple | #f3e8ff | `bg-[#f3e8ff]` |

**노트 내부 구조:**
```
┌──────────────────────┐
│ 노트 텍스트        ⋮  │  ← ··· 메뉴 (more_vert 아이콘)
│                      │
│                      │
│                   ↘  │  ← 리사이즈 핸들
└──────────────────────┘
```
- 텍스트: `text-[15px] font-medium leading-relaxed text-zinc-800`
- ··· 메뉴: `text-zinc-400 text-lg` (hover 시 메뉴 표시)
- 리사이즈 핸들: `text-zinc-400 text-base`, hover 시 `text-blue-500`

**완료 체크박스 (기존 기능, 디자인 조정):**
- hover 시 노트 좌측 상단에 체크박스 표시 (기존 동작 유지)
- 체크 시 즉시 완료 처리

**현재 코드와의 차이:**
- NoteItem.tsx의 className 교체
- 보더 제거 → box-shadow 전환
- hover 효과 추가 (scale + shadow)
- 드래그/편집/메뉴 로직은 절대 변경하지 않음

---

### PC-5. 인박스 패널 — 닫힌 상태

**분류: [신규 구현]**

**파일:** `src/components/board/InboxPanel.tsx` (신규 생성)

**위치:** 캔버스 우측 고정 (`fixed right-0 top-32 bottom-0`)

**닫힌 상태 레이아웃:**
```
┌──────┐
│  📥  │  ← inbox 아이콘 (text-blue-600)
│ (12) │  ← 빨간 뱃지 (항목 수)
│      │
│  I   │
│  N   │  ← 세로 텍스트 "INBOX"
│  B   │     [writing-mode: vertical-lr, rotate: 180deg]
│  O   │     text-[13px] font-black text-zinc-400 tracking-widest uppercase
│  X   │
│      │
│  ‹   │  ← 열기 버튼 (하단)
└──────┘
```

**너비:** `w-14` (56px)
**배경:** `bg-white border-l border-zinc-200`
**쉐도우:** `shadow-[-2px_0_8px_rgba(0,0,0,0.02)]`

**빨간 뱃지:**
- 인박스 항목 수 (x === null && y === null인 노트 + 섹션 수)
- `absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full`
- 항목 0개면 뱃지 숨김

**클릭/열기:** 아이콘 영역 또는 하단 ‹ 버튼 클릭 시 펼친 상태로 전환

**인박스 판별 로직:**
```ts
const isInboxItem = (item: { x: number | null; y: number | null }) =>
  item.x === null && item.y === null;
```

**스토어 연동:**
- `boardStore.ts`에 `inboxOpen: boolean` 상태 추가
- `setInboxOpen: (open: boolean) => void` 액션 추가
- 인박스 노트/섹션은 기존 `notes`, `sections` 배열에서 `isInboxItem`으로 필터링

**테스트 케이스:**
- 인박스 아이콘 클릭 시 펼침 상태 전환
- 인박스 항목 0개일 때 뱃지 숨김 확인
- 인박스 항목 추가 시 뱃지 카운트 실시간 업데이트
- 캔버스와 겹치지 않는지 확인 (z-index)

---

### PC-6. 인박스 패널 — 펼친 상태

**분류: [신규 구현]**

**파일:** 위와 동일 `InboxPanel.tsx`

**펼친 상태 레이아웃:**
```
┌──────────────────────┐
│ 📥 INBOX   12 Items > │  ← 헤더 (> = 닫기 화살표)
│                       │
│ ┌─ 신규 아이디어 (2) ─┐ │  ← 섹션 그룹 (dashed border, 파란)
│ │ 🟡 실시간 채팅 SDK  │ │     카드: 좌측 컬러바 + 제목 + 시간 + ⠿
│ │    2h ago        ⠿ │ │
│ │ 🩷 결제 연동 초안   │ │
│ │    5h ago        ⠿ │ │
│ └────────────────────┘ │
│                       │
│ ┌─ 참고 레퍼런스 (2) ──┐ │  ← 섹션 그룹 (dashed border, 초록)
│ │ 🟢 UI 인터랙션 캡처 │ │
│ │    Yesterday     ⠿ │ │
│ └────────────────────┘ │
│                       │
│ (고아 노트도 여기 표시)  │  ← sectionId === null인 인박스 노트
│                       │
└──────────────────────┘
```

**패널 스펙:**
- 너비: 약 280px (디자인 참조)
- 배경: `bg-white`
- 좌측 경계: `border-l border-zinc-200`
- 애니메이션: 우측에서 슬라이드 인 (`transition-transform duration-300`)

**헤더:**
- "📥 INBOX" (📥 = Material inbox 아이콘 text-blue-600)
- "12 Items" 카운트 (`text-zinc-400`)
- ">" 닫기 화살표 (클릭 시 접힌 상태로 전환)

**섹션 그룹 (인박스 내 섹션):**
- 인박스에 있는 섹션(x/y === null)은 dashed border 컨테이너로 표시
- 각 섹션 컨테이너:
  - `p-3 rounded-xl border-2 border-dashed`
  - 섹션 색상에 따라 border 컬러 변경 (blue-200, green-200 등)
  - 배경: 해당 색상의 50/30 opacity (예: `bg-green-50/30`)
- 섹션 헤더: 섹션 타이틀 (bold, 색상 맞춤) + 카운트 뱃지
- 하위에 해당 섹션에 소속된 인박스 노트 카드들

**인박스 카드 (노트):**
```css
.inbox-card {
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02);
}
```
- 배경: `bg-white rounded-lg p-3`
- 좌측: `border-l-4` + 노트 파스텔 컬러 (예: `border-[#fef9c3]`)
- 제목: `text-xs text-zinc-700 font-medium leading-snug`
- 하단: 시간 (`text-[9px] text-zinc-400`) + 드래그 인디케이터 (⠿ `drag_indicator` 아이콘)
- hover: `-translate-y-0.5` (살짝 올라가는 효과)
- 커서: `cursor-grab active:cursor-grabbing`

**고아 노트 (sectionId === null인 인박스 노트):**
- 섹션 컨테이너 밖에 개별 카드로 표시
- "미소속 노트" 라벨 아래에 나열

**드래그 앤 드롭 (인박스 → 캔버스):**
- 인박스 카드를 드래그하여 캔버스 위에 드롭
- 드롭 위치의 x, y 좌표를 계산하여 노트/섹션에 좌표 부여
- 기존 섹션 위에 드롭 시 해당 섹션에 sectionId 자동 소속
- 빈 캔버스에 드롭 시 고아 노트/최상위 섹션으로 생성
- 배치 완료 시 인박스에서 제거 (좌표가 null이 아니게 되므로 자동 필터링)

**드래그 앤 드롭 (캔버스 → 인박스):**
- 캔버스의 노트/섹션을 인박스 패널 위로 드래그하면 좌표를 null로 변경
- 인박스로 이동됨

**드래그 앤 드롭 (인박스 내부):**
- 인박스 내에서 노트를 다른 섹션으로 이동 가능 (sectionId 변경)
- 섹션 밖으로 드래그 시 고아 노트화 (sectionId = null, 좌표는 여전히 null)

**소켓 연동:**
- 다른 사용자(주로 모바일)가 인박스에 항목 추가 시:
  - 접힌 상태: 뱃지 카운트 업데이트 + 뱃지 짧은 펄스 애니메이션
  - 펼친 상태: 새 카드가 해당 섹션 상단에 추가

**테스트 케이스:**
- 인박스 열기/닫기 토글
- 인박스 내 섹션 그룹별로 노트가 올바르게 분류되는지
- 인박스 카드 → 캔버스 드래그 드롭 시 좌표 부여 확인
- 캔버스 노트 → 인박스 드래그 시 좌표 null 확인
- 인박스 내부에서 노트를 다른 섹션으로 드래그 이동
- 다른 사용자가 모바일에서 노트 생성 시 실시간 인박스 업데이트
- 고아 노트(sectionId null)가 올바르게 표시되는지

---

### PC-7. 하단 컨트롤 바

**분류: [디자인만 변경] + [신규 구현] (AI 버튼)**

**위치:** `fixed bottom-8 left-8 right-8 z-50`
**레이아웃:** 3개 영역 (좌측, 중앙, 우측)

**좌측 — 줌 컨트롤:**
```
┌──────────────────────────┐
│  −  109%  +  │  FIT      │
└──────────────────────────┘
```
- 배경: `bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-100`
- 줌 레벨 표시: `text-[13px] font-bold text-zinc-500`
- FIT 버튼: `text-[11px] font-black text-blue-600 tracking-widest`
- 기존 ZoomController 컴포넌트의 스타일만 교체

**중앙 — AI 어시스턴트 [신규 구현]:**
```
┌──────────────────────────────────────────┐
│  🤖 AI ASSISTANT ⚡  │  🔍 ZOOM  🗺 MINIMAP │
└──────────────────────────────────────────┘
```
- 배경: `bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-50`
- AI 버튼: `bg-blue-600 text-white px-6 py-3.5 rounded-xl`
  - 🤖 smart_toy 아이콘 (filled)
  - "AI ASSISTANT" `text-[11px] uppercase font-black tracking-widest`
  - ⚡ bolt 아이콘 (yellow-300, hover 시 pulse 애니메이션)
  - 클릭 시 InstructionModal 열기
- 구분선 (`h-8 w-[1px] bg-zinc-200`)
- ZOOM 버튼: `text-zinc-400 hover:text-zinc-800` + zoom_in 아이콘 + "ZOOM" 라벨
- MINIMAP 버튼: `text-zinc-400 hover:text-zinc-800` + map 아이콘 + "MINIMAP" 라벨

**우측 — 미니맵:**
```
┌────────────────────────┐
│  (캔버스 축소 미리보기)   │
│  [뷰포트 인디케이터]     │  ← 현재 보고 있는 영역
└────────────────────────┘
```
- `w-56 h-36 bg-zinc-50/80 backdrop-blur border border-zinc-200 rounded-2xl shadow-2xl`
- 내부에 dot-grid 패턴 (opacity-20)
- 섹션/노트를 미니 블록으로 표시 (색상 매칭)
- 뷰포트 인디케이터: `border-[1.5px] border-blue-500 rounded-lg bg-blue-50/5`
- 우상단에 접기/펼치기 토글
- 기존 Minimap 컴포넌트의 스타일 교체

**테스트 케이스:**
- 줌 +/−/FIT 동작 확인
- AI ASSISTANT 클릭 시 InstructionModal 열림
- ZOOM/MINIMAP 버튼 클릭 시 해당 기능 토글
- 미니맵에서 캔버스 현재 위치가 정확히 표시되는지
- 하단 바가 캔버스 컨텐츠를 가리지 않는지

---

### PC-8. 완료 뷰 (진행중/완료 탭 전환)

**분류: [기능 수정]**

기존에 진행중/완료 탭 전환이 구현되어 있습니다. 새 디자인에 맞게 수정합니다.

**전환 방식:**
- 2단 헤더의 진행중/완료 뱃지를 클릭하여 전환
- 진행중 뱃지 클릭 → `viewMode: 'active'`
- 완료 뱃지 클릭 → `viewMode: 'done'`

**완료 뷰에서의 시각적 처리:**
- 전체 캔버스에 페이드 효과 적용: 배경이 약간 어두워짐 (`bg-gray-100` 또는 opacity 변경)
- 완료된 노트:
  - 텍스트에 취소선 (`line-through`)
  - 전체 opacity 낮춤 (`opacity-60` 정도)
  - 체크박스가 체크된 상태(✅)로 표시
  - completedAt 날짜 표시: "2024.05.14 완료" (`text-[11px] text-zinc-400`)
- 완료된 섹션:
  - 섹션 타이틀에 취소선
  - 섹션 전체 opacity 낮춤
  - 섹션 타이틀 옆에 ✅ 체크 아이콘
- 헤더의 [+ 노트 추가] [+ 섹션 추가] 버튼:
  - disabled 처리 (`opacity-50 pointer-events-none`)
  - 라벨을 "읽기 전용"으로 변경하거나 버튼 자체를 "읽기 전용" 뱃지로 대체

**되돌리기:**
- 완료 뷰에서 노트 클릭 시 되돌리기 UI 표시 (기존 구현)
- 되돌리면 진행중 탭으로 복귀

**테스트 케이스:**
- 진행중 → 완료 탭 전환 시 완료된 노트만 표시
- 완료 뷰에서 노트의 취소선 + 페이드 + 완료 날짜 확인
- 완료 뷰에서 [+ 노트 추가] 버튼이 비활성화(또는 "읽기 전용")인지
- 완료 뷰에서 노트 드래그 불가 확인
- 되돌리기 후 진행중 탭에 노트가 복귀하는지

---

## 모바일 칸반 — 디자인 상세 스펙

> 디자인 참조: `mo_todo/screen.png`, `mo_done/screen.png`
> HTML 참조: `mo_todo/code.html`, `mo_done/code.html`

### MO-1. 진입 조건 및 파일 구조

**분류: [신규 구현]**

**파일:** `src/components/board/KanbanMobileView.tsx` (신규 생성)

**진입 조건:** 화면 너비 < 768px에서 `/kanban/[pid]` 접근 시 기존 `BoardShell`(캔버스) 대신 이 컴포넌트를 렌더링합니다.

```tsx
// BoardShell.tsx 또는 kanban/[pid]/page.tsx에서
const isMobile = useMediaQuery('(max-width: 767px)');
return isMobile ? <KanbanMobileView /> : <BoardShell />;
```

**데이터:** `boardStore`의 기존 notes, sections 배열을 그대로 사용. 렌더링만 다릅니다.

---

### MO-2. 상단 바

**분류: [신규 구현]**

```
┌─────────────────────────────┐
│ ←   Project Board        ⚙️  │
└─────────────────────────────┘
```

- 좌측: ← 뒤로가기 (`text-[#2563eb]`, 클릭 시 이전 페이지)
- 중앙: "Project Board" (`text-xl font-bold tracking-tight text-slate-900`)
- 우측: ⚙️ 설정 아이콘 (`text-[#2563eb]`)
- `fixed top-0 w-full z-50 h-16`
- 하단에 `bg-black/5 h-[1px]` 구분선

---

### MO-3. 진행중/완료 탭

**분류: [신규 구현]**

```
┌─────────────────────────────┐
│  [📌 진행중  24]  ✅ 완료 12  │
└─────────────────────────────┘
```

- 컨테이너: `bg-surface-container-low p-1 rounded-xl`
- 활성 탭: `bg-[#2563eb] text-white shadow-sm rounded-lg py-2.5`
  - 카운트: `bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold`
- 비활성 탭: `text-on-surface-variant rounded-lg py-2.5`
  - 카운트: `bg-surface-container-high px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500`

**동작:**
- 진행중 탭 클릭 → `viewMode: 'active'` → 진행중 콘텐츠 표시
- 완료 탭 클릭 → `viewMode: 'done'` → 완료 콘텐츠 표시

---

### MO-4. 인박스 섹션 (진행중 탭)

**분류: [신규 구현]**

인박스 항목(x/y === null)이 있을 때만 표시됩니다.

```
┌─────────────────────────────┐
│ 📥 ☐  인박스 (3)          ∧  │  ← 접기/펼치기
│                              │
│ 📁 기획 리뷰 요청        ✏️ ≡  │  ← 인박스 내 섹션 (폴더)
│ ┌───────────────────────────┐│
│ │🟡 API 엔드포인트 명세서    ││  ← 노트 카드
│ │  ☐                        ││     좌측 컬러바 + 체크박스
│ │  👤 김철수   HIGH PRIORITY ││     담당자 + 태그
│ └───────────────────────────┘│
│                              │
│ 📁 디자인 에셋           ✏️ ≡  │  ← 인박스 내 또 다른 섹션
│ ┌───────────────────────────┐│
│ │🔵 메인 배너 리소스 전달    ││
│ │  ☐                        ││
│ │  👤 이영희       ASSETS    ││
│ └───────────────────────────┘│
└─────────────────────────────┘
```

**인박스 컨테이너:**
- `rounded-2xl bg-[#e2e4e2] overflow-hidden`
- 헤더: 📥 inbox 아이콘 (`text-[#2563eb]`) + ☐ 체크박스 (섹션 일괄 완료용) + "인박스 (N)" + ∧/∨ 접기/펼치기

**인박스 내 섹션 (폴더):**
- 📁 folder_open 아이콘 + 섹션 타이틀 (`text-xs font-bold text-slate-700`)
- ✏️ 편집 버튼 + ≡ 드래그 핸들 (`drag_handle`)
- 하위 노트 카드들 (`pl-2` 들여쓰기)

**노트 카드:**
```
┌───────────────────────────────┐
│🟡│ ☐  API 엔드포인트 명세서    │
│  │     👤 김철수  HIGH PRIORITY │
└───────────────────────────────┘
```
- 좌측: 컬러 바 (`absolute left-0 top-3 bottom-3 w-1 rounded-r-full`, 노트 color에 따라 색상)
  - yellow → `bg-yellow-400`
  - blue → `bg-blue-500`
  - green → `bg-green-500`
  - pink → `bg-rose-500`
- 체크박스: `w-5 h-5 rounded-md border-2 border-outline-variant` (탭 시 완료 처리)
- 제목: `text-[15px] font-medium text-slate-900 leading-snug`
- 담당자: 아바타(20px) + 이름 (`text-[11px] text-slate-500`)
- 태그: `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase` + 색상별 배경
- 전체 카드: `bg-surface-container-lowest rounded-xl p-4 shadow-sm`
- 탭 → 바텀시트로 상세 보기/편집

**테스트 케이스:**
- 인박스 접기/펼치기 동작
- 인박스 항목이 0개일 때 인박스 섹션 자체가 숨겨지는지
- 노트 체크박스 탭 시 완료 처리
- 노트 카드 탭 시 상세 바텀시트 열림
- 인박스 내 섹션별로 노트가 올바르게 그룹핑되는지

---

### MO-5. 섹션 아코디언 (진행중 탭)

**분류: [신규 구현]**

캔버스의 섹션을 아코디언 형태로 표시합니다. 좌표가 있는(인박스가 아닌) 섹션들입니다.

```
┌─────────────────────────────┐
│ ▾  ☐  백엔드 리팩토링 (3) ··· │  ← 섹션 헤더
│                              │
│ ┌───────────────────────────┐│
│ │🟢 DB 마이그레이션 스크립트  ││  ← 노트 카드 (MO-4와 동일 구조)
│ │  ☐  👤 박지민        DEV   ││
│ └───────────────────────────┘│
│ ┌───────────────────────────┐│
│ │🔴 레거시 오더 시스템 아키... ││
│ │  ☐  👤 최수아       DOCS   ││
│ └───────────────────────────┘│
└─────────────────────────────┘

▶  ☐  UI 컴포넌트 고도화 (5)    ← 접힌 섹션
```

**섹션 헤더:**
- ▾/▶ 접기/펼치기 아이콘 (`arrow_drop_down` / `arrow_right`)
- ☐ 체크박스 (섹션 일괄 완료)
- 섹션 타이틀 + 노트 개수 (`text-[15px] font-bold text-slate-900`)
- ··· 메뉴 (`more_horiz`, 탭 시 편집/삭제 옵션)

**섹션 일괄 완료:**
- 섹션 헤더의 체크박스 탭 시 → 해당 섹션 내 모든 노트를 일괄 완료
- 확인 다이얼로그 표시: "백엔드 리팩토링 섹션의 노트 3개를 모두 완료 처리하시겠습니까?"
- 확인 시 모든 노트 status → 'done', completedAt → 현재 시간
- 섹션 자체도 완료 상태로 전환 (섹션 status → 'done', completedAt → 현재 시간)

**노트 카드:** MO-4의 노트 카드와 동일 구조

**테스트 케이스:**
- 섹션 접기/펼치기 동작
- 섹션 체크박스 탭 시 확인 다이얼로그 표시
- 확인 시 섹션 내 모든 노트 + 섹션 자체 완료 처리
- 완료 처리 후 진행중 뷰에서 해당 섹션/노트 사라짐
- ··· 메뉴에서 섹션 편집/삭제 동작

---

### MO-6. 완료 탭 뷰

**분류: [신규 구현]**

완료 탭 클릭 시 표시되는 화면입니다.

**전체 시각 처리:**
- 배경색 변경: `bg-[#f1f5f1]` (약간 다른 톤, 아카이브 느낌)
- 모든 텍스트/카드에 페이드 효과

**완료된 인박스:**
```
┌─────────────────────────────┐
│ ✅ ☑  완료된 인박스 (3)    ∧  │
│                              │
│ 📁 기획 리뷰 요청             │
│ ┌───────────────────────────┐│
│ │ ✅ A̶P̶I̶ ̶엔̶드̶포̶인̶트̶ ̶명̶세̶서̶    ││  ← 취소선 + 페이드
│ │    👤 김철수  2024.05.14 완료││  ← 완료 날짜 표시
│ └───────────────────────────┘│
└─────────────────────────────┘
```

**완료된 섹션:**
```
✅ ☑  백̶엔̶드̶ ̶리̶팩̶토̶링̶ (2)         ← 섹션도 취소선 + 체크

┌───────────────────────────────┐
│ ✅ D̶B̶ ̶마̶이̶그̶레̶이̶션̶ ̶스̶크̶립̶트̶    │  ← 노트 취소선
│    👤 박지민   2024.05.10 완료 │  ← 완료 날짜
└───────────────────────────────┘
```

**완료 카드 스타일:**
- 체크박스: 체크된 상태 (✅, `bg-blue-600 text-white`)
- 제목: `line-through` 취소선 + `text-slate-400` (페이드)
- 담당자: `opacity-50`
- 완료 날짜: `text-[11px] text-slate-400` "YYYY.MM.DD 완료"
- 전체 카드: `opacity-70` 또는 `bg-surface-container-low` (페이드된 배경)

**ARCHIVED 섹션 (오래된 완료 항목):**
- 일부 섹션에 "ARCHIVED" 라벨 표시 가능 (선택적)

**하단 플로팅 버튼 영역:**
- 진행중 탭의 [+ 노트] [+ 섹션] 대신
- [🔒 읽기 전용] 비활성 뱃지 표시 (`opacity-50 pointer-events-none`)

**되돌리기:**
- 완료된 노트 카드를 탭하면 바텀시트에서 [↩️ 되돌리기] 버튼 표시
- 되돌리면 진행중 탭으로 복귀 (노트 status → 'active', completedAt → null)

**테스트 케이스:**
- 완료 탭 전환 시 완료된 항목만 표시
- 모든 완료 노트에 취소선 + 페이드 + 완료 날짜 확인
- 완료 섹션에 취소선 + 체크 아이콘 확인
- [+ 노트] [+ 섹션] 버튼이 "읽기 전용"으로 비활성화
- 완료 노트 탭 → 되돌리기 동작
- 되돌린 노트가 진행중 탭에 다시 나타나는지

---

### MO-7. 플로팅 버튼 (진행중 탭)

**분류: [신규 구현]**

```
                        [📦 + 섹션]
                        [✏️ + 노트]
```

- 우측 하단 고정 (`fixed bottom-24 right-6`, 하단 탭 바 위)
- [+ 섹션]: `bg-white text-slate-700 border border-slate-200 rounded-xl px-5 py-3 shadow-lg`
  - 📦 아이콘 + "+ 섹션"
- [+ 노트]: `bg-[#2563eb] text-white rounded-xl px-5 py-3 shadow-lg`
  - ✏️ 아이콘 + "+ 노트"
- 클릭 시 간단 입력 바텀시트: 제목만 입력 → 생성 → **좌표 null로 생성 → 인박스 진입**

**테스트 케이스:**
- [+ 노트] 탭 시 입력 바텀시트 열림
- 제목 입력 후 생성 시 인박스에 노트 추가
- 생성된 노트의 x, y가 null인지 확인
- PC에서 동시 접속 시 인박스에 실시간 표시되는지
- [+ 섹션] 동일 테스트

---

### MO-8. 하단 탭 바

**분류: [신규 구현]**

```
┌─────────────────────────────┐
│ 프로젝트  대시보드  채팅  프로필 │
└─────────────────────────────┘
```

- **주의:** 칸반은 하위 페이지이므로 하단 탭 바를 표시하지 않습니다
- 칸반 모바일 뷰에서는 하단 탭 바 대신 플로팅 버튼(MO-7)이 표시됩니다
- 이 항목은 칸반이 아닌 글로벌 컴포넌트이므로 여기서는 "칸반에서 숨김 처리"만 확인합니다

**디자인의 BOARD/SEARCH/CHAT/PROFILE과의 차이:**
- 디자인 에셋에는 BOARD/SEARCH/CHAT/PROFILE로 되어있지만, 확정된 명칭은 **프로젝트/대시보드/채팅/프로필**입니다
- 이 명칭으로 구현합니다

---

## 공통 기능 — 섹션 완료 처리

**분류: [신규 구현]**

### SEC-1. 모델 변경

**파일:** `src/lib/models/kanban/SectionModel.ts`

현재 SectionModel에 status, completedAt 필드가 없습니다. 추가합니다.

```ts
status: {
  type: String,
  enum: ['active', 'done'],
  default: 'active',
},
completedAt: {
  type: Date,
  default: null,
},
```

### SEC-2. API 변경

**파일:** `src/app/api/kanban/sections/[id]/route.ts`

PATCH에 섹션 완료/되돌리기 지원:
- `status: 'done'` → completedAt 자동 설정
- `status: 'active'` → completedAt = null

**섹션 일괄 완료 시:**
1. 섹션 status → 'done', completedAt → now
2. 해당 섹션의 모든 노트 status → 'done', completedAt → now
3. 응답에 변경된 노트 ID 목록 포함

**파일:** `src/app/api/kanban/sections/batch/route.ts` (신규 또는 기존 batch 확장)

### SEC-3. 스토어 변경

**파일:** `src/store/boardStore.ts`

```ts
// 추가할 액션
completeSection: (sectionId: string) => void;
// 내부 로직: 섹션 status='done' + 하위 노트 전부 status='done'
revertSection: (sectionId: string) => void;
// 내부 로직: 섹션 status='active' + 하위 노트 전부 status='active'
```

### SEC-4. 소켓 이벤트

**파일:** `server.ts`

```
'section-completed' → { sectionId, completedAt, noteIds: string[] }
'section-reverted'  → { sectionId, noteIds: string[] }
```

### SEC-5. GET API 변경

**파일:** `src/app/api/kanban/sections/route.ts`

GET에 status 필터 지원:
```
GET /api/kanban/sections?boardId={id}&status=active
GET /api/kanban/sections?boardId={id}&status=done
```

**테스트 케이스:**
- 섹션 완료 시 해당 섹션 + 하위 노트 전부 done 상태
- 섹션 되돌리기 시 섹션 + 하위 노트 전부 active 복귀
- completedAt 날짜가 정확히 저장되는지
- 소켓으로 다른 사용자에게 실시간 반영
- 완료 탭에서 완료된 섹션이 올바르게 표시

---

## 공통 기능 — 노트 마크다운 첨삭

**분류: [기능 수정]**

### MD-1. preprocessMarkdown 함수 변경

**파일:** preprocessMarkdown 함수가 있는 파일 (확인 필요)

**제거:**
```ts
// 삭제: 헤딩 자동 보정 — 노트에서 헤딩 미지원
processed = processed.replace(/(^|\n)(#{1,6})([^ \n#])/g, '$1$2 $3');
```

**유지:**
```ts
// 유지: 볼드 공백 트림
processed = processed.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**');
// 유지: 들여쓰기 보존
processed = processed.replace(/^ +/gm, (match) => '&nbsp;'.repeat(match.length));
```

**추가:**
```ts
// 추가: 체크리스트 보정 — [] → [ ]
processed = processed.replace(/\[]/g, '[ ]');
// 추가: 넘버링 보정 — 1.텍스트 → 1. 텍스트
processed = processed.replace(/^(\d+\.)([^ \n])/gm, '$1 $2');
```

### MD-2. 렌더링 범위 제한

**지원 문법:** 볼드(`**`), 이탤릭(`*`), 체크리스트(`- [ ]`, `- [x]`), 넘버링(`1.`)
**미지원 (일반 텍스트로 표시):** 헤딩(`##`), 코드블록(` ``` `), 인용문(`>`), 테이블(`| |`)

마크다운 렌더러에서 미지원 문법의 렌더링을 비활성화합니다.

**테스트 케이스:**
- `**볼드**` 입력 시 볼드 렌더링
- `*이탤릭*` 입력 시 이탤릭 렌더링
- `- [ ] 할일` 입력 시 체크리스트 렌더링
- `- [x] 완료` 입력 시 체크된 체크리스트 렌더링
- `1. 항목` 입력 시 넘버링 렌더링
- `## 헤딩` 입력 시 일반 텍스트로 표시 (헤딩 렌더링 안 됨)
- `[]` 입력 시 `[ ]`로 자동 보정
- `1.텍스트` 입력 시 `1. 텍스트`로 자동 보정

---

## 작업 순서 총정리

아래 순서대로 진행합니다. 각 단계가 끝날 때마다 규칙 3(테스트 → 컨펌 사이클)을 수행합니다.

```
Step 1: PC 캔버스 디자인 기반 ──────────────────────────
  1-1  캔버스 배경 dot-grid 적용                    [디자인만 변경]
  1-2  섹션 스타일 교체 (dashed border + 색상)       [디자인만 변경]
  1-3  노트 스타일 교체 (파스텔 + shadow + hover)    [디자인만 변경]
  → 사용자 테스트 & 컨펌

Step 2: PC 헤더 ───────────────────────────────────────
  2-1  2단 헤더 구조 구현                           [디자인만 변경]
  2-2  진행중/완료 뱃지 전환 UI                      [기능 수정]
  2-3  지시서/히스토리 버튼 헤더 이동                 [디자인만 변경]
  → 사용자 테스트 & 컨펌

Step 3: PC 하단 컨트롤 바 ─────────────────────────────
  3-1  줌 컨트롤 스타일 교체                         [디자인만 변경]
  3-2  AI ASSISTANT 플로팅 버튼 구현                 [신규 구현]
  3-3  미니맵 스타일 교체                            [디자인만 변경]
  → 사용자 테스트 & 컨펌

Step 4: 섹션 완료 기능 ────────────────────────────────
  4-1  SectionModel에 status, completedAt 추가       [신규 구현]
  4-2  섹션 완료/되돌리기 API                        [신규 구현]
  4-3  boardStore에 completeSection/revertSection     [신규 구현]
  4-4  소켓 이벤트 추가                              [신규 구현]
  → 사용자 테스트 & 컨펌

Step 5: PC 완료 뷰 ───────────────────────────────────
  5-1  완료 뷰 페이드 효과 적용                      [기능 수정]
  5-2  완료 노트 취소선 + 완료 날짜 표시              [기능 수정]
  5-3  완료 섹션 시각적 처리                         [기능 수정]
  5-4  완료 뷰에서 생성 버튼 비활성화/읽기전용        [기능 수정]
  → 사용자 테스트 & 컨펌

Step 6: PC 인박스 패널 ────────────────────────────────
  6-1  InboxPanel.tsx 신규 생성 (닫힌 상태)          [신규 구현]
  6-2  인박스 펼친 상태 구현                         [신규 구현]
  6-3  인박스 → 캔버스 드래그 드롭                   [신규 구현]
  6-4  캔버스 → 인박스 드래그 드롭                   [신규 구현]
  6-5  인박스 내부 드래그 (섹션 간 이동)              [신규 구현]
  6-6  소켓 실시간 업데이트 연동                     [신규 구현]
  → 사용자 테스트 & 컨펌

Step 7: 모바일 리스트 뷰 — 진행중 ─────────────────────
  7-1  KanbanMobileView.tsx 기본 구조               [신규 구현]
  7-2  상단 바 + 탭                                 [신규 구현]
  7-3  인박스 섹션 (폴더 + 노트 카드)                [신규 구현]
  7-4  섹션 아코디언                                [신규 구현]
  7-5  노트 카드 (체크박스 + 컬러바 + 담당자 + 태그)  [신규 구현]
  7-6  섹션 일괄 완료 (체크박스)                     [신규 구현]
  7-7  노트 탭 → 상세 바텀시트                      [신규 구현]
  7-8  플로팅 버튼 (+ 노트, + 섹션)                  [신규 구현]
  → 사용자 테스트 & 컨펌

Step 8: 모바일 리스트 뷰 — 완료 ───────────────────────
  8-1  완료 탭 전환                                 [신규 구현]
  8-2  완료 노트/섹션 페이드 + 취소선 + 날짜          [신규 구현]
  8-3  읽기 전용 모드 (생성 버튼 비활성화)            [신규 구현]
  8-4  되돌리기 기능                                [신규 구현]
  → 사용자 테스트 & 컨펌

Step 9: 노트 마크다운 첨삭 ────────────────────────────
  9-1  preprocessMarkdown 함수 수정                  [기능 수정]
  9-2  렌더링 범위 제한                              [기능 수정]
  → 사용자 테스트 & 컨펌

Step 10: 통합 점검 ────────────────────────────────────
  10-1  PC ↔ 모바일 실시간 동기화 테스트
  10-2  인박스 PC ↔ 모바일 양방향 테스트
  10-3  섹션 완료 → 양쪽 반영 테스트
  10-4  기존 테스트 스위트 통과 확인 (npm run test:run)
  → 최종 컨펌
```

---

## 절대 건드리지 않을 코드

| 파일 | 이유 |
|------|------|
| `SectionItem.tsx`의 `childNodeCacheRef` / `childSectionCacheRef` | DOM 캐시 성능 최적화 핵심 |
| `boardStore.ts`의 temporal(zundo) 히스토리 패턴 (`applyRemote*`) | Undo/Redo 동기화 로직 |
| 칸반 드래그/리사이즈/줌 인터랙션 로직 | 스타일만 변경, 로직 불변 |
| next-auth 인증 설정 | 칸반과 무관 |
| Socket.io 기존 이벤트명 | 기존 이벤트 유지, 새 이벤트만 추가 |

---

## 예상 일정

| Step | 작업 | 예상 기간 |
|------|------|----------|
| 1 | PC 캔버스 디자인 기반 | 0.5일 |
| 2 | PC 헤더 | 0.5일 |
| 3 | PC 하단 컨트롤 바 | 0.5일 |
| 4 | 섹션 완료 기능 | 1일 |
| 5 | PC 완료 뷰 | 0.5일 |
| 6 | PC 인박스 패널 | 2~3일 |
| 7 | 모바일 진행중 뷰 | 2~3일 |
| 8 | 모바일 완료 뷰 | 1일 |
| 9 | 마크다운 첨삭 | 0.5일 |
| 10 | 통합 점검 | 1일 |
| **합계** | | **9~11일** |
