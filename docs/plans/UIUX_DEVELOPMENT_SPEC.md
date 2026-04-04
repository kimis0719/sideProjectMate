# UI/UX 전면 개편 — 개발 기획서

> 이 문서는 SPM(Side Project Mate)의 UI/UX 전면 개편을 위한 개발 기획서입니다.
> 코딩 에이전트가 이 문서를 읽고 순서대로 작업을 진행합니다.
>
> 작성일: 2026-04-02
> 디자인 에셋: `docs/assets` (HTML + PNG)
> 디자인 시스템: `docs/assets/DESIGN.md`

---

## 1. 확정된 결정사항

개발 전 반드시 숙지해야 할 프로젝트 레벨 결정사항입니다.

| 결정사항 | 내용 |
|----------|------|
| 다크모드 | **제외**. 라이트모드만 지원. ThemeProvider 관련 다크모드 코드 건드리지 않음 |
| 모바일 하단 탭 바 | **도입**. 프로젝트 / 대시보드 / 채팅 / 프로필 4개 |
| 하단 탭 바 노출 범위 | 메인 4개 페이지에서만 노출, 하위 페이지 진입 시 숨김 + ← 뒤로가기 |
| iOS Safe Area | `env(safe-area-inset-bottom)` 하단 탭 바에 적용 |
| 칸반 모바일 | 캔버스 미사용, 리스트 뷰로 전환 |
| 칸반 인박스 | 좌표 null이면 인박스 항목 (`item.x === null && item.y === null`) |
| 칸반 파스텔 컬러 | 유지. 스티커 메모 컨셉 유지하되 디자인 시스템 적용 |
| 관리자 페이지 | 현재 `/admin` 경로 유지, 서브도메인 분리 안 함 |
| 노트 마크다운 | 볼드, 이탤릭, 체크리스트, 넘버링만 지원. 헤딩/코드블록/인용문 미지원 |

---

## 2. 디자인 토큰 (tailwind.config 등록)

> 전체 작업의 기초. 이것부터 먼저 진행해야 합니다.

### 2-1. 컬러 토큰

`tailwind.config.js`의 `theme.extend.colors`에 아래 토큰을 등록합니다.

```
surface:                   #f9f9f8    ← 전체 배경 (베이스 레이어)
surface-bright:            #f9f9f8
surface-dim:               #dadad9
surface-container-lowest:  #ffffff    ← 카드, 인풋 배경 (컴포넌트 레이어)
surface-container-low:     #f3f4f3    ← 섹션 배경 (섹션 레이어)
surface-container-high:    #e8e8e7    ← 필터 칩 기본, 비활성 요소
surface-variant:           #e2e2e2
surface-tint:              #0053db

primary:                   #004ac6    ← 메인 액센트
primary-container:         #2563eb    ← CTA 버튼, 강조 영역
on-primary:                #ffffff
on-primary-container:      #eeefff
on-primary-fixed:          #00174b

secondary:                 #495c95
secondary-container:       #acbfff
on-secondary:              #ffffff
on-secondary-container:    #394c84

tertiary:                  #943700
tertiary-container:        #bc4800
tertiary-fixed:            #ffdbcd    ← 마감/종료 뱃지 배경 (40% opacity)

error:                     #ba1a1a    ← 에러, 위험 액션
error-container:           #ffdad6
on-error:                  #ffffff
on-error-container:        #93000a

on-surface:                #1a1c1c    ← 기본 텍스트 (#000 사용 금지)
on-surface-variant:        #434655    ← 보조 텍스트, 메타정보
on-background:             #1a1c1c
outline:                   #737686
outline-variant:           #c3c6d7    ← Ghost Border (15% opacity로만 사용)

inverse-surface:           #2f3130
inverse-on-surface:        #f1f1f0
inverse-primary:           #b4c5ff
```

### 2-2. 폰트

Google Fonts에서 Manrope, Inter를 로드합니다. Noto Sans KR은 기존에 있을 수 있으니 확인 후 추가.

```
fontFamily: {
  headline: ['Manrope', 'sans-serif'],      // 헤드라인, 섹션 타이틀
  body: ['Inter', 'sans-serif'],            // 본문, 라벨
  kr: ['Noto Sans KR', 'sans-serif'],       // 한국어 폴백
}
```

타이포그래피 스케일:

| 토큰 | 폰트 | 크기 | 굵기 | 용도 |
|------|------|------|------|------|
| display-lg | Manrope | 3.5rem | 700 | Hero 헤드라인 |
| headline-sm | Manrope | 1.5rem | 600 | 섹션 타이틀 |
| title-md | Inter | 1.125rem | 600 | 카드 제목, 프로젝트명 |
| body-md | Inter | 0.875rem | 400 | 본문, 설명 텍스트 |
| label-md | Inter | 0.75rem | 600 | 메타데이터, 상태 뱃지 (대문자) |

### 2-3. 쉐도우

```
boxShadow: {
  ambient: '0 20px 40px rgba(26, 28, 28, 0.04)',   // 플로팅 요소 전용
  modal: '0 20px 40px rgba(26, 28, 28, 0.08)',      // 모달
}
```

### 2-4. Border Radius

```
borderRadius: {
  lg: '0.5rem',    // 버튼, 카드 기본
  full: '9999px',  // 상태 뱃지 칩에만 사용
}
```

---

## 3. 핵심 디자인 규칙

### 3-1. No-Line Rule

**보더를 사용하지 않습니다.** 구조적 구분은 배경색 차이로만 표현합니다.

- 페이지 배경: `surface` (#f9f9f8)
- 섹션/그룹 배경: `surface-container-low` (#f3f4f3)
- 카드/인풋 배경: `surface-container-lowest` (#ffffff)

접근성을 위해 보더가 반드시 필요한 경우에만 Ghost Border 사용:
`outline-variant` (#c3c6d7) at **15% opacity**

### 3-2. 버튼 규칙

- Primary: `bg-primary-container text-on-primary rounded-lg`
- Tertiary: `bg-transparent text-primary` (취소, 부가 액션)
- Error: `bg-error text-on-error rounded-lg` (삭제, 위험 액션)
- Hover: 색상 변화가 아닌 **가로 4px 확장** (`hover:px-[calc(1rem+4px)]` 등)
- Border Radius: 항상 `lg` (0.5rem). `full`은 뱃지 칩에만 사용

### 3-3. 카드 규칙

- 배경: `surface-container-lowest` (#ffffff)
- 보더: 없음
- 패딩: `spacing-6` (1.5rem)
- Hover: 배경색 `surface-bright`로 전환 + ambient 쉐도우. 크기 변화 없음

### 3-4. 모달 규칙

- 배경 오버레이: glassmorphism (`backdrop-blur-[16px]`, surface 80% opacity)
- 모달 카드: `surface-container-lowest`, 패딩 1.5rem, `rounded-lg`
- 쉐도우: `shadow-modal`

### 3-5. 텍스트 컬러

- 기본 텍스트: `on-surface` (#1a1c1c). **순수 검정(#000) 사용 금지**
- 보조 텍스트: `on-surface-variant` (#434655)
- 링크/강조: `primary` (#004ac6)

---

## 4. 디자인 에셋 ↔ 소스 파일 매핑

### 4-1. 페이지 매핑

> **주의:** 프로젝트에 `(pages)` 라우트 그룹은 없습니다. 모든 페이지는 `src/app/` 직하에 위치합니다.

| 디자인 에셋 | 소스 파일 (페이지) | 줄 수 | 주요 컴포넌트 |
|------------|-------------------|------|-------------|
| `pages/01_landing_pc.html` | `src/app/page.tsx` | 41 | HeroSection, ProjectList, AdBanner |
| `pages/02_login_pc.html` | `src/app/login/page.tsx` | 368 | 이메일/소셜 로그인(GitHub, Google) |
| `pages/03_register_pc.html` | `src/app/register/page.tsx` | 704 | 이메일 인증, 비밀번호 강도, 약관 동의 |
| `pages/04_onboarding_pc.html` | `src/app/onboarding/page.tsx` | 236 | 3단계 위저드(도메인→협업→스케줄) |
| `pages/05_project_list_pc.html` | `src/app/projects/page.tsx` | 25 | ProjectList(380줄), ProjectCard(149줄), FilterBar |
| `pages/06_project_detail_pc.html` | `src/app/projects/[pid]/page.tsx` | 850 | 프로젝트 상세, 지원하기, 리뷰 |
| `pages/07_project_create_pc.html` | `src/app/projects/new/page.tsx` | 653 | 4단계 위자드, DnD 이미지 순서 |
| `pages/08_member_manage_pc.html` | `src/app/projects/[pid]/manage/page.tsx` | 388 | 지원자 관리, 멤버 목록 |
| `pages/09_dashboard_pc.html` | `src/app/dashboard/[pid]/page.tsx` | 350 | 실시간 동기화, 리소스, 멤버 위젯 |
| `pages/10_chat_pc.html` | `src/app/chat/page.tsx` | 249 | Socket.io 실시간 채팅, 읽지 않음 뱃지 |
| `pages/11_mypage_pc.html` | `src/app/mypage/page.tsx` | 314 | 지원 현황, 프로필 카드, 아바타 편집 |
| `pages/12_profile_edit_pc.html` | `src/app/profile/page.tsx` | 56 | ProfileView 컴포넌트 위임 |
| `pages/13_profile_view_pc.html` | `src/app/profile/[id]/page.tsx` | 72 | 읽기 전용 프로필, 본인/타인 분기 |
| `pages/14_terms_pc.html` | `src/app/terms/page.tsx` | 321 | 이용약관, TOC 사이드바 |
| `admin/01_admin_dashboard.html` | `src/app/admin/page.tsx` | 8 | AdminLayout + 하위 5개 페이지 |

### 4-2. 칸반 매핑

| 디자인 에셋 | 소스 파일 | 비고 |
|------------|----------|------|
| `kanban/01_kanban_canvas_pc.html` | `src/components/board/BoardShell.tsx` | 스타일만 참조 |
| `kanban/02_kanban_inbox_pc.html` | `src/components/board/InboxPanel.tsx` | **신규 생성** |
| `kanban/03_kanban_mobile.html` | `src/components/board/KanbanMobileView.tsx` | **신규 생성** |

### 4-3. 컴포넌트 매핑

| 디자인 에셋 | 대상 컴포넌트 |
|------------|-------------|
| `components/01_component_library_v1.html` | 이미지 업로더, 빈 상태 참조 |
| `components/02_component_library_v2.html` | 인풋, 셀렉트, 체크박스, 라디오, 슬라이더, 태그입력, 탭, 아바타, 토스트, 알림, 스켈레톤, 페이지네이션, 프로필카드, 확인모달 참조 |

### 4-4. 모달 매핑

| 디자인 에셋 내 모달 | 소스 파일 | 줄 수 |
|-------------------|----------|------|
| 지원하기 모달 | `src/components/projects/ApplyModal.tsx` | 176 |
| AI 지시서 모달 | `src/components/board/InstructionModal.tsx` | 435 |
| AI 히스토리 모달 | `src/components/board/HistoryModal.tsx` | 243 |
| 이미지 편집 모달 | `src/components/profile/modals/ImageEditModal.tsx` | 143 |
| 리뷰 작성 모달 | `src/components/projects/ReviewModal.tsx` | 271 |
| 리소스 추가 모달 | `src/components/dashboard/ResourceModal.tsx` | 663 |

---

## 5. 신규 기능 구현 스펙

### 5-1. 모바일 하단 탭 바

**파일:** `src/components/common/MobileTabBar.tsx` (신규 생성)

**구현:**
- 모바일(< 768px)에서만 표시, 데스크톱에서는 숨김
- 4개 탭: 프로젝트 (`/projects`), 대시보드 (`/dashboard`), 채팅 (`/chat`), 프로필 (`/profile`)
- 각 탭: 아이콘 + 라벨 (label-md)
- 활성 탭: primary 컬러 아이콘 + 텍스트
- 비활성 탭: on-surface-variant 컬러
- `env(safe-area-inset-bottom)` 패딩 적용 (iOS 대응)

**노출 조건:**
- 표시: `/projects`, `/dashboard`, `/chat`, `/profile` (정확히 이 4개 경로)
- 숨김: 하위 페이지 (`/projects/[pid]`, `/kanban/[pid]`, `/chat/[roomId]` 등)
- 숨김 시 해당 페이지 상단에 ← 뒤로가기 버튼 표시

**레이아웃 적용:**
- `src/app/layout.tsx` 또는 모바일 전용 레이아웃에서 조건부 렌더링
- 하단 탭 바 높이만큼 페이지 하단 패딩 확보 (콘텐츠 가림 방지)

### 5-2. 칸반 인박스 패널 (PC)

**파일:** `src/components/board/InboxPanel.tsx` (신규 생성)

**디자인 참조:** `kanban/02_kanban_inbox_pc.html`

**상태:**
- 접힌 상태 (기본): 캔버스 우측 가장자리에 세로 탭. 📥 아이콘 + 카운트 뱃지
- 펼친 상태: 280~300px 패널 슬라이드 오픈

**인박스 판별 로직:**
```ts
const isInboxItem = (item: INote | ISection) => item.x === null && item.y === null;
```

**패널 내부:**
- 노트 그룹 / 섹션 그룹으로 분리 표시
- 각 카드: 타입 아이콘 + 제목 + 작성자 아바타(소) + 생성 시간
- 노트 카드 좌측에 해당 노트 파스텔 컬러 바 (4px)
- [+ 빠른 메모] 버튼 하단
- ··· 메뉴: 편집 / 삭제 / (노트만) 컬러 변경

**캔버스 배치:**
- 인박스 카드 드래그 → 캔버스 드롭 → 해당 위치에 좌표 부여 (x, y, width, height 설정)
- 섹션 위 드롭 시 해당 섹션에 sectionId 자동 소속
- 배치 완료 시 인박스에서 제거

**소켓 연동:**
- 기존 `note-created`, `section-created` 이벤트 그대로 사용
- 좌표 null인 항목은 클라이언트에서 인박스로 라우팅
- 새 항목 도착 시: 접힌 상태면 뱃지 펄스, 펼친 상태면 상단에 "NEW" 뱃지 2초 표시

**AI 연동:**
- AI 지시서 생성 시 `buildAiContext`에서 인박스 항목 포함
- 형식: `## 인박스 (미배치 아이디어)\n- {제목} (노트, 작성자: {이름})`

**스토어 변경 (`src/store/boardStore.ts`):**
```ts
// 추가할 상태/액션
inboxOpen: boolean;
setInboxOpen: (open: boolean) => void;
// 인박스 노트/섹션은 기존 notes, sections 배열에서 isInboxItem으로 필터링
```

### 5-3. 칸반 모바일 리스트 뷰

**파일:** `src/components/board/KanbanMobileView.tsx` (신규 생성)

**디자인 참조:** `kanban/03_kanban_mobile.html`

**진입 조건:** 모바일(< 768px)에서 `/kanban/[pid]` 접근 시 `BoardShell` 대신 렌더링

**구조:**
- 상단: ← 뒤로가기 + "프로젝트 칸반" + ⚙️ 설정
- 탭: [📌 진행중 N] [✅ 완료 N] (기존 viewMode 스토어 활용)
- 인박스 섹션: 미배치 항목 있을 때만 표시, 아코디언 접기/펼치기
- 섹션 아코디언: 섹션명 + 노트 개수, 탭으로 접기/펼치기
- 노트 카드: 좌측 파스텔 컬러 바 + ☐ 완료 체크박스 + 제목 + 담당자 + 태그
- 미소속 노트: sectionId === null이고 좌표가 있는 노트들
- 하단 플로팅: [+ 노트] [+ 섹션] 버튼 → 좌표 null로 생성 → 인박스 진입

**노트 탭 인터랙션:**
- 노트 카드 탭 → 바텀시트로 상세 보기/편집 (내용 수정, 담당자 변경)
- 체크박스 탭 → 즉시 완료 처리 (기존 `completeNote` 액션)

**데이터:**
- `boardStore`의 기존 notes, sections 배열 그대로 사용
- 렌더링만 다르게 (캔버스 대신 리스트)

### 5-4. 노트 마크다운 첨삭

**파일:** 기존 `preprocessMarkdown` 함수가 있는 파일

**변경 내용:**

제거:
```ts
// 삭제: 헤딩 자동 보정 — 노트에서 헤딩 미지원
processed = processed.replace(/(^|\n)(#{1,6})([^ \n#])/g, '$1$2 $3');
```

유지:
```ts
// 유지: 볼드 공백 트림
processed = processed.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**');
// 유지: 들여쓰기 보존
processed = processed.replace(/^ +/gm, (match) => '&nbsp;'.repeat(match.length));
```

추가:
```ts
// 추가: 체크리스트 보정 — [] → [ ]
processed = processed.replace(/\[]/g, '[ ]');
// 추가: 넘버링 보정 — 1.텍스트 → 1. 텍스트
processed = processed.replace(/^(\d+\.)([^ \n])/gm, '$1 $2');
```

**렌더링 범위 제한:**
- 마크다운 렌더러에서 아래만 지원:
  - `**볼드**`, `*이탤릭*`
  - `- [ ] 체크리스트`, `- [x] 완료`
  - `1. 넘버링`
- 미지원 (일반 텍스트로 표시): `## 헤딩`, ` ``` 코드블록 ``` `, `> 인용문`, `| 테이블 |`

---

## 6. Phase별 상세 기획서 작성 — 필수 전제 조건

> **⚠️ 이 섹션은 Phase 3 개발 중 발생한 문제를 기반으로 추가되었습니다.**
> Phase 3(칸반 보드)는 본 기획서의 5줄짜리 작업 테이블만으로 개발을 시작했다가,
> 기획 미흡으로 인해 **전량 롤백** 후 별도 상세 기획서를 작성하여 재개발하였습니다.

### 6-1. 필수 규칙

**각 Phase의 개발을 시작하기 전에, 반드시 해당 Phase의 상세 분석·설계 기획서를 별도로 작성해야 합니다.**

본 문서(UIUX_DEVELOPMENT_SPEC.md)는 전체 개편의 **로드맵**이며,
각 Phase의 실제 개발 지시서가 아닙니다. 아래 작업 순서(섹션 7)의 테이블은 "무엇을 해야 하는가"만 정의하고,
"어떻게, 어떤 구조로, 어떤 상태에서" 해야 하는지는 Phase별 상세 기획서에서 정의합니다.

### 6-2. 개발 중 사용자 컨펌 규칙

**AI 에이전트가 자체적으로 UI/UX 판단을 내리지 않습니다.** 개발 도중 아래 상황이 발생하면 반드시 작업을 멈추고 사용자에게 선택지를 제시한 뒤 컨펌을 받아야 합니다.

| 상황 | 예시 | 대응 |
|------|------|------|
| **디자인 에셋과 현행 코드가 상충** | 에셋에는 3컬럼인데 현행은 2컬럼 | 선택지 제시 후 컨펌 |
| **레이아웃 구조 변경 여부** | 기존 단일 뷰를 탭/아코디언으로 바꿀지 | 선택지 제시 후 컨펌 |
| **에셋에 명시되지 않은 상태** | 빈 상태, 에러 상태, 로딩 상태의 UI | 현행 유지 or 새 디자인 제안 → 컨펌 |
| **모바일에서의 인터랙션 차이** | PC hover 효과를 모바일에서 어떻게 대체할지 | 선택지 제시 후 컨펌 |
| **컴포넌트 분리/통합 판단** | 기존 파일을 분리할지, 한 파일에서 수정할지 | 선택지 제시 후 컨펌 |
| **기존 기능의 동작 변경 가능성** | className 교체가 이벤트 핸들러에 영향을 줄 때 | 반드시 보고 후 컨펌 |

> 디자인 교체 작업은 "className만 바꾸면 된다"고 보이지만,
> 실제로는 레이아웃 구조 변경, 조건부 렌더링 수정 등이 수반되는 경우가 많습니다.
> **"확실하지 않으면 물어본다"**가 원칙입니다.

### 6-3. 상세 기획서에 반드시 포함할 내용

| 항목 | 설명 |
|------|------|
| **현재 구현 상태 분석** | 대상 파일별 현재 줄 수, 기존 기능 목록, 건드리면 안 되는 로직 |
| **작업 분류** | 각 항목을 `[디자인만 변경]` / `[기능 수정]` / `[신규 구현]`으로 분류 |
| **하위 컴포넌트 전수 파악** | 페이지가 위임하는 하위 컴포넌트를 모두 나열하고, 각각의 디자인 변경 범위를 개별 명시 (아래 6-6 참조) |
| **디자인 상세 스펙** | ASCII 레이아웃, Tailwind 클래스, 상태별(hover/active/disabled/error) 스타일 |
| **모바일 반응형 스펙** | PC용 HTML 에셋에 반응형 스타일이 포함되어 있으므로 대부분 자연스럽게 처리 가능하나, PC→모바일 전환 시 **구조가 크게 달라지는 부분**(split view → single view, 그리드 → 스택, 사이드바 → 아코디언 등)은 텍스트로 보완 명시할 것. **이 경우 Agent가 자체 판단하지 말고, 반드시 사용자에게 모바일 레이아웃 방향을 확인하고 추가 참고 디자인이나 레퍼런스가 있는지 요청한 뒤 진행할 것** |
| **데이터·스토어 변경** | 모델/API/스토어 변경 사항, 새 필드/엔드포인트 정의 |
| **소켓 이벤트** | 실시간 연동이 필요한 경우 이벤트명과 페이로드 |
| **테스트 케이스** | 각 작업 항목별 검증 기준 목록 |
| **절대 건드리지 않을 코드** | 성능·보안·인증 등 보호 대상 코드 명시 |

### 6-4. 좋은 예시 — Phase 3.5 기획서

Phase 3(칸반 보드)를 재설계할 때 작성한 상세 기획서가 모범 사례입니다:

- **파일:** `docs/plans/PHASE_3_5_KANBAN_2_0_SPEC.md`
- **분량:** ~1,000줄 (본 기획서의 Phase 3 테이블 5줄 → 200배 상세화)
- **특징:**
  - 모든 항목에 `[디자인만 변경]` / `[기능 수정]` / `[신규 구현]` 분류
  - PC/모바일 각각의 ASCII 레이아웃 + Tailwind 클래스 명시
  - 항목별 테스트 케이스 목록
  - "절대 건드리지 않을 코드" 명시
  - 작업 진행 규칙(사전 확인 → 컨펌 → 테스트 사이클) 정의
  - 소켓 이벤트, 모델 변경, API 변경 등 백엔드 스펙 포함

### 6-5. Phase별 상세 기획서 명명 규칙

| Phase | 상세 기획서 파일명 (예시) |
|-------|--------------------------|
| Phase 3 | `PHASE_3_5_KANBAN_2_0_SPEC.md` ✅ (작성 완료, 개발 완료) |
| Phase 4 | `PHASE_4_AUTH_ONBOARDING_SPEC.md` |
| Phase 5 | `PHASE_5_PROJECT_PAGES_SPEC.md` |
| Phase 6 | `PHASE_6_USER_CHAT_SPEC.md` |
| Phase 7 | `PHASE_7_MODALS_SPEC.md` |
| Phase 8 | `PHASE_8_INFO_ADMIN_SPEC.md` |
| Phase 9 | `PHASE_9_INTEGRATION_TEST_SPEC.md` |

> 모든 상세 기획서는 `docs/plans/` 디렉토리에 저장합니다.

### 6-6. 하위 컴포넌트 전수 파악 규칙

페이지 파일(page.tsx)의 줄 수가 적더라도, 실제 렌더링은 하위 컴포넌트에 위임되는 경우가 많습니다.
**상세 기획서 작성 시, 대상 페이지가 import하는 모든 하위 컴포넌트를 트리 구조로 나열하고, 각각에 대해 개별적으로 디자인 변경 범위를 정의해야 합니다.**

**대표 사례 — 프로필 페이지:**

`src/app/profile/page.tsx` (56줄)은 간단해 보이지만, 실제로는 `ProfileView.tsx` (471줄)에 위임하며 그 하위에 **15개 이상의 컴포넌트 트리**가 존재합니다:

```
ProfileView.tsx (471줄) ─ 메인 컨테이너
├── ProfileHeader.tsx (97줄)
├── DetailProfileCard.tsx (315줄)
├── StatusDashboard.tsx (159줄)
├── SkillSection.tsx (192줄)
│   └── SkillTier.tsx (85줄)
├── AvailabilityScheduler.tsx (196줄)
├── CommunicationStyleSlider.tsx (102줄)
├── ReviewSection.tsx (160줄)
├── PortfolioCard.tsx (176줄)
│   └── LinkInput.tsx (84줄)
├── ImageEditModal.tsx (143줄)
├── external/GitHubStats.tsx (287줄)
├── external/SolvedAcCard.tsx (379줄)
└── external/BlogPostCard.tsx (113줄)
    합계: ~2,860줄
```

이런 페이지에 대해 "프로필 편집 디자인 교체"라고만 하면 Phase 3의 참사가 반복됩니다.
**반드시 각 컴포넌트별로 현행 분석 → 디자인 변경점 정의 → 테스트 케이스를 작성해야 합니다.**

### 6-7. Phase 간 의존성 및 실행 순서

Phase 번호와 관계없이, **아래 권장 실행 순서**를 따라야 합니다.
모달(Phase 7)을 먼저 교체하지 않으면, 이후 페이지 작업 시 구버전 모달과 신버전 페이지가 공존하는 문제가 발생합니다.

**모달 → 페이지 의존 관계:**

| 모달 (Phase 7) | 사용하는 페이지 (Phase) |
|---|---|
| `ApplyModal` | `projects/[pid]/page.tsx` (Phase 5) |
| `ReviewModal` | `projects/[pid]/page.tsx` (Phase 5) |
| `ResourceModal` | `dashboard/[pid]/page.tsx` (Phase 5) |
| `ImageEditModal` | `profile/page.tsx`, `mypage/page.tsx` (Phase 6) |
| `InstructionModal` | `BoardShell.tsx` (Phase 3, ✅ 완료) |
| `HistoryModal` | `BoardShell.tsx` (Phase 3, ✅ 완료) |

**권장 실행 순서:**

```
                    ┌─── Phase 4 (인증/온보딩) ───────────────────┐
                    │    독립 — 모달 의존 없음                     │
                    │                                            │
Phase 1~3 (완료) ──►├─── Phase 7 (모달) ──►─── Phase 5 (프로젝트) ─┤──► Phase 9 (통합 점검)
                    │         │                                  │
                    │         └──────►─── Phase 6 (사용자/채팅) ──┤
                    │                                            │
                    └─── Phase 8 (정보/관리자) ──────────────────┘
                         독립 — 모달 의존 없음
```

**병행 작업 가능 분석:**

| 순서 | Phase | 병행 가능 | 조건 |
|------|-------|----------|------|
| 1차 | **Phase 4** + **Phase 7** + **Phase 8** | ✅ 3개 동시 가능 | 서로 파일 겹침 없음. 3명이 각각 담당 가능 |
| 2차 | **Phase 5** + **Phase 6** | ✅ 2개 동시 가능 | Phase 7 완료 후. 프로젝트와 사용자/채팅은 파일 겹침 없음 |
| 3차 | **Phase 9** | ❌ 단독 | 모든 Phase 완료 후 통합 점검 |

> **작업자 배분 예시:** 작업자 A가 Phase 7(모달)을 먼저 끝내면, 작업자 B(Phase 4 진행 중)와 작업자 C(Phase 8 진행 중)가 작업하는 동안 A는 Phase 5로 이동. Phase 4, 8 완료 후 B 또는 C가 Phase 6 담당.

---

## 7. 작업 순서

### Phase 1: 기반 세팅 (1일) ✅ 완료

| # | 작업 | 파일 |
|---|------|------|
| 1-1 | tailwind.config에 컬러/폰트/쉐도우 토큰 등록 | `tailwind.config.js` |
| 1-2 | Google Fonts 로드 (Manrope, Inter) | `src/app/layout.tsx` 또는 `_document` |
| 1-3 | 전역 기본 스타일 적용 (body 배경 surface, 텍스트 on-surface) | 글로벌 CSS |

### Phase 2: 공통 컴포넌트 교체 (2~3일) ✅ 완료

디자인 참조: `components/01_component_library_v1.html`, `components/02_component_library_v2.html`

| # | 작업 | 참조 |
|---|------|------|
| 2-1 | 버튼 스타일 교체 (Primary, Tertiary, Error) | DESIGN.md 버튼 규칙 |
| 2-2 | 텍스트 인풋, 텍스트에어리어, 셀렉트 스타일 교체 | 컴포넌트 라이브러리 v2 |
| 2-3 | 체크박스, 라디오, 슬라이더 스타일 교체 | 컴포넌트 라이브러리 v2 |
| 2-4 | 태그 입력(TagInput) 스타일 교체 | 컴포넌트 라이브러리 v2 |
| 2-5 | 카드 컴포넌트 No-Line Rule 적용 | DESIGN.md 카드 규칙 |
| 2-6 | 상태 뱃지 스타일 교체 | DESIGN.md Status Badges |
| 2-7 | 탭, 페이지네이션, 아바타 교체 | 컴포넌트 라이브러리 v2 |
| 2-8 | 토스트, 스켈레톤, 빈 상태 교체 | 컴포넌트 라이브러리 v1+v2 |
| 2-9 | 글로벌 헤더/푸터 교체 | 컴포넌트 라이브러리 v2 |
| 2-10 | 모달 기본 구조 (ConfirmModal) 교체 | 컴포넌트 라이브러리 v2 |
| 2-11 | 모바일 하단 탭 바 신규 생성 | 섹션 5-1 스펙 |

### Phase 3: 칸반 보드 (3~4일) ✅ 완료 → Phase 3.5로 재설계 후 개발 완료

> 본 Phase는 스펙 부족으로 롤백 후 `PHASE_3_5_KANBAN_2_0_SPEC.md`로 재설계하여 완료되었습니다.
> PR #234 (feature/231-kanban-2.0-redesign) 머지 완료.

| # | 작업 | 참조 |
|---|------|------|
| 3-1 | 칸반 디자인 다듬기 (배경, 노트/섹션 보더 제거, 폰트 교체) | `kanban/01_kanban_canvas_pc.html` |
| 3-2 | 인박스 패널 구현 | 섹션 5-2 스펙 + `kanban/02_kanban_inbox_pc.html` |
| 3-3 | 모바일 리스트 뷰 구현 | 섹션 5-3 스펙 + `kanban/03_kanban_mobile.html` |
| 3-4 | AI 플로팅 바 구현 (InstructionModal 진입점) | `kanban/01_kanban_canvas_pc.html` 하단 |
| 3-5 | 노트 마크다운 첨삭 | 섹션 5-4 스펙 |

> **⚠️ 아래 Phase들은 섹션 6-7의 권장 실행 순서에 따라 배치되었습니다.**
> Phase 번호는 유지하되, 실행 순서는 의존성을 고려하여 재배치합니다.

---

#### 1차 작업 그룹 (병행 가능 — 서로 파일 겹침 없음)

---

### Phase 4: 페이지 적용 — 인증/온보딩 (1~2일) 🏷️ 독립

> ⚠️ **전제 조건:** `docs/plans/PHASE_4_AUTH_ONBOARDING_SPEC.md` 상세 기획서 작성 후 개발 시작 (섹션 6 참조)
> 대상 파일 합계 ~1,350줄. 특히 회원가입(704줄)은 폼 밸리데이션·단계 전환 등 복잡도가 높아 상세 스펙 필수.
>
> **의존성:** 없음. 모달을 사용하지 않아 독립 실행 가능.

| # | 작업 | 소스 파일 | 디자인 참조 |
|---|------|----------|-----------|
| 4-1 | 랜딩 페이지 | `src/app/page.tsx` (41줄) | `pages/01_landing_pc.html` |
| 4-2 | 로그인 페이지 | `src/app/login/page.tsx` (368줄) | `pages/02_login_pc.html` |
| 4-3 | 회원가입 페이지 | `src/app/register/page.tsx` (704줄) | `pages/03_register_pc.html` |
| 4-4 | 온보딩 페이지 | `src/app/onboarding/page.tsx` (236줄) | `pages/04_onboarding_pc.html` |

### Phase 7: 모달 (1~2일) 🏷️ Phase 5·6의 선행 조건

> ⚠️ **전제 조건:** `docs/plans/PHASE_7_MODALS_SPEC.md` 상세 기획서 작성 후 개발 시작 (섹션 6 참조)
> 6개 모달 합계 ~1,930줄. 특히 **ResourceModal(663줄)**과 **InstructionModal(435줄)**은
> 미니 앱 수준의 복잡도이므로 개별 상세 스펙이 필수.
> 디자인 에셋이 `modals/01_modals_all.html` 1개에 통합되어 있어, 모달별 상태(로딩/에러/빈 상태)를 상세 기획서에서 보완해야 함.
>
> **의존성:** 없음. 단, **이 Phase를 Phase 5·6보다 먼저 완료해야** 신/구 디자인 공존 문제를 방지할 수 있음.

디자인 참조: `modals/01_modals_all.html`

| # | 작업 | 소스 파일 | 사용처 |
|---|------|----------|--------|
| 7-1 | 지원하기 모달 | `src/components/projects/ApplyModal.tsx` (176줄) | → Phase 5 `projects/[pid]` |
| 7-2 | AI 지시서 모달 | `src/components/board/InstructionModal.tsx` (435줄) | → Phase 3 ✅ 완료 |
| 7-3 | AI 히스토리 모달 | `src/components/board/HistoryModal.tsx` (243줄) | → Phase 3 ✅ 완료 |
| 7-4 | 이미지 편집 모달 | `src/components/profile/modals/ImageEditModal.tsx` (143줄) | → Phase 6 `profile`, `mypage` |
| 7-5 | 리뷰 작성 모달 | `src/components/projects/ReviewModal.tsx` (271줄) | → Phase 5 `projects/[pid]` |
| 7-6 | 리소스 추가 모달 | `src/components/dashboard/ResourceModal.tsx` (663줄) | → Phase 5 `dashboard/[pid]` |

### Phase 8: 정보/관리자 (1일) 🏷️ 독립

> ⚠️ **전제 조건:** `docs/plans/PHASE_8_INFO_ADMIN_SPEC.md` 상세 기획서 작성 후 개발 시작 (섹션 6 참조)
> 관리자 영역은 하위 페이지(users, projects, ai-settings, common-codes, tech-stacks)가 5개 존재.
> 대시보드 레이아웃만 변경할 것인지, 하위 페이지까지 포함인지 범위를 상세 기획서에서 확정해야 함.
>
> **의존성:** 없음. 독립 실행 가능.

| # | 작업 | 소스 파일 | 디자인 참조 |
|---|------|----------|-----------|
| 8-1 | 이용약관 페이지 | `src/app/terms/page.tsx` (321줄) | `pages/14_terms_pc.html` |
| 8-2 | 개인정보처리방침 | `src/app/privacy/page.tsx` | 위와 동일 템플릿 |
| 8-3 | 관리자 대시보드 레이아웃 | `src/app/admin/page.tsx` (8줄) + 하위 5개 페이지 | `admin/01_admin_dashboard.html` |

---

#### 2차 작업 그룹 (Phase 7 완료 후 병행 가능)

---

### Phase 5: 페이지 적용 — 프로젝트 (2~3일) 🏷️ Phase 7 완료 후

> ⚠️ **전제 조건:** `docs/plans/PHASE_5_PROJECT_PAGES_SPEC.md` 상세 기획서 작성 후 개발 시작 (섹션 6 참조)
> 대상 파일 합계 ~2,800줄. **프로젝트 상세(850줄), 프로젝트 생성(653줄)**은 Phase 3 칸반 수준의 복잡도.
> 하위 컴포넌트(ProjectList 380줄, ProjectCard 149줄 등)도 상세 스펙에 반드시 포함할 것.
>
> **의존성:** Phase 7 (ApplyModal, ReviewModal, ResourceModal이 프로젝트 페이지에서 사용됨)

| # | 작업 | 소스 파일 | 디자인 참조 |
|---|------|----------|-----------|
| 5-1 | 프로젝트 목록 | `src/app/projects/page.tsx` (25줄) + `src/components/projects/ProjectList.tsx` (380줄) + `ProjectCard.tsx` (149줄) | `pages/05_project_list_pc.html` |
| 5-2 | 프로젝트 상세 | `src/app/projects/[pid]/page.tsx` (850줄) | `pages/06_project_detail_pc.html` |
| 5-3 | 프로젝트 생성/수정 | `src/app/projects/new/page.tsx` (653줄) | `pages/07_project_create_pc.html` |
| 5-4 | 멤버 관리 | `src/app/projects/[pid]/manage/page.tsx` (388줄) | `pages/08_member_manage_pc.html` |
| 5-5 | 프로젝트 대시보드 | `src/app/dashboard/[pid]/page.tsx` (350줄) | `pages/09_dashboard_pc.html` |

### Phase 6: 페이지 적용 — 사용자/채팅 (2~3일) 🏷️ Phase 7 완료 후

> ⚠️ **전제 조건:** `docs/plans/PHASE_6_USER_CHAT_SPEC.md` 상세 기획서 작성 후 개발 시작 (섹션 6 참조)
> **채팅은 특히 위험.** Socket.io 실시간 UI + 모바일 반응형 전환(split view → single view) 스펙이 필수.
> 메시지 버블, 읽음 처리, 타이핑 인디케이터, 스크롤 동작 등 인터랙션 상세 정의 필요.
>
> **의존성:** Phase 7 (ImageEditModal이 프로필/마이페이지에서 사용됨)
>
> **⚠️ 하위 컴포넌트 주의 (섹션 6-6 참조):**
> 프로필 편집(56줄)은 `ProfileView.tsx`(471줄)에 위임하며, 그 하위에 15개+ 컴포넌트(합계 ~2,860줄)가 존재합니다.
> 상세 기획서에서 반드시 각 컴포넌트별 디자인 변경 범위를 개별 정의해야 합니다.

| # | 작업 | 소스 파일 | 디자인 참조 |
|---|------|----------|-----------|
| 6-1 | 채팅 페이지 (데스크톱 + 모바일) | `src/app/chat/page.tsx` (249줄) | `pages/10_chat_pc.html` |
| 6-2 | 마이페이지 | `src/app/mypage/page.tsx` (314줄) | `pages/11_mypage_pc.html` |
| 6-3 | 프로필 편집 | `src/app/profile/page.tsx` (56줄) → **실제: `ProfileView.tsx` (471줄) + 하위 15개 컴포넌트 (~2,860줄)** | `pages/12_profile_edit_pc.html` |
| 6-4 | 프로필 조회 | `src/app/profile/[id]/page.tsx` (72줄) → **ProfileView 공유** | `pages/13_profile_view_pc.html` |

---

#### 3차 작업 (모든 Phase 완료 후)

---

### Phase 9: 통합 점검 (1일)

> ⚠️ **전제 조건:** `docs/plans/PHASE_9_INTEGRATION_TEST_SPEC.md` 상세 기획서 작성 후 점검 시작 (섹션 6 참조)
> 각 Phase 상세 기획서의 테스트 케이스를 종합한 체크리스트를 작성해야 함.
>
> **의존성:** Phase 4, 5, 6, 7, 8 모두 완료 후.

| # | 작업 |
|---|------|
| 9-1 | 모바일 반응형 전체 점검 (breakpoint별 레이아웃) |
| 9-2 | 하단 탭 바 노출/숨김 전체 라우트 점검 |
| 9-3 | 칸반 인박스 ↔ 캔버스 드래그 배치 테스트 |
| 9-4 | 칸반 모바일 ↔ PC 실시간 동기화 테스트 |
| 9-5 | 기존 테스트 통과 확인 (`npm run test:run`) |

---

## 8. 작업 시 주의사항

### 절대 건드리지 않을 것

- `SectionItem.tsx`의 `childNodeCacheRef` / `childSectionCacheRef` DOM 캐시 구조 (성능 최적화 핵심)
- `boardStore.ts`의 temporal(zundo) 히스토리 주입 패턴 (`applyRemote*` 함수들)
- 칸반 드래그/리사이즈/줌 인터랙션 로직 (스타일만 변경)
- 인증 로직 (next-auth 설정)
- Socket.io 이벤트 구조 (기존 이벤트명 유지, 새 이벤트 추가만 허용)

### 디자인 적용 방식

- Stitch HTML을 **그대로 복붙하지 않습니다**
- HTML에서 Tailwind 클래스와 레이아웃 구조를 참조하여 기존 React 컴포넌트에 반영
- 기존 컴포넌트의 props, 상태 관리, 이벤트 핸들러는 유지하고 className만 교체
- 새 페이지가 아닌 이상 파일을 새로 만들지 않고 기존 파일 수정

### 코딩 컨벤션

- 기존 `conventions.md` 준수
- 모든 import에 `@/` 경로 별칭 사용
- `'use client'` 선언 규칙 준수
- `any` 타입 금지
- 한국어 주석 허용

---

## 9. 예상 일정 (권장 실행 순서 기준)

| 순서 | Phase | 작업 | 상태 | 병행 | 예상 기간 |
|------|-------|------|------|------|----------|
| — | 1 | 기반 세팅 | ✅ 완료 | — | 1일 |
| — | 2 | 공통 컴포넌트 | ✅ 완료 | — | 2~3일 |
| — | 3 | 칸반 보드 | ✅ 완료 (Phase 3.5) | — | 9~11일 (실제) |
| 1차 | **4** | 인증/온보딩 페이지 | 📋 상세 기획서 필요 | ⬅ 4·7·8 동시 가능 | 1~2일 |
| 1차 | **7** | 모달 | 📋 상세 기획서 필요 | ⬅ 4·7·8 동시 가능 | 1~2일 |
| 1차 | **8** | 정보/관리자 | 📋 상세 기획서 필요 | ⬅ 4·7·8 동시 가능 | 1일 |
| 2차 | **5** | 프로젝트 페이지 | 📋 상세 기획서 필요 | ⬅ 5·6 동시 가능 (Phase 7 완료 후) | 2~3일 |
| 2차 | **6** | 사용자/채팅 페이지 | 📋 상세 기획서 필요 | ⬅ 5·6 동시 가능 (Phase 7 완료 후) | 2~3일 |
| 3차 | **9** | 통합 점검 | 📋 상세 기획서 필요 | ❌ 단독 | 1일 |

**최적 일정 (3명 병행 시):**

| 주차 | 작업자 A | 작업자 B | 작업자 C |
|------|---------|---------|---------|
| 1주 전반 | Phase 7 (모달) | Phase 4 (인증/온보딩) | Phase 8 (정보/관리자) |
| 1주 후반~2주 | Phase 5 (프로젝트) | Phase 6 (사용자/채팅) | Phase 9 기획서 준비 |
| 2주 후반 | Phase 9 (통합 점검, 전원 참여) | | |

| 시나리오 | 예상 기간 |
|---------|----------|
| 1명 순차 작업 | 9~14일 (기획서 작성 포함 시 12~18일) |
| 2명 병행 | 6~9일 |
| 3명 병행 | 4~6일 |

> **참고:** Phase 3의 교훈으로 상세 기획서 작성 시간(Phase당 0.5~1일)을 고려하면 실제 일정은 더 늘어날 수 있습니다.
