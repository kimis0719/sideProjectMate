# Phase 6 — 사용자/채팅 페이지 디자인 교체 상세 기획서

> 이슈: #268
> 브랜치: `feature/268-uiux-phase6-user-chat`
> 작성일: 2026-04-07
> 디자인 에셋: `docs/assets/pages/10_chat_pc.html`, `docs/assets/pages/11_mypage_pc.html`, `docs/assets/pages/13_profile_view_v2_pc/`, `docs/assets/pages/13_profile_view_v2_mo/`
> 상위 문서: `docs/plans/UIUX_DEVELOPMENT_SPEC.md` Phase 6

---

## 전체 대상 파일 및 작업 단계

| Step | 대상 | 파일 | 줄 수 | 분류 |
|------|------|------|-------|------|
| 0 | 마이페이지 | `src/app/mypage/page.tsx` | 315 | `[디자인 교체]` |
| 1 | 채팅 — 룸 리스트 | `src/components/chat/ChatRoomList.tsx` | 145 | `[디자인 교체]` |
| 2 | 채팅 — 채팅 윈도우 | `src/components/chat/ChatWindow.tsx` | 970 | `[디자인 교체]` |
| 3 | 채팅 — 페이지 레이아웃 | `src/app/chat/page.tsx` | 250 | `[디자인 교체]` |
| 4 | 프로필 — ProfileView + DetailProfileCard | `src/components/profile/ProfileView.tsx` (471) + `DetailProfileCard.tsx` (315) | 786 | `[디자인 교체]` |
| 5 | 프로필 — 외부 연동 (GitHub, SolvedAc, Blog) | `GitHubStats.tsx` (287) + `SolvedAcCard.tsx` (379) + `BlogPostCard.tsx` (113) | 779 | `[디자인 교체]` |
| 6 | 프로필 — 스킬/포트폴리오/가용시간/리뷰 | `SkillSection.tsx` (192) + `PortfolioCard.tsx` (176) + `AvailabilityScheduler.tsx` (167) + `CommunicationStyleSlider.tsx` (108) + `ReviewSection.tsx` (160) | 803 | `[디자인 교체]` |
| 7 | 프로필 — StatusDashboard + 페이지 통합 | `StatusDashboard.tsx` (159) + `profile/page.tsx` (56) + `profile/[id]/page.tsx` (72) + `ImageEditModal.tsx` (171) | 458 | `[디자인 교체]` |

**전체 합계: ~3,531줄 (8 Steps)**

---

## 공통 디자인 패턴 (Phase 5 동일)

### 컬러 토큰 교체표

| 기존 (shadcn) | 신규 (MD3) |
|---------------|------------|
| `bg-background` | `bg-surface` |
| `bg-muted/30`, `bg-muted` | `bg-surface-container-low` |
| `bg-card` | `bg-surface-container-lowest` |
| `text-foreground` | `text-on-surface` |
| `text-muted-foreground` | `text-on-surface-variant` |
| `border-border` | 삭제 (No-Line) 또는 `border-outline-variant/10` |
| `border-input` | `border-none` + `bg-surface-container-low` |
| `bg-primary` | `bg-primary-container` (CTA) 또는 `bg-primary` (칩) |
| `text-primary-foreground` | `text-on-primary` |
| `bg-destructive` | `bg-error` |
| `text-destructive` | `text-error` |
| `hover:bg-muted` | `hover:bg-surface-container-high` |
| `bg-slate-800` (내 메시지) | `bg-primary-container text-white` |
| `bg-yellow-100/bg-green-100/bg-red-100` (상태) | `bg-emerald-100`(대기) / `bg-primary-container/10`(수락) / `bg-tertiary-fixed/40`(거절) |

### 입력 필드

```
bg-surface-container-lowest border-none rounded-xl
focus:ring-2 focus:ring-primary/20
placeholder:text-on-surface-variant/30
```

### 카드

```
bg-surface-container-lowest rounded-xl
shadow-[0_20px_40px_rgba(26,28,28,0.04)]
```

### 섹션 헤딩

```
text-xs font-bold uppercase tracking-widest text-on-surface-variant
```

### 아이콘

- Material Symbols Outlined (이미 layout.tsx에 폰트 로드됨)

---

## Step 0: 마이페이지 (`src/app/mypage/page.tsx`)

### 현재 구조
- 단일 컬럼 레이아웃: `container mx-auto px-4 py-8`
- DetailProfileCard 컴포넌트 + 지원 현황 탭 (전체/대기중/수락됨/거절됨)
- 탭 디자인: `border-b-2 border-primary` 밑줄 스타일

### 디자인 에셋 (`11_mypage_pc.html`) 핵심 변경점

**레이아웃:**
- `grid grid-cols-1 lg:grid-cols-12 gap-12` 2컬럼 그리드
- 좌측 4칸: 프로필 요약 카드 (사이드바 역할)
- 우측 8칸: 지원 현황 메인 콘텐츠
- 상단 여백: `pt-32 pb-24 px-8 max-w-[1440px] mx-auto`

**프로필 요약 카드 (좌측):**
- `bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.04)]`
- 아바타: `w-20 h-20 rounded-full border-4 border-surface-container-low`
- 볼트 아이콘 뱃지: `absolute bottom-0 right-0 w-6 h-6 bg-primary-container rounded-full`
- 이름: `text-2xl font-bold text-on-surface font-headline`
- 포지션: `text-on-surface-variant font-medium`
- 기술 태그: `px-3 py-1 bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider rounded-full`
- 프로필 수정 버튼: `w-full py-4 bg-primary-container text-white rounded-lg font-semibold`
- 하단: "나의 프로젝트 바로가기" 링크 박스 (`bg-surface-container-low p-6 rounded-xl`)

**필터 칩 (기존 탭 → 칩으로 변경):**
- 활성: `px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold`
- 비활성: `px-5 py-2.5 bg-surface-container-high text-on-surface-variant rounded-full text-sm font-medium`
- 헤딩: `text-4xl font-bold tracking-tight font-headline mb-8`

**지원 카드:**
- `bg-surface-container-lowest p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-6`
- 썸네일: `w-24 h-24 flex-shrink-0 bg-surface-container-low rounded-lg overflow-hidden` (프로젝트 이미지 없으면 기본 배경)
- 프로젝트명: `text-lg font-bold font-headline`
- 상태 뱃지:
  - 대기중: `bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-tighter rounded-full`
  - 수락됨: `bg-primary-container/10 text-primary-container text-[10px] font-bold uppercase tracking-tighter rounded-full`
  - 거절됨: `bg-tertiary-fixed/40 text-on-tertiary-fixed-variant text-[10px] font-bold uppercase tracking-tighter rounded-full`
- 지원 역할: `text-sm text-on-surface-variant`
- 지원일: `text-xs text-on-surface-variant opacity-60`
- 버튼 영역: `flex md:flex-col items-center gap-3 w-full md:w-auto`
  - 지원 취소: `border border-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/5`
  - 참여중: `bg-surface-container-low text-on-surface-variant rounded-lg`
  - 결과 확인: `bg-surface-container-low text-on-surface-variant/40 rounded-lg cursor-not-allowed`

### 유지할 것
- `useSession`, `useModal`, 인증 리다이렉트 로직
- `DetailProfileCard` 컴포넌트 호출 (props 유지)
- `ImageEditModal` 연동
- 지원 목록 fetch/filter/cancel 로직
- 탭 카운트 계산 로직

### 변경 요약
1. 전체 레이아웃을 1컬럼 → `lg:grid-cols-12` 2컬럼으로 변경
2. 프로필 카드 영역을 좌측 사이드바로 이동 (DetailProfileCard → 간소화된 요약 카드 직접 구현)
3. 탭 필터를 pill chip 스타일로 교체
4. 지원 카드에 썸네일 영역 추가 + 레이아웃 변경
5. 상태 뱃지 컬러 교체

---

## Step 1: 채팅 — ChatRoomList (`src/components/chat/ChatRoomList.tsx`)

### 현재 구조
- 카테고리 탭 필터 (ALL + 4개 카테고리)
- 룸 리스트: `divide-y` 세로 구분선, 아이템마다 카테고리 컬러바(좌측 border)
- 아바타 없음 (이니셜 or 아이콘)
- 활성 탭: `bg-slate-800 text-white`

### 디자인 에셋 (`10_chat_pc.html`) 핵심 변경점

**컨테이너:**
- `w-[320px] bg-surface-container-low flex flex-col`
- 헤더: `font-headline font-semibold text-xl mb-4` ("Messages")
- 검색: `pl-10 pr-4 py-2.5 bg-surface-container-lowest border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary-container`

**룸 아이템 — 활성:**
- `flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm cursor-pointer border-l-4 border-primary`
- 아바타: `w-12 h-12 rounded-full object-cover`
- 이름: `font-semibold text-on-surface truncate`
- 시간: `text-[10px] text-slate-400`
- 마지막 메시지: `text-xs text-slate-500 truncate`

**룸 아이템 — 비활성:**
- `flex items-center gap-4 p-4 hover:bg-white/50 rounded-2xl cursor-pointer transition-all`
- 읽지 않은 뱃지: `bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full`

**그룹 채팅 아바타 (이미지 없을 때):**
- `w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary font-bold`

### 변경 요약
1. 카테고리 탭 필터 제거 → 상단 검색바로 대체 (에셋 기준)
2. `divide-y` → 개별 `rounded-2xl` 카드 스타일
3. 활성 룸: `bg-white rounded-2xl shadow-sm border-l-4 border-primary`
4. 아바타 표시 (현재 없음 → 상대방 아바타 또는 이니셜 원형)
5. 카테고리 컬러바 → primary 컬러 좌측 보더로 통일
6. 읽지 않은 뱃지: `bg-primary text-white rounded-full`

### 주의사항
- **카테고리 필터 기능은 유지**: UI에서 탭을 제거하더라도 필터 state와 로직은 보존. 검색바에 통합하거나, 에셋에 없더라도 카테고리 필터 칩을 검색 아래에 작게 배치할 수 있음 → **구현 시 판단**
- `getRoomDisplayName` 유틸 그대로 사용
- `onRoomClick` props 유지

---

## Step 2: 채팅 — ChatWindow (`src/components/chat/ChatWindow.tsx`)

### 현재 구조 (970줄)
- 헤더: 카테고리 컬러 상단 보더 + 배경 틴트, 룸 제목, 참가자 수, 검색/참가자/메뉴 버튼
- 메시지 영역: 좌/우 정렬 버블, 읽음 처리, 날짜 구분선
- 입력 영역: 텍스트 + 전송 버튼

### 디자인 에셋 핵심 변경점

**헤더 (데스크톱):**
- `h-16 px-6 flex items-center justify-between glass bg-white/80`
- 아바타: `w-10 h-10 rounded-full`
- 이름: `font-semibold text-on-surface leading-tight`
- 온라인 상태: `text-xs text-emerald-500` + 초록 점 `w-1.5 h-1.5 rounded-full bg-emerald-500`
- 나가기 버튼: `text-error font-medium text-sm flex items-center gap-1 hover:bg-error/5 rounded-lg`

**헤더 (모바일):**
- `h-16 px-4 glass bg-white/90 sticky top-0`
- 뒤로가기 버튼 + 아바타 + 이름
- 더보기(⋮) 버튼

**메시지 영역 (데스크톱):**
- 날짜 구분: `px-4 py-1.5 bg-surface-container-high rounded-full text-[11px] font-bold tracking-widest text-slate-500 font-label`
- 상대 메시지: `bg-surface-container-low p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm` + 아바타 `w-8 h-8 rounded-full`
- 내 메시지: `bg-primary-container text-white p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-md`
- 시간: `text-[10px] text-slate-400 mt-1`
- 최대 너비: `max-w-[80%]`

**메시지 영역 (모바일):**
- 상대: `bg-surface-container-low p-3.5 rounded-2xl rounded-tl-none text-sm shadow-sm`
- 내 것: `bg-primary-container text-white p-3.5 rounded-2xl rounded-tr-none text-sm shadow-md`
- 시간: `text-[9px] text-slate-400`
- 최대 너비: `max-w-[85%]`
- 아바타 제거 (모바일에서는 공간 절약)

**입력 영역 (데스크톱):**
- `p-6 bg-white`
- 래퍼: `bg-surface-container-low p-2 pr-4 rounded-2xl focus-within:ring-2 ring-primary-container`
- 첨부 버튼: `material-symbols-outlined add_circle` (기능 구현 불필요, 아이콘만)
- 입력: `flex-1 bg-transparent border-0 focus:ring-0 text-sm py-2`
- 전송: `bg-primary-container text-white w-10 h-10 rounded-xl hover:scale-105 active:scale-95`

**입력 영역 (모바일):**
- `fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md`
- 래퍼: `bg-surface-container-low px-2 py-1.5 rounded-full`
- 전송: `bg-primary text-white w-8 h-8 rounded-full`

### 절대 건드리지 않을 것
- Socket.io 이벤트 구독/발행 로직
- `useChatSocket` 훅 호출
- 오프라인 큐 (pendingMessages ref)
- 무한 스크롤 페이지네이션 로직
- 읽음 처리 로직 (mark-messages-read, messages-read-receipt)
- 검색 기능 state machine (isSearchOpen, searchResults, currentMatchIdx 등)
- `shouldAutoScroll` ref 패턴
- 참가자 목록 드롭다운 로직

### 변경 요약
1. 카테고리 컬러 헤더 틴트 → `glass bg-white/80` 단색 헤더
2. 메시지 버블: `bg-slate-800` → `bg-primary-container text-white`, `bg-card` → `bg-surface-container-low`
3. 버블 radius: `rounded-tr-sm`/`rounded-tl-sm` → `rounded-tr-none`/`rounded-tl-none` + `rounded-2xl`
4. 날짜 구분선 스타일 교체
5. 입력 영역: pill → `rounded-2xl` 래퍼 + 아이콘 버튼
6. 모바일: 입력 영역 `fixed bottom-0` + `backdrop-blur-md`
7. 상대 메시지에 아바타 추가 (데스크톱)

---

## Step 3: 채팅 — 페이지 레이아웃 (`src/app/chat/page.tsx`)

### 현재 구조
- `h-[calc(100vh-64px)]` 컨테이너
- 모바일: `showListOnMobile` 토글
- 데스크톱: 좌 `w-80` 리스트 + 우 `flex-1` 윈도우

### 디자인 에셋 핵심 변경점

**데스크톱:**
- 전체: `flex flex-1 overflow-hidden bg-white`
- 리스트: `w-[320px] bg-surface-container-low flex flex-col`
- 윈도우: `flex-1 flex flex-col bg-surface`
- 에셋에는 좌측 사이드바(프로젝트 네비게이션)가 있지만, 현재 SPM 구조상 SidebarShell과 함께 적용 불필요 — **채팅은 전체 너비 사용**

**모바일:**
- 에셋에서 채팅 윈도우 진입 시 헤더 숨김 + 하단 탭 바 숨김 (기존 동작과 동일)
- 리스트 화면: 하단 탭 바 표시 + "Messages" 헤더

### 변경 요약
1. 배경색: `bg-background` → `bg-surface` (윈도우), `bg-surface-container-low` (리스트)
2. 빈 상태 디자인 MD3 토큰 교체
3. `w-80` → `w-[320px]` (에셋 기준)
4. `border-r` 제거 (No-Line Rule, 배경색 차이로 구분)

---

## Step 4: 프로필 — ProfileView + DetailProfileCard

### ProfileView 변경점 (에셋: `13_profile_view_v2_pc`)

**페이지 헤더:**
- `bg-surface-container-low border-b border-outline-variant/10`
- "My Space" 라벨: `text-xs font-bold uppercase tracking-widest text-primary`
- 타이틀: `text-4xl font-bold font-headline tracking-tighter`
- 저장 버튼: `bg-primary text-white px-8 py-3 rounded-lg font-semibold`

**레이아웃:**
- `grid grid-cols-12 gap-12 mt-12`
- 좌측 8칸: 기본 정보 + 기술/관심사 + 외부 연동
- 우측 4칸: 소셜 링크 + 주간 가능 시간
- 하단 전체: 받은 리뷰

**모바일 (`13_profile_view_v2_mo`):**
- 단일 컬럼 `max-w-md mx-auto px-6 pb-32`
- 상단: sticky 헤더 (뒤로가기 + "Curator Profile" + Save)
- 섹션 구분: `space-y-8`

### DetailProfileCard 변경점

**기본 정보 섹션:**
- 아바타: `w-32 h-32 rounded-xl ring-4 ring-background shadow-inner` (원형 → 사각 라운드)
- 카메라 버튼: `absolute -bottom-2 -right-2 bg-primary text-white w-10 h-10 rounded-full shadow-lg`
- 입력 필드: `bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 py-3 px-4`
- 라벨: `text-xs font-bold uppercase tracking-wider text-on-surface-variant`
- 자기소개: textarea `rows-4` + 글자수 카운터 `text-[10px] font-medium text-outline`

**모바일:**
- 아바타: `w-20 h-20 rounded-xl ring-4 ring-white`
- verified 뱃지: `absolute -bottom-1 -right-1 bg-primary-container text-white p-1 rounded-lg`
- 이름: `font-bold text-xl`
- 역할 뱃지: `bg-surface-container-low px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`

### 변경 요약
1. ProfileView 전체 레이아웃을 `grid-cols-12` 2컬럼으로 재구성
2. 페이지 헤더 추가 (My Space + 저장 버튼)
3. DetailProfileCard 아바타 형태 변경 (원형 → 사각 rounded-xl)
4. 입력 필드 스타일 전체 교체
5. 모바일: sticky 헤더 + 단일 컬럼

---

## Step 5: 프로필 — 외부 연동 (GitHub, SolvedAc, Blog)

### 에셋 기준 디자인

**GitHub 통계 (외부 연동 섹션):**
- 4칸 그리드: `grid grid-cols-1 md:grid-cols-4 gap-4`
- 각 카드: `bg-surface-container-low p-6 rounded-xl text-center hover:bg-surface-bright`
- 라벨: `text-[10px] font-bold text-on-surface-variant uppercase tracking-widest`
- 숫자: `text-3xl font-bold text-primary font-headline`
- 항목: Commits, PRs, Issues, Stars

**Solved.ac:**
- `p-6 bg-surface-container-low rounded-xl border-l-4 border-[#FF0076]`
- 아이콘: `w-12 h-12 bg-[#FF0076]/10 rounded-full` + `military_tech`
- 티어: `text-2xl font-black text-[#FF0076] tracking-tighter`

**모바일:**
- 2칸 그리드: `grid grid-cols-2 gap-4`
- GitHub: `text-2xl font-bold` + progress bar
- Solved.ac: 간소화된 카드 (그라데이션 뱃지 `bg-gradient-to-br from-yellow-300 to-yellow-600`)

### 변경 요약
1. GitHubStats: 복잡한 히트맵/스킬 레이더 → 4칸 통계 카드 + Solved.ac 티어 카드로 간소화
2. 모바일: 2칸 그리드 컴팩트 뷰
3. BlogPostCard: 에셋에 블로그 섹션이 명시적으로 없음 → 소셜 링크의 Blog 항목으로 대체 (카드 유지하되 디자인 토큰만 교체)

---

## Step 6: 프로필 — 스킬/포트폴리오/가용시간/리뷰

### SkillSection 에셋 디자인

**기술 스택 (편집 모드):**
- 래퍼: `p-4 bg-surface-container-low rounded-xl`
- 활성 태그: `bg-primary text-white px-3 py-1.5 rounded-full text-xs font-semibold` + close 버튼
- 추가 버튼: `bg-white px-3 py-1.5 rounded-full text-xs font-bold border border-outline-variant/30 text-primary`

**관심 도메인:**
- 비활성: `bg-surface-container-high px-4 py-2 rounded-full text-xs font-semibold`
- 활성: `bg-primary text-white px-4 py-2 rounded-full text-xs font-semibold`

**조회 모드 (모바일):**
- `bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold`
- `bg-surface-container-high text-on-surface px-4 py-2 rounded-xl text-xs font-bold`

### AvailabilityScheduler 에셋 디자인

**데스크톱 (우측 컬럼):**
- `grid grid-cols-[4.5rem_repeat(7,1fr)] gap-[4px]`
- 헤더: Mon~Sun `text-[10px] font-bold text-on-surface-variant uppercase`
- 행 라벨: `아침 06-12`, `점심 12-18`, `저녁 18-24`, `심야 00-06`
  - `text-[9px] font-bold text-outline` + 시간대 `text-[8px] font-normal opacity-70`
- 활성 셀: `h-10 bg-primary rounded-md shadow-sm`
- 비활성 셀: `h-10 bg-[#F3F4F6] rounded-md hover:bg-[#F3F4F6]/80 cursor-pointer`

**모바일:**
- `grid grid-cols-[3rem_repeat(7,1fr)] gap-1`
- `aspect-square` 정사각형 셀
- 활성: `bg-[#2563EB] rounded-md shadow-sm shadow-blue-200`
- 비활성: `bg-surface-container-low rounded-md`
- 토/일 헤더에 `text-blue-500/70` / `text-red-500/70`
- 주당 시간 뱃지: `bg-[#10b981]/10 text-[#065f46] px-2 py-1 rounded-full text-[10px] font-bold`

### ReviewSection 에셋 디자인

**데스크톱:**
- `bg-surface-container-low p-6 rounded-xl hover:translate-x-1`
- 별점: `text-tertiary` (Material Symbols `star` FILL=1)
- 점수: `text-on-surface text-xs font-bold`
- 날짜: `text-[10px] text-on-surface-variant font-medium`
- 프로젝트명: `font-bold text-sm`
- 리뷰 내용: `text-sm text-on-surface-variant leading-relaxed`

**모바일:**
- `bg-surface-container-lowest p-5 rounded-xl space-y-3`
- 리뷰어 아바타 `w-8 h-8 rounded-lg` + 이름/직함
- 별: `text-yellow-400 text-sm` (FILL=1)
- 텍스트: `text-xs text-on-surface leading-relaxed`

### 변경 요약
1. SkillSection: skillicons.dev 아이콘 → primary pill 태그 + close 버튼
2. AvailabilityScheduler: 셀 크기/간격 조정, 행 라벨에 시간대 표시 추가
3. ReviewSection: 리뷰 카드 레이아웃 교체 + 호버 효과
4. CommunicationStyleSlider: 에셋에 명시적 디자인 없음 → MD3 토큰만 교체
5. PortfolioCard: 에셋에 없음 → MD3 토큰만 교체 (기능 유지)

---

## Step 7: 프로필 — StatusDashboard + 페이지 통합

### StatusDashboard 변경점

**소셜 링크 (에셋 기준 — 우측 컬럼):**
- `bg-surface-container-lowest p-8 rounded-xl shadow-sm`
- 각 링크: `bg-surface-container-low px-4 py-2.5 rounded-lg border-l-2`
  - GitHub: `border-on-surface` + `code` 아이콘
  - Blog: `border-primary` + `rss_feed` 아이콘
  - LinkedIn/기타: `border-secondary` + `link` 아이콘
  - Solved.ac: `border-[#FF0076]` + `workspace_premium` 아이콘
- 입력: `bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-medium`

**모바일 소셜 링크:**
- `divide-y divide-surface-container-low/20`
- 각 아이템: `flex items-center justify-between p-4 hover:bg-surface-bright`
- 아이콘 래퍼: `w-8 h-8 rounded-lg bg-surface-container-low`

### 프로필 페이지 (`profile/page.tsx`, `profile/[id]/page.tsx`)

- 변경 최소: ProfileView에 전달하는 props 유지
- 로딩 상태 스켈레톤 MD3 토큰 교체

### ImageEditModal

- Phase 7에서 이미 교체 완료 → **변경 없음** (확인만)

### 변경 요약
1. StatusDashboard: 프로그레스 바 + 소셜 링크 → 독립 소셜 링크 카드 섹션으로 재구성
2. 소셜 링크 입력: border-l 컬러 코딩 + 아이콘 구분
3. 프로필 페이지: 로딩 스켈레톤 토큰 교체
4. 광고 배너: readOnly일 때 표시 위치 조정 (우측 컬럼 하단)

---

## 작업 시 주의사항

### 절대 건드리지 않을 것
| 파일 | 위치 | 이유 |
|------|------|------|
| `ChatWindow.tsx` | Socket.io 이벤트 (subscribe/emit 전체) | 실시간 동기화 핵심 |
| `ChatWindow.tsx` | `pendingMessages` ref + 오프라인 큐 | 네트워크 장애 대비 |
| `ChatWindow.tsx` | `shouldAutoScroll` ref + 스크롤 로직 | 무한 스크롤 UX |
| `ChatWindow.tsx` | 검색 state machine (isSearchOpen~targetMessageId) | 메시지 검색 기능 |
| `useChatSocket.ts` | 전체 훅 | Socket.io 싱글톤 관리 |
| `ProfileView.tsx` | API 호출 + 저장 로직 (handleSave 등) | 데이터 무결성 |
| `ProfileView.tsx` | `readOnly` prop 분기 로직 | 편집/조회 모드 핵심 |
| `AvailabilityScheduler.tsx` | grid ↔ DaySchedule 변환 로직 | 데이터 포맷 |
| `DetailProfileCard.tsx` | `BufferedInput` 디바운스 패턴 | 입력 성능 |
| `SolvedAcCard.tsx` | API 호출 + 데이터 파싱 로직 | 외부 연동 |
| `GitHubStats.tsx` | API 호출 + 통계 계산 로직 | 외부 연동 |

### 모바일 반응형 필수 체크
- 채팅: 목록/윈도우 토글 전환 동작 유지
- 마이페이지: `lg:grid-cols-12` → 모바일 1컬럼
- 프로필: 데스크톱 `grid-cols-12` → 모바일 단일 컬럼 `max-w-md`

### 테스트
- `npm run test:run` 전체 통과 확인
- 채팅: Socket.io 이벤트 발행/수신 동작 확인 (수동)
- 프로필: 편집 모드에서 저장 동작 확인 (수동)
