# Phase 8 — 정보/관리자 페이지 UI/UX 디자인 교체 상세 기획서

> 이슈: #262
> 작성일: 2026-04-06
> 디자인 에셋: `docs/assets/pages/14_terms_pc.html`, `docs/assets/admin/01_admin_dashboard.html`
> 상위 문서: `docs/plans/UIUX_DEVELOPMENT_SPEC.md` Phase 8

---

## 1. 범위 및 대상 파일 전수 목록

### 1-1. 이용약관 / 개인정보처리방침

| 파일 | 줄 수 | 분류 |
|------|-------|------|
| `src/app/terms/page.tsx` | 322 | `[디자인만 변경]` |
| `src/app/privacy/page.tsx` | 534 | `[디자인만 변경]` |

**합계: 856줄**

### 1-2. 관리자 영역 — 페이지

| 파일 | 줄 수 | 분류 |
|------|-------|------|
| `src/app/admin/layout.tsx` | 31 | `[디자인만 변경]` |
| `src/app/admin/page.tsx` | 8 | 변경 없음 (위임만) |
| `src/app/admin/users/page.tsx` | 16 | `[디자인만 변경]` |
| `src/app/admin/projects/page.tsx` | 16 | `[디자인만 변경]` |
| `src/app/admin/tech-stacks/page.tsx` | 16 | `[디자인만 변경]` |
| `src/app/admin/common-codes/page.tsx` | 16 | `[디자인만 변경]` |
| `src/app/admin/ai-settings/page.tsx` | 9 | 변경 없음 (위임만) |

### 1-3. 관리자 영역 — 컴포넌트

| 파일 | 줄 수 | 분류 |
|------|-------|------|
| `src/components/admin/AdminSidebar.tsx` | 52 | `[디자인만 변경]` |
| `src/components/admin/AdminStatCard.tsx` | 37 | `[디자인만 변경]` |
| `src/components/admin/AdminDashboard.tsx` | 272 | `[디자인만 변경]` |
| `src/components/admin/UserManageTable.tsx` | 356 | `[디자인만 변경]` |
| `src/components/admin/ProjectModerateTable.tsx` | 450 | `[디자인만 변경]` |
| `src/components/admin/TechStackManager.tsx` | 336 | `[디자인만 변경]` |
| `src/components/admin/CommonCodeManager.tsx` | 335 | `[디자인만 변경]` |
| `src/components/admin/AiSettingsManager.tsx` | 694 | `[디자인만 변경]` |
| `src/components/admin/AdminUserDetailModal.tsx` | 337 | `[디자인만 변경]` |
| `src/components/admin/AdminProjectDetailModal.tsx` | 389 | `[디자인만 변경]` |

**관리자 합계: ~2,930줄 | 전체 합계: ~3,786줄**

---

## 2. 현재 구현 상태 분석

### 2-1. 이용약관 (`terms/page.tsx`, 322줄)

**구조:**
- Server Component (상태 없음, `metadata` export)
- `LAST_UPDATED` 상수 (마지막 수정일)
- 단일 컬럼 레이아웃: `max-w-3xl mx-auto`
- `prose prose-slate dark:prose-invert` 래퍼로 타이포그래피
- 13개 약관 섹션 + 하단 개인정보처리방침 링크
- 뒤로가기 링크 (인라인 SVG 화살표)

**현재 스타일 토큰:**
- `bg-background`, `text-foreground`, `text-muted-foreground`, `text-primary`
- `border-border` (하단 구분선)
- `prose prose-slate dark:prose-invert`

### 2-2. 개인정보처리방침 (`privacy/page.tsx`, 534줄)

**구조:**
- terms와 동일한 레이아웃/구조
- 12개 섹션 + HTML `<table>` 6개 (개인정보 수집 항목 등)
- 하단 이용약관 링크

**현재 스타일 토큰:** terms와 동일 + 테이블에 `border-border`, `bg-muted/50`

### 2-3. AdminSidebar (`AdminSidebar.tsx`, 52줄)

**구조:**
- Client Component (`'use client'`, `usePathname`)
- 6개 네비게이션 항목 (이모지 아이콘 + 텍스트)
- 활성 탭 감지: pathname 비교
- 서비스로 돌아가기 링크

**현재 스타일:** 다크 테마 (`bg-gray-900`, `text-white`, `bg-blue-600` 활성)

### 2-4. AdminDashboard (`AdminDashboard.tsx`, 272줄)

**구조:**
- Client Component (`useState`, `useEffect`)
- `/api/admin/stats` 호출 → 로딩/에러/데이터 상태
- KPI 카드 4개 (AdminStatCard 사용)
- 프로젝트 상태 요약 3열
- Top 10 기술 스택 바 차트
- 최근 사용자/프로젝트 목록

**현재 스타일:** `bg-card`, `border-border`, `shadow-sm`, `animate-pulse` 스켈레톤

### 2-5. AdminStatCard (`AdminStatCard.tsx`, 37줄)

**구조:**
- Props: `label`, `value`, `icon`, `sub`, `color` (blue/green/yellow/purple)
- 컬러 맵핑 오브젝트

**현재 스타일:** `bg-card rounded-xl shadow-sm border border-border`, 컬러별 `bg-{color}-50 text-{color}-600`

### 2-6. UserManageTable (`UserManageTable.tsx`, 356줄)

**구조:**
- 디바운스 검색 (400ms), 페이지네이션 (LIMIT=20)
- 체크박스 선택 (전체/개별), 벌크 액션
- 행 클릭 → AdminUserDetailModal
- API: GET/PATCH `/api/admin/users`

**현재 스타일:** `bg-muted/50` 헤더, `bg-card divide-y` 바디, 상태 뱃지 (red/green)

### 2-7. ProjectModerateTable (`ProjectModerateTable.tsx`, 450줄)

**구조:**
- 상태 필터 5개 (all/recruiting/in_progress/completed/paused)
- 검색, 페이지네이션, 체크박스, 벌크 액션
- 행 클릭 → AdminProjectDetailModal
- API: GET/DELETE/PATCH `/api/admin/projects`

**현재 스타일:** UserManageTable과 유사 패턴

### 2-8. TechStackManager (`TechStackManager.tsx`, 336줄)

**구조:**
- 7개 카테고리 탭 필터
- CRUD: 생성 폼 토글, 인라인 편집, 삭제
- skillicons.dev 아이콘 연동
- API: GET/POST/PUT/DELETE `/api/admin/tech-stacks`

**현재 스타일:** `border-blue-600` 활성 탭, `bg-blue-50` 폼 영역

### 2-9. CommonCodeManager (`CommonCodeManager.tsx`, 335줄)

**구조:**
- 그룹 탭 → 해당 그룹 코드 목록
- 활성/비활성 토글, 인라인 편집, 삭제
- API: GET/POST/PUT/DELETE `/api/admin/common-codes`

**현재 스타일:** TechStackManager와 유사, 커스텀 토글 (`w-9 h-5 rounded-full`)

### 2-10. AiSettingsManager (`AiSettingsManager.tsx`, 694줄)

**구조:**
- 3개 탭: 기본(Basic), 프롬프트(Prompt), 프리셋(Presets)
- 내부 서브컴포넌트: BasicTab, PromptTab, PresetsTab, FieldGroup
- dirty flag → 저장 버튼 활성화
- API: GET/PATCH `/api/admin/ai-settings`, GET models, POST check-connection

**현재 스타일:** 탭 네비, 토글 (`w-12 h-6`), `border-gray-200` 카드

### 2-11. AdminUserDetailModal (`AdminUserDetailModal.tsx`, 337줄)

**구조:**
- 모달 (backdrop blur + click-to-close)
- 사용자 상세 정보: 프로필, 권한, 기본정보, 기술태그, 소셜링크
- 계정 활성/비활성 토글 (위험 영역)
- API: GET/PATCH `/api/admin/users/:id`

**현재 스타일:** `bg-card border-border rounded-xl shadow-2xl`, `bg-red-50/50` 위험 영역

### 2-12. AdminProjectDetailModal (`AdminProjectDetailModal.tsx`, 389줄)

**구조:**
- AdminUserDetailModal과 유사 패턴
- 프로젝트 상세: 상태, 기본정보, 작성자, 팀 구성, 기술스택, 설명
- 비활성화/삭제 액션 + 중첩 사용자 모달 (Portal)
- API: GET/PATCH/DELETE `/api/admin/projects/:pid`

**현재 스타일:** AdminUserDetailModal과 동일 패턴

---

## 3. 디자인 변환 규칙 (토큰 매핑)

### 3-1. 글로벌 토큰 교체 맵

모든 파일에 공통 적용하는 클래스 치환 규칙입니다.

| 현재 (구) | 변경 (신) | 비고 |
|-----------|-----------|------|
| `bg-background` | `bg-surface` | 페이지 배경 |
| `bg-card` | `bg-surface-container-lowest` | 카드/패널 배경 |
| `bg-muted/50`, `bg-muted/40` | `bg-surface-container-low` | 섹션/헤더 배경 |
| `bg-muted` | `bg-surface-container-high` | 테이블 헤더 등 |
| `text-foreground` | `text-on-surface` | 기본 텍스트 |
| `text-muted-foreground` | `text-on-surface-variant` | 보조 텍스트 |
| `text-primary` | `text-primary` | 유지 |
| `border-border` | `border-outline-variant/15` | Ghost Border (No-Line Rule) |
| `divide-border` | `divide-outline-variant/15` | 테이블 행 구분 |
| `shadow-sm` | `shadow-ambient` | 카드 그림자 |
| `shadow-2xl` | `shadow-modal` | 모달 그림자 |
| `rounded-xl` | `rounded-lg` | 통일 (0.5rem) |
| `rounded-lg` | `rounded-lg` | 유지 |
| `bg-blue-600 text-white` (버튼) | `bg-primary-container text-on-primary` | Primary 버튼 |
| `bg-red-600 text-white` (버튼) | `bg-error text-on-error` | Error 버튼 |
| `hover:bg-*` (버튼) | `hover:px-[calc(1rem+4px)]` | 버튼 hover → 가로 확장 |
| `bg-gray-900`, `bg-gray-950` | `bg-inverse-surface` | 사이드바 다크 배경 |
| `border border-border` (카드) | 제거 | No-Line Rule |
| `prose prose-slate dark:prose-invert` | 제거 (직접 스타일링) | MD3 타이포 토큰 사용 |
| `dark:*` | 제거 | 다크모드 미지원 결정 |
| `font-bold text-2xl` (헤더) | `font-headline text-headline-sm font-semibold` | 섹션 타이틀 |
| `font-bold text-3xl` (수치) | `font-headline text-[2rem] font-bold` | KPI 수치 |
| `text-sm` (본문) | `font-body text-body-md` | 본문 텍스트 |
| `text-xs` (라벨) | `font-body text-label-md font-semibold` | 메타/라벨 |

### 3-2. 상태 뱃지 토큰

| 용도 | 현재 | 변경 |
|------|------|------|
| 활성/성공 | `bg-green-100 text-green-700` | `bg-emerald-50 text-emerald-600` |
| 비활성/에러 | `bg-red-100 text-red-700` | `bg-error-container text-on-error-container` |
| 진행중 | `bg-yellow-100 text-yellow-700` | `bg-amber-50 text-amber-600` |
| 관리자 | `bg-purple-100 text-purple-700` | `bg-secondary-container text-on-secondary-container` |
| 모집중 | `bg-blue-100 text-blue-700` | `bg-primary/5 text-primary` |
| 완료 | `bg-gray-100 text-gray-700` | `bg-surface-container-high text-on-surface-variant` |

### 3-3. 다크모드 클래스 제거

UIUX_DEVELOPMENT_SPEC 결정사항에 따라 **라이트모드만 지원**합니다.
모든 `dark:*` 프리픽스 클래스를 제거합니다.
단, `ThemeProvider` 관련 코드는 건드리지 않습니다.

---

## 4. 컴포넌트별 디자인 상세 스펙

### Step 1: 이용약관 / 개인정보처리방침 (`terms/page.tsx`, `privacy/page.tsx`)

**디자인 참조:** `docs/assets/pages/14_terms_pc.html`

#### 레이아웃 변경 (단일 컬럼 → TOC 사이드바 + 본문 2컬럼)

**현재:**
```
┌──────────────────────────────────┐
│ ← 돌아가기                        │
│ 서비스 이용약관                     │
│ 최종 수정일: ...                   │
│                                  │
│ [prose 래퍼]                      │
│   제1조 ... 제13조               │
│                                  │
│ ─── 하단 링크 ───                 │
└──────────────────────────────────┘
max-w-3xl mx-auto
```

**변경 (PC, lg 이상):**
```
┌─────────────────────────────────────────────────────────┐
│  ← 돌아가기              서비스 이용약관                    │
│                         최종 수정일: 2026년 3월 3일        │
├──────────┬──────────────────────────────────────────────┤
│ TOC 사이드│  제1조 (목적)                                 │
│          │  ┌─────────────────────────────────────────┐ │
│ · 제1조  │  │ surface-container-lowest 카드            │ │
│ · 제2조  │  │ 약관 내용 ...                             │ │
│ · 제3조  │  └─────────────────────────────────────────┘ │
│   ...    │                                              │
│          │  제2조 (정의)                                 │
│ sticky   │  ┌─────────────────────────────────────────┐ │
│ top-32   │  │ surface-container-low 카드 (교차 배경)     │ │
│          │  └─────────────────────────────────────────┘ │
├──────────┴──────────────────────────────────────────────┤
│  하단 링크 (개인정보처리방침 / 이용약관)                     │
└─────────────────────────────────────────────────────────┘
max-w-[1440px] mx-auto, px-8 lg:px-24
```

**변경 (모바일, < lg):**
```
┌──────────────────────────────┐
│ ← 돌아가기                    │
│ 서비스 이용약관                │
│ 최종 수정일: ...              │
│                              │
│ [TOC 숨김]                   │
│                              │
│ 제1조 (목적)                  │
│ ┌──────────────────────────┐ │
│ │ 약관 내용 카드             │ │
│ └──────────────────────────┘ │
│ ...                          │
└──────────────────────────────┘
px-4, 단일 컬럼
```

#### Tailwind 클래스 상세

**페이지 컨테이너:**
```
bg-surface min-h-screen pt-24 pb-32 px-8 lg:px-24
```

**헤더 영역:**
```
max-w-[1440px] mx-auto mb-16
← 링크: inline-flex items-center gap-2 text-on-surface-variant font-body text-body-md
         hover:text-on-surface transition-colors mb-6
제목:    font-headline text-[3rem] font-bold text-on-surface tracking-tight
수정일:  text-on-surface-variant font-body text-body-md mt-4
```

**2컬럼 레이아웃:**
```
max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-16
```

**TOC 사이드바 (PC only):**
```
hidden lg:block lg:w-72 flex-shrink-0
└─ sticky top-32
   └─ bg-surface-container-lowest rounded-lg p-6 space-y-1
      └─ 각 링크:
         비활성: px-4 py-2.5 rounded-lg text-on-surface-variant font-body text-body-md
                 hover:bg-surface-container-low transition-colors
         활성:   bg-surface-container-lowest text-primary font-semibold
                 border-l-2 border-primary (좌측 인디케이터)
```

**본문 영역:**
```
flex-grow space-y-24
```

**섹션 카드 (교차 배경):**
```
짝수: bg-surface-container-lowest rounded-lg p-10
홀수: bg-surface-container-low rounded-lg p-10

섹션 번호 뱃지: inline-flex items-center justify-center
               w-8 h-8 rounded-full bg-primary/5 text-primary
               font-body text-label-md font-semibold mb-4

섹션 제목: font-headline text-2xl font-bold text-on-surface mb-6

본문: font-body text-body-md text-on-surface-variant leading-relaxed (line-height: 1.75)

정의 리스트 (dl):
  grid grid-cols-[auto_1fr] gap-x-4 gap-y-3
  dt: font-semibold text-on-surface
  dd: text-on-surface-variant
```

**하단 푸터:**
```
max-w-[1440px] mx-auto mt-24 pt-12 border-t border-outline-variant/15
text-on-surface-variant font-body text-body-md
링크: text-primary hover:underline
```

**테이블 (privacy 전용):**
```
overflow-x-auto rounded-lg
table: w-full text-body-md
thead: bg-surface-container-low
th: px-4 py-3 text-left font-semibold text-on-surface
tbody tr: border-t border-outline-variant/15
td: px-4 py-3 text-on-surface-variant
```

**TOC 스크롤 추적:** 순수 CSS/스크롤 기반이 아닌, 각 섹션에 `id`를 부여하고 `<a href="#section-N">` 앵커 링크로 구현합니다. IntersectionObserver로 활성 섹션을 추적하려면 Client Component로 전환이 필요하므로, **정적 앵커 링크만** 사용합니다 (Server Component 유지).

> **주의:** terms/privacy는 현재 Server Component입니다. TOC 사이드바가 정적 앵커 링크라면 Server Component를 유지할 수 있습니다. IntersectionObserver 기반 활성 상태 추적이 필요하면 Client Component로 전환해야 합니다.
> → **결정: 정적 앵커 링크로 구현, Server Component 유지**

---

### Step 2: AdminSidebar (`AdminSidebar.tsx`, 52줄)

**디자인 참조:** `docs/assets/admin/01_admin_dashboard.html` 사이드바 영역

#### 레이아웃

```
┌──────────────────────────────┐
│ 🛠 SPM Admin                 │  ← 로고/타이틀 영역
│                              │
├──────────────────────────────┤
│ ▪ 대시보드          (활성)    │  ← nav 항목
│   사용자 관리                 │
│   프로젝트 모더레이션          │
│   공통 코드 관리              │
│   기술 스택 관리              │
│   AI 설정                    │
├──────────────────────────────┤
│                              │
│  [서비스로 돌아가기]           │  ← 하단 고정
│  로그아웃                     │
└──────────────────────────────┘
w-64, h-screen, fixed left-0 top-0
```

#### Tailwind 클래스 상세

**사이드바 컨테이너:**
```
h-screen w-64 fixed left-0 top-0 z-40
bg-inverse-surface text-inverse-on-surface
flex flex-col
```

**로고 영역:**
```
px-6 py-6 mb-2
타이틀: font-headline text-xl font-bold tracking-tight text-inverse-on-surface
```

**네비게이션:**
```
flex-1 px-3 space-y-1

각 항목:
  비활성: flex items-center gap-3 px-4 py-3 rounded-lg
          text-inverse-on-surface/70 font-body text-body-md
          hover:bg-white/10 hover:translate-x-1
          transition-all duration-200
  활성:   bg-surface-container-lowest text-primary font-semibold
          shadow-ambient rounded-lg
```

**하단 영역:**
```
px-3 py-6 mt-auto border-t border-white/10 space-y-1

서비스 링크: flex items-center gap-3 px-4 py-3 rounded-lg
             text-inverse-on-surface/70 hover:bg-white/10
             transition-colors
```

**아이콘:** 현재 이모지 사용 → **이모지 유지** (디자인 에셋에서 Material Symbols를 사용하지만, 이모지가 admin 영역에서 이미 잘 동작하고 있으므로 유지. 아이콘 라이브러리 추가는 범위 밖)

---

### Step 3: AdminDashboard + AdminStatCard

**디자인 참조:** `docs/assets/admin/01_admin_dashboard.html` 메인 콘텐츠

#### AdminStatCard 레이아웃

```
┌─────────────────────────────┐
│ [아이콘]  ┌─ 상태 뱃지 ─┐   │
│           └─────────────┘   │
│ 라벨                         │
│ 2,847            +12% ↑     │
│ 서브텍스트                    │
└─────────────────────────────┘
```

**Tailwind:**
```
컨테이너: bg-surface-container-lowest rounded-lg p-6
          hover:bg-surface-bright hover:shadow-ambient
          transition-all duration-200

아이콘 박스: w-11 h-11 rounded-lg flex items-center justify-center
  blue:   bg-primary/5 text-primary
  green:  bg-emerald-50 text-emerald-600
  yellow: bg-amber-50 text-amber-600
  purple: bg-secondary-container text-on-secondary-container

라벨: font-body text-label-md text-on-surface-variant mt-4
수치: font-headline text-[2rem] font-bold text-on-surface
서브: font-body text-label-md text-on-surface-variant
```

#### AdminDashboard 레이아웃

```
┌─────────────────────────────────────────────────────┐
│ 관리자 대시보드                    검색 [input]       │
│ SPM 서비스 통계 및 관리                               │
├─────────┬─────────┬─────────────────────────────────┤
│ KPI 1   │ KPI 2   │ KPI 3                           │
├─────────┴─────────┴─────────────────────────────────┤
│                                                     │
│ ┌─── 2/3 ──────────────────┐ ┌──── 1/3 ──────────┐ │
│ │ 최근 프로젝트 테이블       │ │ Top 기술 스택      │ │
│ │                          │ │ 바 차트            │ │
│ │                          │ │                   │ │
│ └──────────────────────────┘ └───────────────────┘ │
│                                                     │
│ ┌─── 2/3 ──────────────────┐ ┌──── 1/3 ──────────┐ │
│ │ 최근 사용자 테이블         │ │ 프로젝트 상태 요약  │ │
│ └──────────────────────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Tailwind:**
```
컨테이너: p-8 space-y-8

헤더 영역:
  flex items-center justify-between mb-2
  제목: font-headline text-2xl font-bold text-on-surface
  설명: font-body text-body-md text-on-surface-variant

KPI 그리드: grid grid-cols-1 md:grid-cols-3 gap-6

메인 그리드: grid grid-cols-1 lg:grid-cols-3 gap-8

테이블 카드: lg:col-span-2 bg-surface-container-lowest rounded-lg p-6
차트 카드: bg-surface-container-lowest rounded-lg p-6

스켈레톤: animate-pulse bg-surface-container-high rounded-lg
```

**테이블 공통 패턴 (대시보드 내 미니 테이블):**
```
thead: bg-surface-container-low
th: px-4 py-3 text-left font-body text-label-md font-semibold
    text-on-surface-variant uppercase tracking-widest
tbody tr: hover:bg-surface-bright transition-colors
td: px-4 py-3 font-body text-body-md text-on-surface
```

**바 차트 (Top 기술 스택):**
```
각 행: flex items-center gap-3
라벨: w-20 font-body text-body-md text-on-surface-variant truncate
바:   flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden
      └─ 내부: h-full bg-primary/60 rounded-full (width: 비율%)
카운트: w-8 text-right font-body text-label-md text-on-surface-variant
```

---

### Step 4: admin/layout.tsx + 하위 페이지 래퍼

**layout.tsx 변경:**
```
현재: flex min-h-screen bg-background
변경: flex min-h-screen bg-surface

메인 영역:
현재: flex-1 overflow-auto
변경: ml-64 flex-1 overflow-auto min-h-screen
```

> **주의:** 현재 layout에 `ml-64`가 없으면 사이드바와 콘텐츠가 겹칠 수 있습니다. 사이드바가 `fixed`이므로 메인 영역에 `ml-64` 필요.

**하위 페이지 래퍼 (users, projects, tech-stacks, common-codes):**
```
현재: p-8 > h1 text-2xl font-bold > p text-muted-foreground text-sm
변경: p-8 > h1 font-headline text-2xl font-bold text-on-surface
            > p font-body text-body-md text-on-surface-variant
```

---

### Step 5: UserManageTable (`UserManageTable.tsx`, 356줄)

#### Tailwind 클래스 상세

**검색 바:**
```
현재: border-border bg-background text-foreground rounded-lg
변경: bg-surface-container-lowest text-on-surface rounded-lg
      border border-outline-variant/15
      focus:ring-2 focus:ring-primary/20 focus:border-primary
      font-body text-body-md
      placeholder:text-on-surface-variant/50
```

**벌크 액션 바:**
```
현재: bg-blue-50
변경: bg-primary/5 rounded-lg p-3 flex items-center gap-3

버튼:
  비활성화: bg-error text-on-error rounded-lg font-body text-body-md px-4 py-2
  활성화: bg-emerald-600 text-white rounded-lg font-body text-body-md px-4 py-2
  선택해제: bg-transparent text-on-surface-variant
```

**테이블:**
```
컨테이너: overflow-x-auto rounded-lg
table: w-full
thead: bg-surface-container-low
th: px-4 py-3 text-left font-body text-label-md font-semibold
    text-on-surface-variant tracking-wider
tbody: bg-surface-container-lowest divide-y divide-outline-variant/15
tr: hover:bg-surface-bright transition-colors cursor-pointer
tr (선택됨): bg-primary/5
td: px-4 py-3 font-body text-body-md text-on-surface
```

**페이지네이션:**
```
flex items-center justify-center gap-2 mt-6
버튼: px-3 py-1.5 rounded-lg font-body text-body-md
  활성: bg-primary-container text-on-primary
  비활성: text-on-surface-variant hover:bg-surface-container-low
  disabled: opacity-40 cursor-not-allowed
```

---

### Step 6: ProjectModerateTable (`ProjectModerateTable.tsx`, 450줄)

UserManageTable과 동일한 테이블 패턴 적용 + 아래 추가:

**상태 필터 버튼:**
```
현재: 활성 bg-blue-600 text-white, 비활성 bg-card text-muted-foreground
변경: 활성 bg-primary-container text-on-primary rounded-lg px-4 py-2
      비활성 bg-transparent text-on-surface-variant rounded-lg px-4 py-2
              hover:bg-surface-container-low transition-colors
```

**프로젝트 상태 뱃지:** 섹션 3-2 토큰 맵 적용

---

### Step 7: TechStackManager (`TechStackManager.tsx`, 336줄)

**카테고리 탭:**
```
현재: border-blue-600 text-blue-600 (활성)
변경: border-b-2 border-primary text-primary font-semibold (활성)
      text-on-surface-variant hover:text-on-surface (비활성)
      font-body text-body-md px-4 py-2
```

**추가 폼:**
```
현재: bg-blue-50 border border-blue-200
변경: bg-primary/5 rounded-lg p-6 space-y-4
      (border 제거 — No-Line Rule)
```

**인라인 편집:**
```
input: bg-surface-container-lowest rounded-lg px-3 py-2
       border border-outline-variant/15
       focus:ring-2 focus:ring-primary/20
       font-body text-body-md
```

---

### Step 8: CommonCodeManager (`CommonCodeManager.tsx`, 335줄)

TechStackManager와 동일한 탭/폼/테이블 패턴 적용.

**토글 스위치:**
```
현재: relative inline-flex h-5 w-9 rounded-full
변경: relative inline-flex h-5 w-9 rounded-full transition-colors duration-200
  ON:  bg-primary
  OFF: bg-surface-container-high
  dot: absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white
       transition-transform
       ON: translate-x-4
```

---

### Step 9: AiSettingsManager (`AiSettingsManager.tsx`, 694줄)

**탭 네비게이션:**
```
flex gap-1 border-b border-outline-variant/15 mb-6
각 탭: px-4 py-2.5 font-body text-body-md
  활성: text-primary border-b-2 border-primary font-semibold
  비활성: text-on-surface-variant hover:text-on-surface
```

**FieldGroup 래퍼:**
```
space-y-2
라벨: font-body text-body-md font-semibold text-on-surface
설명: font-body text-label-md text-on-surface-variant
```

**ON/OFF 토글:** CommonCodeManager 토글과 동일

**셀렉트/인풋:**
```
bg-surface-container-lowest rounded-lg px-3 py-2
border border-outline-variant/15
font-body text-body-md text-on-surface
focus:ring-2 focus:ring-primary/20 focus:border-primary
```

**프리셋 카드:**
```
현재: border border-gray-200 rounded-lg
변경: bg-surface-container-low rounded-lg p-5
      (border 제거 — No-Line Rule)
```

**저장 버튼:**
```
현재: bg-blue-600 text-white
변경: bg-primary-container text-on-primary rounded-lg px-6 py-2.5
      font-body text-body-md font-semibold
      disabled:opacity-40
```

**Connection Status 뱃지:**
```
connected:    bg-emerald-50 text-emerald-600
checking:     bg-amber-50 text-amber-600 + animate-pulse
error/auth:   bg-error-container text-on-error-container
rate_limited: bg-amber-50 text-amber-600
idle:         bg-surface-container-high text-on-surface-variant
```

---

### Step 10: AdminUserDetailModal (`AdminUserDetailModal.tsx`, 337줄)

**모달 오버레이:**
```
현재: fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
변경: fixed inset-0 z-50 bg-surface/80 backdrop-blur-[16px]
      (glassmorphism — DESIGN.md 모달 규칙)
```

**모달 카드:**
```
현재: bg-card border border-border rounded-xl shadow-2xl max-w-lg
변경: bg-surface-container-lowest rounded-lg shadow-modal
      max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto
      (border 제거 — No-Line Rule)
```

**프로필 영역:**
```
아바타: w-16 h-16 rounded-full
이름: font-headline text-title-md font-semibold text-on-surface
이메일: font-body text-body-md text-on-surface-variant
```

**정보 박스:**
```
현재: bg-muted/40 rounded-lg p-3
변경: bg-surface-container-low rounded-lg p-4
```

**기술 태그:**
```
현재: bg-blue-50 text-blue-700
변경: bg-primary/5 text-primary rounded-full px-3 py-1
      font-body text-label-md font-semibold
```

**위험 영역:**
```
현재: border border-red-200 bg-red-50/50 rounded-lg p-4
변경: bg-error-container/10 rounded-lg p-4
      (border 제거 — No-Line Rule)
```

---

### Step 11: AdminProjectDetailModal (`AdminProjectDetailModal.tsx`, 389줄)

AdminUserDetailModal과 동일한 모달 패턴 적용 + 아래 차이:

**프로젝트 상태 뱃지:** 섹션 3-2 토큰 맵 적용

**팀 구성 표시:**
```
각 역할: flex items-center justify-between
         bg-surface-container-low rounded-lg px-4 py-3
역할명: font-body text-body-md text-on-surface
인원: font-body text-label-md text-on-surface-variant
```

**삭제 버튼 (위험 액션):**
```
bg-error text-on-error rounded-lg px-4 py-2
font-body text-body-md font-semibold
```

---

## 5. 작업 순서

| Step | 대상 | 예상 변경량 | 의존성 |
|------|------|-----------|--------|
| 1 | `terms/page.tsx` + `privacy/page.tsx` | ~856줄 교체 | 없음 |
| 2 | `AdminSidebar.tsx` | ~52줄 교체 | 없음 |
| 3 | `AdminStatCard.tsx` + `AdminDashboard.tsx` | ~309줄 교체 | Step 2 |
| 4 | `admin/layout.tsx` + 하위 page 래퍼 4개 | ~95줄 교체 | Step 2 |
| 5 | `UserManageTable.tsx` | ~356줄 교체 | Step 4 |
| 6 | `ProjectModerateTable.tsx` | ~450줄 교체 | Step 4 |
| 7 | `TechStackManager.tsx` | ~336줄 교체 | Step 4 |
| 8 | `CommonCodeManager.tsx` | ~335줄 교체 | Step 4 |
| 9 | `AiSettingsManager.tsx` | ~694줄 교체 | Step 4 |
| 10 | `AdminUserDetailModal.tsx` | ~337줄 교체 | Step 5 |
| 11 | `AdminProjectDetailModal.tsx` | ~389줄 교체 | Step 6 |

---

## 6. 테스트 케이스

### 6-1. 이용약관 / 개인정보처리방침

- [ ] PC(lg 이상): TOC 사이드바가 좌측에 표시되고 sticky 동작
- [ ] PC: TOC 앵커 링크 클릭 시 해당 섹션으로 스크롤
- [ ] PC: 섹션 카드 배경색이 교차 적용 (lowest ↔ low)
- [ ] 모바일(< lg): TOC 숨김, 단일 컬럼
- [ ] 하단 링크: terms ↔ privacy 상호 이동
- [ ] privacy 테이블이 가로 스크롤 가능
- [ ] `LAST_UPDATED` 날짜 표시 정상
- [ ] metadata (title, description) 유지

### 6-2. 관리자 사이드바

- [ ] 사이드바 fixed, 전체 높이
- [ ] 현재 경로에 맞는 항목 활성 스타일
- [ ] `/admin` 정확 매칭 (하위 페이지에서 비활성)
- [ ] 서비스로 돌아가기 링크 동작

### 6-3. 관리자 대시보드

- [ ] KPI 카드 3개 정상 표시 + hover 효과
- [ ] 스켈레톤 로딩 표시
- [ ] 에러 상태 표시
- [ ] Top 기술 스택 바 차트 렌더링
- [ ] 최근 사용자/프로젝트 테이블 렌더링
- [ ] skillicons.dev 아이콘 로드 + 에러 폴백

### 6-4. 사용자 관리 테이블

- [ ] 검색 디바운스 동작 (400ms)
- [ ] 전체 선택 / 개별 선택 체크박스
- [ ] 벌크 활성화/비활성화 동작
- [ ] 페이지네이션 동작
- [ ] 행 클릭 → 상세 모달 열림
- [ ] 상태 뱃지 색상 정확성

### 6-5. 프로젝트 모더레이션 테이블

- [ ] 상태 필터 5개 토글 동작
- [ ] 검색 동작
- [ ] 벌크 비활성화/삭제 동작
- [ ] 삭제 확인 다이얼로그
- [ ] 프로젝트 상태별 뱃지 색상

### 6-6. 기술 스택 매니저

- [ ] 카테고리 탭 전환
- [ ] 추가 폼 토글 + 등록
- [ ] 인라인 편집 + 저장/취소
- [ ] 삭제 확인
- [ ] skillicons.dev 미리보기

### 6-7. 공통 코드 매니저

- [ ] 그룹 탭 전환
- [ ] 활성/비활성 토글 스위치 동작
- [ ] 인라인 편집 + 저장/취소
- [ ] 코드 추가 폼

### 6-8. AI 설정 매니저

- [ ] 3개 탭 전환
- [ ] ON/OFF 토글 동작
- [ ] 모델 목록 로드 + 연결 테스트
- [ ] 프롬프트 에디터 동작
- [ ] 프리셋 추가/삭제
- [ ] dirty flag → 저장 버튼 활성화
- [ ] 저장 성공/실패 알림

### 6-9. 모달

- [ ] 오버레이 glassmorphism (blur + 80% opacity)
- [ ] 오버레이 클릭 → 닫힘
- [ ] 사용자 상세: 프로필, 권한, 기본정보, 태그, 소셜링크
- [ ] 사용자 상세: 활성/비활성 토글
- [ ] 프로젝트 상세: 상태, 정보, 팀, 스택, 설명
- [ ] 프로젝트 상세: 비활성화/삭제 + 확인 다이얼로그
- [ ] 프로젝트 상세 → 사용자 상세 중첩 모달 (Portal)

---

## 7. 절대 건드리지 않을 코드

| 파일 | 위치 | 이유 |
|------|------|------|
| `admin/layout.tsx` | `getServerSession` + admin 체크 + redirect | 인증/권한 로직 — 보안 핵심 |
| `UserManageTable.tsx` | 디바운스 검색 로직 (`searchTimer` ref) | 타이머 교체 시 검색 UX 파손 |
| `UserManageTable.tsx` | API 호출 + 벌크 PATCH 로직 | 데이터 무결성 |
| `ProjectModerateTable.tsx` | DELETE API + 벌크 삭제 로직 | 비가역 작업 — 로직 변경 금지 |
| `TechStackManager.tsx` | `getIconSlug` 유틸 + skillicons.dev 연동 | 아이콘 로드 로직 |
| `CommonCodeManager.tsx` | 그룹 로드 → 코드 로드 순서 | 순서 의존성 |
| `AiSettingsManager.tsx` | 모든 API 호출 (GET/PATCH/POST) | 설정 저장 로직 |
| `AiSettingsManager.tsx` | dirty flag 추적 로직 | 저장 UX |
| `AdminUserDetailModal.tsx` | AbortController cleanup | 메모리 누수 방지 |
| `AdminProjectDetailModal.tsx` | Portal + 중첩 모달 패턴 | 스태킹 컨텍스트 |
| `terms/page.tsx`, `privacy/page.tsx` | 법률 텍스트 내용 | 법적 문서 — 내용 수정 금지 |
| `terms/page.tsx`, `privacy/page.tsx` | `metadata` export | SEO |

---

---

## 8. 추가 작업 — 관리자 기능 개선 (Phase 8.5)

> 디자인 교체(Step 1~11) 완료 후 진행하는 관리자 기능 확장입니다.
> 기존 모델/API를 최대한 활용하여 어드민 전용 뷰를 추가합니다.

### Step 12: 지원서 관리 페이지 `[신규]`

**경로:** `/admin/applications`
**파일:** `src/app/admin/applications/page.tsx` + `src/components/admin/ApplicationManageTable.tsx`

**기존 인프라:**
- Model: `Application` (projectId, applicantId, motivation, weeklyHours, message, ownerNote, status)
- Status enum: `pending` | `accepted` | `rejected` | `withdrawn`
- Index: `{ projectId, applicantId }` unique

**신규 API:**
- `GET /api/admin/applications` — 전체 지원서 목록 (상태 필터 + 검색 + 페이지네이션)
  - Query: `?status=pending&search=키워드&page=1&limit=20`
  - populate: `applicantId` (nName, authorEmail), `projectId` (title, pid)
  - 정렬: 최신순 (createdAt DESC)

**UI 구성:**
```
┌─────────────────────────────────────────────────────┐
│ 지원서 관리                                          │
│ 전체 지원 현황을 모니터링합니다.                        │
├─────────────────────────────────────────────────────┤
│ [전체] [대기중 N] [수락 N] [거절 N] [철회 N]  🔍검색  │
├─────────────────────────────────────────────────────┤
│ 지원자     │ 프로젝트    │ 상태  │ 주당시간 │ 지원일  │
│ 홍길동     │ SPM #22    │ 대기  │ 10시간  │ 04/01  │
│ 김철수     │ 칸반앱 #15  │ 수락  │ 15시간  │ 03/28  │
├─────────────────────────────────────────────────────┤
│                    페이지네이션                       │
└─────────────────────────────────────────────────────┘
```

**행 클릭 → 지원서 상세 모달:**
- 지원자 프로필 요약 (이름, 이메일)
- 프로젝트 정보 (제목, PID)
- 지원 동기 (motivation)
- 메시지 (message)
- 오너 메모 (ownerNote)
- 주당 가용 시간
- 상태 변경 이력 (createdAt, updatedAt)

**관리자 액션:** 읽기 전용 (지원 승인/거절은 프로젝트 소유자 권한 유지)

**사이드바 추가:** `AdminSidebar.tsx`에 "지원서 관리 📋" 항목 추가

---

### Step 13: 리뷰 관리 페이지 `[신규]`

**경로:** `/admin/reviews`
**파일:** `src/app/admin/reviews/page.tsx` + `src/components/admin/ReviewManageTable.tsx`

**기존 인프라:**
- Model: `Review` (projectId, reviewerId, revieweeId, rating, tags, comment, isPublic)
- Rating: 1~5
- Index: `{ projectId, reviewerId, revieweeId }` unique

**신규 API:**
- `GET /api/admin/reviews` — 전체 리뷰 목록 (필터 + 페이지네이션)
  - Query: `?minRating=1&maxRating=5&isPublic=true&search=키워드&page=1&limit=20`
  - populate: `reviewerId` (nName), `revieweeId` (nName), `projectId` (title, pid)
  - 정렬: 최신순
- `DELETE /api/admin/reviews/[id]` — 부적절 리뷰 삭제

**UI 구성:**
```
┌─────────────────────────────────────────────────────────┐
│ 리뷰 관리                                               │
│ 사용자 간 리뷰를 모니터링하고 부적절한 리뷰를 관리합니다.    │
├─────────────────────────────────────────────────────────┤
│ [전체] [공개] [비공개]   ⭐필터: [1~5]   🔍검색          │
├─────────────────────────────────────────────────────────┤
│ 작성자  │ 대상자  │ 프로젝트  │ 평점 │ 공개 │ 작성일     │
│ 홍길동  │ 김철수  │ SPM #22  │ ⭐4  │ 공개 │ 04/01     │
│ 이영희  │ 박민수  │ 앱 #15   │ ⭐1  │ 비공개│ 03/28     │
├─────────────────────────────────────────────────────────┤
│                      페이지네이션                         │
└─────────────────────────────────────────────────────────┘
```

**행 클릭 → 리뷰 상세 모달:**
- 작성자 / 대상자 정보
- 프로젝트 정보
- 평점 (별 표시)
- 태그 목록
- 코멘트 전문
- 공개/비공개 상태
- 삭제 버튼 (확인 다이얼로그)

---

### Step 14: 대시보드 기간 필터 + 리뷰/지원 통계 `[기능 수정]`

**대상 파일:** `src/app/api/admin/stats/route.ts` + `src/components/admin/AdminDashboard.tsx`

**API 변경:**
- `GET /api/admin/stats?period=week` — 기간 파라미터 추가
  - `week` (기본값): 최근 7일
  - `month`: 최근 30일
  - `all`: 전체

**대시보드 추가 통계:**
- 리뷰 통계: 전체 리뷰 수, 평균 평점, 이번 기간 신규 리뷰 수
- 지원 통계 확장: 기간별 지원 수, 프로젝트별 지원 집중도 (상위 5개)

**UI 변경:**
```
┌─────────────────────────────────────────────────────┐
│ 관리자 대시보드           [이번 주 ▼] [이번 달] [전체] │
├──────────┬──────────┬──────────┬────────────────────┤
│ 사용자    │ 프로젝트  │ 지원     │ 리뷰              │
│ 1,234    │ 89       │ 대기 12  │ 평균 ⭐4.2        │
│ +15 이번주│ +3 이번주 │ 수락률 67%│ +8 이번주         │
└──────────┴──────────┴──────────┴────────────────────┘
```

---

### Step 15: 공지사항 발송 `[신규]`

**경로:** `/admin/announcements`
**파일:** `src/app/admin/announcements/page.tsx` + `src/components/admin/AnnouncementSender.tsx`

**신규 API:**
- `POST /api/admin/announcements` — 전체 사용자 또는 특정 그룹에 알림 발송
  - Body: `{ title, message, target: 'all' | 'active' }`
  - 내부: 대상 사용자 조회 → Notification 일괄 생성 + Socket.io 브로드캐스트
- `GET /api/admin/announcements` — 발송 이력 조회

**신규 모델:** `Announcement`
```ts
{
  title: string;          // 공지 제목
  message: string;        // 공지 내용
  target: 'all' | 'active'; // 발송 대상
  sentCount: number;      // 발송된 알림 수
  sentBy: ObjectId;       // 발송한 관리자
  createdAt: Date;
}
```

**Notification 모델 확장:**
- type enum에 `'announcement'` 추가

**UI 구성:**
```
┌─────────────────────────────────────────────────────┐
│ 공지사항 발송                                        │
├─────────────────────────────────────────────────────┤
│ 제목: [________________________]                     │
│ 내용: [________________________]                     │
│       [________________________]                     │
│ 대상: (●) 전체 사용자  ( ) 활성 사용자만              │
│                                                     │
│              [발송하기]                               │
├─────────────────────────────────────────────────────┤
│ 발송 이력                                            │
│ 제목          │ 대상   │ 발송수 │ 발송자 │ 발송일     │
│ 서비스 점검    │ 전체   │ 1,234 │ admin │ 04/06     │
│ 약관 개정 안내 │ 활성   │ 1,100 │ admin │ 03/28     │
└─────────────────────────────────────────────────────┘
```

**사이드바 추가:** `AdminSidebar.tsx`에 "공지사항 📢" 항목 추가

---

### Step 16: 관리자 감사 로그 `[신규]`

**목적:** 관리자가 누가, 언제, 어떤 행동을 했는지 추적. 관리자 복수 운영 시 책임 소재 확인, 실수 복구, 법적 분쟁 대응을 위한 기록.

**경로:** `/admin/audit-log`
**파일:** `src/app/admin/audit-log/page.tsx` + `src/components/admin/AuditLogViewer.tsx`

**신규 모델:** `src/lib/models/AdminAuditLog.ts`
```ts
{
  adminId: ObjectId;       // 액션 수행한 관리자 (ref: User)
  adminEmail: string;      // 이메일 스냅샷 (유저 삭제 시에도 추적 가능)
  action: string;          // 액션 유형 (아래 enum 참조)
  targetType: string;      // 대상 유형: 'user' | 'project' | 'review' | 'common-code' | 'tech-stack' | 'ai-settings' | 'announcement'
  targetId: string;        // 대상 ID (_id 또는 pid)
  targetLabel: string;     // 대상 식별 라벨 (사용자명, 프로젝트명 등 — 검색용 스냅샷)
  detail: string;          // 변경 상세 (예: "delYn: false → true")
  ip: string;              // 요청 IP
  createdAt: Date;         // 자동 생성 (timestamps)
}
```

**action enum:**
| action | 설명 |
|--------|------|
| `user.deactivate` | 사용자 비활성화 |
| `user.activate` | 사용자 활성화 |
| `user.role_change` | 권한 변경 (user ↔ admin) |
| `user.bulk_deactivate` | 사용자 벌크 비활성화 |
| `project.deactivate` | 프로젝트 비활성화 |
| `project.activate` | 프로젝트 재활성화 |
| `project.delete` | 프로젝트 영구 삭제 |
| `project.bulk_deactivate` | 프로젝트 벌크 비활성화 |
| `project.bulk_delete` | 프로젝트 벌크 삭제 |
| `review.delete` | 리뷰 삭제 |
| `common_code.create` | 공통 코드 생성 |
| `common_code.update` | 공통 코드 수정 |
| `common_code.delete` | 공통 코드 삭제 |
| `tech_stack.create` | 기술 스택 생성 |
| `tech_stack.update` | 기술 스택 수정 |
| `tech_stack.delete` | 기술 스택 삭제 |
| `ai_settings.update` | AI 설정 변경 |
| `announcement.send` | 공지사항 발송 |

**Index:** `{ createdAt: -1 }`, `{ adminId: 1, createdAt: -1 }`, `{ targetType: 1, createdAt: -1 }`

**로그 기록 유틸:** `src/lib/utils/adminAuditLog.ts`
```ts
// 기존 admin API 핸들러에서 액션 성공 후 호출
await logAdminAction({
  adminId: session.user._id,
  adminEmail: session.user.authorEmail,
  action: 'user.deactivate',
  targetType: 'user',
  targetId: userId,
  targetLabel: user.nName || user.authorEmail,
  detail: 'delYn: false → true',
  ip: request.headers.get('x-forwarded-for') || 'unknown',
});
```

> 로그 기록은 **비동기 fire-and-forget** — API 응답을 블로킹하지 않음.
> 로그 저장 실패 시 console.error만 출력하고 원래 API 응답은 정상 반환.

**신규 API:**
- `GET /api/admin/audit-log` — 감사 로그 조회
  - Query: `?date=2026-04-06&adminId=xxx&targetType=user&page=1&limit=50`
  - populate: `adminId` (nName, authorEmail)
  - 정렬: 최신순 (createdAt DESC)

**기존 API 수정 (로그 기록 삽입):**
- `PATCH /api/admin/users/[id]` — 사용자 활성/비활성/권한 변경 시
- `PATCH /api/admin/users` — 벌크 액션 시
- `PATCH /api/admin/projects/[pid]` — 프로젝트 비활성화/재활성화 시
- `DELETE /api/admin/projects/[pid]` — 프로젝트 삭제 시
- `PATCH /api/admin/projects` — 벌크 액션 시
- `DELETE /api/admin/projects` — 벌크 삭제 시
- `DELETE /api/admin/reviews/[id]` — 리뷰 삭제 시 (Step 13에서 신규)
- `POST/PUT/DELETE /api/admin/common-codes/**` — 공통 코드 CUD 시
- `POST/PUT/DELETE /api/admin/tech-stacks/**` — 기술 스택 CUD 시
- `PATCH /api/admin/ai-settings` — AI 설정 변경 시
- `POST /api/admin/announcements` — 공지 발송 시 (Step 15에서 신규)

**UI 구성:**
```
┌─────────────────────────────────────────────────────────────┐
│ 감사 로그                                                    │
│ 관리자 액션 이력을 일자별로 확인합니다.                          │
├─────────────────────────────────────────────────────────────┤
│ 📅 [2026-04-06]  관리자: [전체 ▼]  대상: [전체 ▼]            │
├─────────────────────────────────────────────────────────────┤
│ 시각     │ 관리자   │ 액션              │ 대상       │ 상세   │
│ 21:30:15 │ admin   │ 사용자 비활성화     │ 홍길동     │ 보기 → │
│ 21:25:03 │ admin   │ 프로젝트 영구 삭제  │ SPM #22   │ 보기 → │
│ 20:15:44 │ admin2  │ 공통 코드 수정      │ CAREER    │ 보기 → │
│ 19:00:12 │ admin   │ 공지사항 발송       │ 전체 발송  │ 보기 → │
├─────────────────────────────────────────────────────────────┤
│                        페이지네이션                           │
└─────────────────────────────────────────────────────────────┘
```

**"보기" 클릭 → 상세 패널 (인라인 확장 또는 모달):**
```
관리자: admin (admin@spm.com)
시각: 2026-04-06 21:30:15
액션: 사용자 비활성화 (user.deactivate)
대상: 홍길동 (User ID: 69d3ae...)
상세: delYn: false → true
IP: 192.168.1.100
```

**데이터 보존 정책:**
- 90일 이상 경과한 로그는 자동 삭제 (TTL index) — 디스크 비용 관리
- `createdAt` 필드에 `expireAfterSeconds: 7776000` (90일) 설정

**사이드바 추가:** `AdminSidebar.tsx`에 "감사 로그 📜" 항목 추가 (하단, 서비스로 돌아가기 위에 배치)

---

### 작업 순서 (Step 12~16)

| Step | 대상 | 작업 유형 | 의존성 |
|------|------|----------|--------|
| 12 | 지원서 관리 | API 1개 + 페이지 + 컴포넌트 + 모달 + 사이드바 | 없음 |
| 13 | 리뷰 관리 | API 2개 + 페이지 + 컴포넌트 + 모달 + 사이드바 | 없음 |
| 14 | 대시보드 기간 필터 | API 수정 + 컴포넌트 수정 | Step 12, 13 (통계에 포함) |
| 15 | 공지사항 발송 | 모델 1개 + API 2개 + 페이지 + 컴포넌트 + Notification 확장 | 없음 |
| 16 | 감사 로그 | 모델 1개 + 유틸 1개 + API 1개 + 기존 API ~12개 수정 + 페이지 + 컴포넌트 + 사이드바 | Step 13, 15 (삭제/발송 API에 로그 삽입) |

> Step 12, 13, 15는 병렬 진행 가능.
> Step 14는 12, 13 완료 후.
> Step 16은 모든 CUD API가 확정된 후 마지막 진행 (기존 + 신규 API에 로그 삽입).

### 테스트 케이스 (Step 12~16)

**6-10. 지원서 관리**
- [ ] 상태별 필터 동작 (전체/대기/수락/거절/철회)
- [ ] 검색 동작 (지원자명, 프로젝트명)
- [ ] 페이지네이션 동작
- [ ] 행 클릭 → 상세 모달 (지원 동기, 메시지, 오너 메모)
- [ ] 지원자/프로젝트 populate 정상 표시

**6-11. 리뷰 관리**
- [ ] 공개/비공개 필터 동작
- [ ] 평점 필터 동작
- [ ] 검색 동작
- [ ] 행 클릭 → 상세 모달 (평점, 태그, 코멘트)
- [ ] 리뷰 삭제 + 확인 다이얼로그
- [ ] 삭제 후 목록 갱신

**6-12. 대시보드 기간 필터**
- [ ] 이번 주 / 이번 달 / 전체 토글 동작
- [ ] KPI 카드 수치가 기간에 따라 변경
- [ ] 리뷰 통계 카드 표시 (평균 평점, 신규 수)

**6-13. 공지사항 발송**
- [ ] 제목/내용 입력
- [ ] 대상 선택 (전체/활성)
- [ ] 발송 확인 다이얼로그
- [ ] 발송 후 이력 목록에 추가
- [ ] 대상 사용자에게 알림 생성 확인

**6-14. 감사 로그**
- [ ] 일자 선택 → 해당 일자 로그만 조회
- [ ] 관리자 필터 동작
- [ ] 대상 유형 필터 동작 (user/project/review 등)
- [ ] 페이지네이션 동작
- [ ] 상세 보기 (인라인 확장 또는 모달)
- [ ] 사용자 비활성화 시 로그 자동 생성 확인
- [ ] 프로젝트 삭제 시 로그 자동 생성 확인
- [ ] 공통 코드 수정 시 로그 자동 생성 확인
- [ ] 로그 기록 실패 시 원래 API 응답에 영향 없음 확인
- [ ] 90일 TTL index 동작 확인

---

## 9. 향후 과제 (Phase 8 범위 밖)

| 항목 | 설명 | 선행 조건 |
|------|------|----------|
| 신고/제보 시스템 | 부적절 콘텐츠 신고 접수 + 관리자 검토 큐 | 별도 Report 모델 + 프론트/백 |
| 채팅 모니터링 | 부도덕 대화 감시 최소 선별 | **법적 검토 선행 필수** — 통신비밀보호법, 개인정보보호법상 채팅 열람 범위, DB 암호화 의무 확인. 약관에 모니터링 고지 조항 추가 필요 |
| 세분화된 권한 | admin/user 이분법 → 역할별 권한 (super admin, moderator 등) | 관리자 규모 확대 시 |

---

## 10. 작업 진행 규칙

1. **각 Step 완료 후** `npm run test:run` 전체 테스트 통과 확인
2. **className 교체 시** 기존 이벤트 핸들러, 조건부 렌더링에 영향이 없는지 확인
3. **모달 변경 시** 오버레이 클릭 닫힘, ESC 닫힘 동작 보존 확인
4. **테이블 변경 시** 체크박스 선택, 정렬, 페이지네이션 동작 보존 확인
5. **디자인 에셋과 현행 코드 상충 시** 사용자에게 선택지 제시 후 컨펌
6. **신규 API 작성 시** `withApiLogging` 래퍼 + `requireAdmin()` 인증 적용
7. **신규 페이지 작성 시** 기존 admin 테이블 컴포넌트 패턴 (검색/필터/페이지네이션/모달) 재사용
