# Side Project Mate — UI/UX 전반 개선 계획

> **작성일**: 2026-02-28  
> **대상**: 공통 기능, 헤더, 푸터, 전체 스타일, 인증 페이지, 홈(메인) 페이지  
> **전제**: 프로필/프로젝트/대시보드 기능은 완성 단계이므로 이 문서에서는 제외

---

## 목차

1. [디자인 시스템 / 전역 스타일](#1-디자인-시스템--전역-스타일)
2. [헤더(Header)](#2-헤더header)
3. [푸터(Footer)](#3-푸터footer)
4. [홈(메인) 페이지 — 배너 및 랜딩](#4-홈메인-페이지--배너-및-랜딩)
5. [로그인 페이지](#5-로그인-페이지)
6. [회원가입 페이지](#6-회원가입-페이지)
7. [마이페이지](#7-마이페이지)
8. [공통 컴포넌트](#8-공통-컴포넌트)
9. [SEO / 메타데이터](#9-seo--메타데이터)
10. [접근성(Accessibility)](#10-접근성accessibility)
11. [우선순위 로드맵](#11-우선순위-로드맵)

---

## 1. 디자인 시스템 / 전역 스타일

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 컬러 팔레트 | 전체가 무채색(gray 계열)이라 브랜드 개성 없음. 강조색(Primary Brand Color)이 실질적으로 부재 |
| 다크모드 `--destructive` | Light: `#ef4444`, Dark: `#7f1d1d` 로 명도 차이가 너무 커 다크모드에서 버튼이 거의 안 보임 |
| Pretendard 폰트 로딩 | CDN woff 단독 사용. `woff2` 없이 구형 포맷만 제공 → 성능 저하 |
| [globals.css](file:///c:/Users/PC/projects/sideProjectMate/src/app/globals.css) 컴포넌트 클래스 | `.btn-primary`, `.btn-secondary`가 있지만 실제 코드에서 거의 사용 안 됨 → 스타일 일관성 무너짐 |
| `primary` 컬러 | Tailwind config에서 `primary.500`이 `#6b7280`(gray)로 정의되어 시맨틱 컬러와 충돌 |
| 트랜지션/애니메이션 | `transition-colors duration-200`만 있고 페이지 레벨 Skeleton/Loading 상태가 없음 |

### 개선 방향

```css
/* globals.css — 개선된 컬러 토큰 예시 */
:root {
  /* 브랜드 색상 도입 — 예: 인디고 계열 */
  --brand: #4f46e5;          /* indigo-600 */
  --brand-light: #e0e7ff;    /* indigo-100 */
  --brand-foreground: #fff;

  /* 기존 primary를 brand로 교체, primary는 텍스트/버튼 전용 */
  --primary: var(--brand);
  --primary-foreground: var(--brand-foreground);

  /* destructive — dark에서도 충분히 선명하게 */
  --destructive: #ef4444;    /* light/dark 동일 */
  --destructive-foreground: #ffffff;
}
```

**구체적 액션:**
- [ ] [globals.css](file:///c:/Users/PC/projects/sideProjectMate/src/app/globals.css)에 브랜드 컬러(`--brand`, `--brand-light`) CSS 변수 추가
- [ ] 다크모드 `--destructive`를 `#ef4444` 로 통일하고 배경을 `--destructive/20`으로 처리
- [ ] Pretendard woff2 CDN 또는 npm 패키지(`pretendard`)로 교체 (퍼포먼스)
- [ ] [globals.css](file:///c:/Users/PC/projects/sideProjectMate/src/app/globals.css) 컴포넌트 레이어에 `.btn-primary`, `.btn-secondary`, `.form-input`, `.badge` 등 재사용 클래스 정비 및 코드 전반 적용
- [ ] [tailwind.config.js](file:///c:/Users/PC/projects/sideProjectMate/tailwind.config.js)의 `primary` 숫자 팔레트(50~900)를 gray 대신 브랜드 컬러 팔레트로 교체

---

## 2. 헤더(Header)

> 파일: [src/components/Header.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/Header.tsx)

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 로고 | "SPM" 텍스트만 존재. 로고 아이콘/이미지 없음. 브랜드 인식 약함 |
| 상단 서브 카테고리 | `/projects` 경로에서만 노출되는 `['추천', '최신', '인기', '마감임박']` 탭이 실제로 ProjectList 필터와 연결되지 않음. 동작 없는 UI |
| 알림 드롭다운 | 클릭 외부 영역에서 닫히지 않음 (바깥 클릭 핸들러 없음) |
| 토스트 | `animate-bounce` 사용 → UX 불편. 알림 토스트는 `translate-y` fade-in/out이 더 적합 |
| 찜하기/채팅 아이콘 | `hidden md:block` 버튼 2개가 기능 연결 없이 렌더링됨 → 빈 버튼 |
| 모바일 메뉴 | `absolute` 포지셔닝으로 레이아웃 흐름 밖에 위치. 열린 상태에서 외부 스크롤 가능 |
| 사용자 아바타 | 로그인 시 헤더에 아바타 이미지 없음. 이름/닉네임도 미표시 |
| 다크모드 토글 | 헤더가 아닌 좌하단 [FloatingThemeButton](file:///c:/Users/PC/projects/sideProjectMate/src/components/FloatingThemeButton.tsx#5-30)에 위치 → 접근성/발견성 낮음 |

### 개선 방향

```
[로고] [프로필] [프로젝트] [대시보드]    [알림🔔] [아바타 드롭다운▼] [다크모드 토글]
```

**구체적 액션:**
- [ ] **로고**: SVG 로고 또는 next/image 로고 이미지 적용 (`/public/logo.svg`)
- [ ] **사용자 아바타**: 로그인 상태에서 헤더 우측에 아바타 이미지 + 닉네임 표시. 클릭 시 드롭다운(마이페이지 / 내 프로필 / 로그아웃)
- [ ] **다크모드 토글**: [FloatingThemeButton](file:///c:/Users/PC/projects/sideProjectMate/src/components/FloatingThemeButton.tsx#5-30) 제거 후 헤더 우측으로 이동 (아이콘 버튼)
- [ ] **알림 외부 클릭 닫기**: `useEffect`로 `document.addEventListener('mousedown', ...)` 추가
- [ ] **토스트**: `animate-bounce` → `animate-slide-up` (Tailwind `keyframes` 추가 또는 CSS animation)
- [ ] **찜/채팅 아이콘**: 기능 미구현 시 헤더에서 제거하거나 disabled 처리
- [ ] **서브 카테고리(탭)**: `ProjectList` 컴포넌트의 필터 상태와 연동하거나, 해당 탭을 헤더에서 ProjectList 내부로 이동
- [ ] **모바일 메뉴**: `fixed inset-0` backdrop + slide-in 패널로 변경. 열릴 때 스크롤 lock

---

## 3. 푸터(Footer)

> 파일: [src/components/Footer.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/Footer.tsx)

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 메뉴 항목 | `메뉴1` ~ `메뉴10` 플레이스홀더 그대로 사용. 실제 링크 없음 |
| 회사 정보 | `홍길동`, 가짜 사업자번호 등 더미 데이터 |
| SNS/외부 링크 | GitHub, 이메일 등 소셜 링크 없음 |
| 디자인 | 단순 2단 그리드. 브랜드 아이덴티티 없음 |
| 저작권 연도 | `2025` 하드코딩. `new Date().getFullYear()` 로 동적 처리 필요 |

### 개선 방향

실제 서비스 정보를 기반으로 아래 구조로 개편:

```
[ 로고 + 한 줄 소개 ]    [ 서비스 ]          [ 리소스 ]             [ 소셜 ]
                         - 프로젝트 찾기     - 이용약관             GitHub
                         - 내 프로필        - 개인정보처리방침       이메일
                         - 대시보드         - 공지사항

──────────────────────────────────────────────────────────────────────────
© 2026 Side Project Mate. All rights reserved.
```

**구체적 액션:**
- [ ] 메뉴를 실제 경로(`/projects`, `/profile`, `/dashboard` 등)로 교체
- [ ] 더미 회사정보 제거 또는 실제 정보로 교체
- [ ] SNS 링크 섹션 추가 (GitHub Repository 등)
- [ ] 저작권 연도 `new Date().getFullYear()` 동적 처리
- [ ] 3~4컬럼 그리드 레이아웃으로 개편

---

## 4. 홈(메인) 페이지 — 배너 및 랜딩

> 파일: [src/components/HomeBanner.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/HomeBanner.tsx), [src/app/page.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/page.tsx)

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 배너 배경 | `from-purple-100 to-pink-100` 등 연한 파스텔. 다크모드에서 `dark:from-background dark:to-background`로 사실상 단색 배경으로 전락 |
| 배너 자동 슬라이드 | 없음. 수동 클릭만 가능 |
| 배너 CTA | "지금 시작하기" 버튼 하나만 존재. 비로그인 유저에게 회원가입/로그인 유도 부족 |
| 랜딩 섹션 | 배너 아래에 바로 프로젝트 목록만 나옴. 서비스 소개, 통계, 핵심 기능 소개 섹션 없음 |
| 페이지 타이틀 h1 | SEO용 `<h1>` 없음 (`<h2>`만 사용) |
| 메타데이터 | [layout.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/layout.tsx)에 기본 title만 있고 OG 태그, Twitter Card, canonical URL 없음 |

### 개선 방향

```
┌──────────────────────────────────────────────┐
│  Hero Section (높은 배너)                     │
│  h1 타이틀 + 서브타이틀 + CTA 2개            │
│  (비로그인 → "시작하기" + "둘러보기")          │
│  (로그인 → "프로젝트 탐색" + "내 프로젝트")   │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  통계 섹션 (숫자로 신뢰 형성)                 │
│  프로젝트 N개 | 멤버 N명 | 성공 팀 N팀        │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  핵심 기능 소개 3-카드                        │
│  팀 매칭 | 칸반/WBS 협업툴 | 프로필 관리      │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  최신 프로젝트 목록 (ProjectList)              │
└──────────────────────────────────────────────┘
```

**구체적 액션:**
- [ ] [HomeBanner.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/HomeBanner.tsx) 를 `HeroSection.tsx`로 리팩토링. 배경을 gradient mesh 또는 SVG 패턴으로 교체
- [ ] 배너 자동 슬라이드 (3~5초 인터벌 `setInterval`) 추가
- [ ] 비로그인 여부에 따라 CTA 버튼 분기 (`useSession`)
- [ ] `<h1>` 시맨틱 태그로 변경 (현재 `<h2>`)
- [ ] 통계 섹션 신설: API에서 프로젝트/유저 카운트 가져오거나 하드코딩된 숫자로 시작
- [ ] 핵심 기능 소개 카드 섹션 신설 (`src/components/home/FeatureSection.tsx`)
- [ ] 홈 전용 메타데이터(`metadata`)에 OG 태그, description 추가

---

## 5. 로그인 페이지

> 파일: [src/app/login/page.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/login/page.tsx)

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 디자인 | 흰 배경에 검정 텍스트 + 파란 버튼. 브랜드 컬러 미적용. 매우 기본적인 form UI |
| 포커스 링 | `focus:ring-blue-500`, `focus:border-blue-500` 하드코딩. 시스템 컬러(`--ring`) 미사용 |
| 레이아웃 | 좌/우 2분할(이미지+폼) 구조 없음. 단순 중앙 배치 |
| 라벨 | `sr-only`로 숨겨서 시각적 라벨 없음. UX 저하 |
| 입력창 그룹 | `-space-y-px`로 합쳐져 있어 개별 입력창 구분이 어려움 |
| 비밀번호 | 표시/숨김 토글 없음 |

### 개선 방향

```
┌──────────────────────────────────────────────────┐
│ [좌: 브랜드 그라디언트 패널]  [우: 로그인 폼]     │
│  로고 + 서비스 소개 문구       로고               │
│                               이메일  [________]  │
│                               비밀번호 [______] 👁 │
│                               [로그인 버튼]        │
│                               회원가입 링크        │
└──────────────────────────────────────────────────┘
```

**구체적 액션:**
- [ ] 2분할 레이아웃: 왼쪽 브랜드 패널(그라디언트 + 서비스 소개 문구), 오른쪽 폼
- [ ] 각 입력창을 `-space-y-px` 그룹에서 분리해 `gap-4` 개별 배치 + 시각적 라벨 표시
- [ ] 비밀번호 표시/숨김 토글 버튼(눈 아이콘) 추가
- [ ] focus ring을 `--ring` CSS 변수 기반으로 통일 (`focus:ring-ring`)
- [ ] 에러 메시지에 아이콘(⚠) 추가
- [ ] 로그인 버튼 스타일을 전역 `.btn-primary` 클래스로 통일

---

## 6. 회원가입 페이지

> 파일: [src/app/register/page.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/register/page.tsx)

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 디자인 | 로그인 페이지와 동일한 문제들 |
| 입력창 순서 | 이메일 → 닉네임 → 휴대폰 → 비밀번호 → 비밀번호확인. 일반적인 순서와 다름 |
| 스텝 표시 | 필드가 많지만 모두 한 화면에 나열. 멀티 스텝 폼 고려 가능 |
| 비밀번호 강도 | 구현은 있으나 시각적으로 미흡 (바 3개만 표시) |
| 라벨 | `sr-only`로 숨김 처리 |
| 외부 API 의존 | 닉네임 생성을 외부 API에 의존. API 장애 시 폴백은 있으나 인지 필요 |

**구체적 액션:**
- [ ] 입력창 순서 재정렬: 이메일 → 비밀번호 → 비밀번호 확인 → 닉네임 → 전화번호(선택)
- [ ] 시각적 라벨 표시 (`sr-only` 제거, `<label>` visible 처리)
- [ ] 비밀번호 강도 바를 색상 + 텍스트("약함/보통/강함") 형태로 개선
- [ ] 비밀번호 표시/숨김 토글 추가
- [ ] 닉네임 필드에 랜덤 재생성 버튼(🔄) 추가 (현재 마운트 시 한 번만 생성)
- [ ] 로그인 페이지와 동일한 2분할 레이아웃 + `.btn-primary` 통일

---

## 7. 마이페이지

> 파일: [src/app/mypage/page.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/mypage/page.tsx)

### 현재 문제점

| 항목 | 문제 |
|------|------|
| 로딩 상태 | `"로딩 중..."` 텍스트만 표시. Skeleton UI 없음 |
| `useState` 위치 | [if](file:///c:/Users/PC/projects/sideProjectMate/src/components/Header.tsx#12-21) 조건문 뒤에 `useState` 선언 (L98, L100). React 훅 규칙 위반 → 빌드 경고 |
| `user`를 `any`로 캐스팅 | `const user = session.user as any` — 타입 안정성 없음 |
| "내 프로젝트 보기" 버튼 | `bg-blue-600` 하드코딩. 전역 버튼 스타일 미사용 |
| 지원 현황 UI | 리스트 형태만 있음. 탭(전체/대기중/수락/거절)으로 필터링 미지원 |
| 빈 상태(Empty State) | "지원한 프로젝트가 없습니다" 텍스트만. 일러스트/CTA 없음 |

**구체적 액션:**
- [ ] `useState`/`useCallback` 선언을 `return` 문 이전으로 모두 이동 (훅 규칙 준수)
- [ ] 로딩 중 Skeleton UI 추가 (`animate-pulse` 기반)
- [ ] 지원 현황 탭 필터 추가 (전체 / 대기중 / 수락됨 / 거절됨)
- [ ] 빈 상태(Empty State) UI 개선: 아이콘 + 설명 + "프로젝트 탐색" CTA 버튼
- [ ] `session.user as any` 제거, `next-auth.d.ts` 타입 확장 활용

---

## 8. 공통 컴포넌트

### 8-1. GlobalModal

> 파일: [src/components/common/GlobalModal.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/common/GlobalModal.tsx)

| 항목 | 문제 |
|------|------|
| 하드코딩 컬러 | `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white` 등. 시스템 토큰 미사용 |
| 접근성 | `aria-labelledby`, `aria-describedby` 없음. 포커스 트랩(focus trap) 없음 |

**액션:**
- [ ] 컬러를 `bg-card text-card-foreground` 등 시스템 토큰으로 교체
- [ ] `aria-labelledby`, `aria-describedby` 추가
- [ ] 모달 열릴 때 첫 번째 버튼에 자동 포커스 (`useRef` + `focus()`)

### 8-2. FloatingThemeButton

- [ ] 헤더로 이동 후 이 컴포넌트 삭제 (섹션 2 참조)

### 8-3. Toast / 알림 시스템

현재 헤더에 인라인으로 토스트 로직이 있음. 공통 Toast 컴포넌트로 분리 필요.

- [ ] `src/components/common/Toast.tsx` 신설
- [ ] `src/store/toastStore.ts` 신설 (Zustand)
- [ ] 헤더의 토스트 로직 → `toastStore` 기반으로 이벤트 발행

### 8-4. Loading / Skeleton

프로젝트 전반적으로 로딩 상태 UI가 부재함.

- [ ] `src/components/common/Skeleton.tsx` 신설 (재사용 가능한 `animate-pulse` 컴포넌트)
- [ ] 각 페이지의 "로딩 중..." 텍스트를 Skeleton으로 교체

### 8-5. Empty State

검색 결과 없음, 지원 내역 없음 등 빈 상태 UI가 텍스트 Only.

- [ ] `src/components/common/EmptyState.tsx` 신설 (icon + title + description + optional CTA)

---

## 9. SEO / 메타데이터

### 현재 문제점

- [layout.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/layout.tsx)에 기본 title/description만 존재
- OG(Open Graph) 태그, Twitter Card, Favicon, canonical URL 없음
- 각 페이지별 동적 메타데이터 없음 (`generateMetadata` 미사용)
- robots.txt, sitemap.xml 없음

**구체적 액션:**
- [ ] [layout.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/layout.tsx)에 OG 태그 추가:
  ```tsx
  export const metadata: Metadata = {
    title: { default: 'Side Project Mate', template: '%s | SPM' },
    description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 매칭 플랫폼',
    openGraph: {
      title: 'Side Project Mate',
      description: '...',
      url: 'https://sideprojectmate.com',
      siteName: 'Side Project Mate',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  };
  ```
- [ ] `/public/og-image.png` (1200×630) 생성
- [ ] `/public/favicon.ico`, `/public/apple-touch-icon.png` 추가
- [ ] 프로젝트 상세(`/projects/[pid]`)에 `generateMetadata` 적용
- [ ] `src/app/robots.ts`, `src/app/sitemap.ts` 신설

---

## 10. 접근성(Accessibility)

### 현재 문제점

- 로그인/회원가입 폼의 라벨이 `sr-only`로 시각적으로 숨겨짐
- 알림 드롭다운에 포커스 트랩 없음
- 키보드 내비게이션 미검증
- `muted-foreground` `#6b7280` on white = 4.6:1 → WCAG AA 통과하나 일부 소형 텍스트는 아슬아슬

**개선 액션:**
- [ ] 폼 라벨 `sr-only` 제거, 시각적 라벨 표시
- [ ] 모달/드롭다운에 포커스 트랩 구현
- [ ] `aria-live="polite"` 알림 영역 추가 (동적 컨텐츠 변경 알림)
- [ ] 이미지에 적절한 `alt` 텍스트 확인/보완

---

## 11. 우선순위 로드맵

업무량과 사용자 임팩트를 기준으로 정렬:

### 🔴 P0 — 즉시 수정 (버그/기능 결함)

| # | 항목 | 파일 |
|---|------|------|
| 1 | [mypage/page.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/mypage/page.tsx) — 조건문 뒤 `useState` 선언 (React 훅 규칙 위반) | [mypage/page.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/app/mypage/page.tsx) |
| 2 | 서브 카테고리 탭 (추천/최신/인기/마감임박) 동작 없는 UI 정리 | [Header.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/Header.tsx) |
| 3 | 알림 드롭다운 외부 클릭 닫기 미동작 | [Header.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/Header.tsx) |
| 4 | 동작 없는 찜하기/채팅 아이콘 버튼 제거 | [Header.tsx](file:///c:/Users/PC/projects/sideProjectMate/src/components/Header.tsx) |

### 🟠 P1 — 단기 (1~2주, 시각적 완성도)

| # | 항목 |
|---|------|
| 5 | 브랜드 컬러 도입 + [globals.css](file:///c:/Users/PC/projects/sideProjectMate/src/app/globals.css) 정비 |
| 6 | 헤더 — 로고 이미지, 아바타 드롭다운, 다크모드 버튼 이동 |
| 7 | 푸터 — 더미 데이터 제거, 실제 링크로 교체, 레이아웃 개편 |
| 8 | 로그인/회원가입 — 2분할 레이아웃, 라벨 노출, 비밀번호 토글 |
| 9 | Toast 공통 컴포넌트 분리 |
| 10 | Skeleton / EmptyState 공통 컴포넌트 신설 |

### 🟡 P2 — 중기 (2~4주, 랜딩/SEO)

| # | 항목 |
|---|------|
| 11 | 홈 페이지 — Hero Section 리뉴얼, 자동 슬라이드, CTA 분기 |
| 12 | 홈 페이지 — 통계 섹션, 핵심 기능 소개 섹션 신설 |
| 13 | SEO — OG 태그, robots.txt, sitemap.ts |
| 14 | 마이페이지 — 탭 필터, Skeleton UI |

### 🟢 P3 — 장기 (4주+, 고도화)

| # | 항목 |
|---|------|
| 15 | 접근성 — 포커스 트랩, `aria-live`, 시각적 라벨 전면 적용 |
| 16 | GlobalModal — 접근성 강화 (aria 속성, 자동 포커스) |
| 17 | 모바일 메뉴 — slide-in 전환 애니메이션, backdrop |
| 18 | Pretendard woff2 마이그레이션 (성능 개선) |

---

> **Note**: 이 문서는 코드 리뷰 및 실제 소스 확인을 바탕으로 작성되었습니다.  
> 각 항목 구현 전 기존 코드 패턴([CLAUDE.md](file:///c:/Users/PC/projects/sideProjectMate/CLAUDE.md) 섹션 6 참조)을 반드시 준수하세요.
