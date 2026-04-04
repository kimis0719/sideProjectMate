# Phase 5 — 프로젝트 페이지 디자인 교체 상세 기획서

> 이슈: #253
> 브랜치: `feature/253-uiux-phase5-project-pages`
> 작성일: 2026-04-04

---

## 사용자 컨펌 완료 사항

| 항목 | 결정 |
|------|------|
| 사이드바 | ✅ `/projects` 전체에 사이드바 추가. 공통 SidebarShell 추출 후 `/dashboard/[pid]` 리팩토링 |
| 필터 UI | ✅ 검색에 도메인 통합 + chip 필터 3개(상태/단계/실행방식) 유지. 도메인 별도입력·주당시간 삭제 |
| 프로젝트 생성 | ✅ 4단계 위자드 (핵심정보/진행현황/매칭조건/부가정보). 기존 폼 분할, 기능 추가 최소화 |
| 대시보드 위젯 | ✅ Sprint Pulse + Recent Chat 위젯 신규 추가 |
| 사이드바 광고 | ✅ 사이드바 하단에 AdBanner 추가 |
| 메뉴 관리 | ✅ 하드코딩 유지 (config 배열로 정리) |

---

## 전체 대상 화면 (8개 + 레이아웃 2개)

| # | 라우트 | 파일 | 줄 수 | 분류 |
|---|--------|------|-------|------|
| 5-0 | 공통 | `src/components/common/SidebarShell.tsx` | 신규 | 공통 사이드바 셸 |
| 5-1 | `/projects` | `ProjectList.tsx` (380) + `ProjectCard.tsx` (149) | 529 | 디자인 교체 + 필터 정리 |
| 5-2 | `/projects/[pid]` | `projects/[pid]/page.tsx` | 850 | 디자인 교체 |
| 5-3 | `/projects/new` | `projects/new/page.tsx` | 653 | 4단계 위자드 변환 |
| 5-4 | `/projects/[pid]/edit` | `projects/[pid]/edit/page.tsx` | 739 | 디자인 교체 (5-3과 동일 패턴) |
| 5-5 | `/projects/[pid]/manage` | `projects/[pid]/manage/page.tsx` | 388 | 디자인 교체 |
| 5-6 | `/dashboard` | `dashboard/page.tsx` | 113 | 디자인 교체 |
| 5-7 | `/dashboard/[pid]` | `dashboard/[pid]/page.tsx` (350) + 하위 3개 | ~700 | 디자인 교체 + 위젯 추가 |
| 5-8 | 레이아웃 | `projects/layout.tsx` (신규) + `dashboard/[pid]/layout.tsx` (282) 리팩토링 | ~350 | SidebarShell 적용 |

---

## 공통 디자인 패턴

### No-Line Rule
- `border-border` → 삭제 또는 `border-outline-variant/10`으로 최소화
- 구조 분리는 background 색상 차이로 표현

### 컬러 토큰 교체표

| 기존 (shadcn) | 신규 (MD3) |
|---------------|------------|
| `bg-background` | `bg-surface` |
| `bg-muted/30` | `bg-surface-container-low` |
| `bg-card` | `bg-surface-container-lowest` |
| `text-foreground` | `text-on-surface` |
| `text-muted-foreground` | `text-on-surface-variant` |
| `border-border` | 삭제 (No-Line) 또는 `border-outline-variant/10` |
| `border-input` | `border-none` + `bg-surface-container-low` |
| `bg-primary` | `bg-primary-container` |
| `text-primary-foreground` | `text-on-primary` |
| `bg-destructive` | `bg-error` |
| `text-destructive` | `text-error` |
| `hover:bg-muted` | `hover:bg-surface-container-high` |

### 입력 필드
```
bg-surface-container-lowest border-none rounded-xl
focus:ring-2 focus:ring-primary/20
placeholder:text-on-surface-variant/30
```

### 버튼
- Primary: `bg-primary-container text-on-primary rounded-lg font-bold`
- Secondary: `bg-surface-container-high text-on-surface-variant rounded-lg`
- Destructive: `bg-error-container/10 text-error rounded-lg`

### 카드
```
bg-surface-container-lowest rounded-xl
shadow-[0_20px_40px_rgba(26,28,28,0.04)]
```

### 아이콘
- SVG 아이콘 → Material Symbols Outlined (`<span className="material-symbols-outlined">`)
- 이미 layout.tsx에 Material Symbols 폰트 링크 추가됨 (Phase 4)

---

## 5-0: 공통 사이드바 셸 (SidebarShell)

### 신규 파일
- `src/components/common/SidebarShell.tsx`

### 설계

기존 `dashboard/[pid]/layout.tsx`의 사이드바 시스템을 추출하여 재사용 가능한 컴포넌트로 만듦.

```tsx
interface SidebarMenuItem {
  href: string;
  icon: string;       // Material Symbols icon name
  label: string;
}

interface SidebarShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  menuItems: SidebarMenuItem[];
  ctaButton?: { href: string; label: string; icon: string };
  showAdBanner?: boolean;
  adBannerUnitId?: string;
  hideSidebarTrigger?: boolean;  // 칸반 등에서 트리거 숨김
}
```

### 사이드바 메뉴 (하드코딩 config)

**`/projects` 사이드바:**
| 아이콘 | 라벨 | 링크 |
|--------|------|------|
| `grid_view` | 모든 프로젝트 | `/projects` |
| `workspaces` | 내 워크스페이스 | `/dashboard` |
| CTA 버튼 | 새 프로젝트 생성 | `/projects/new` |
| 하단 | AdBanner (sidebar 사이즈) | — |

**`/dashboard/[pid]` 사이드바:**
| 아이콘 | 라벨 | 링크 |
|--------|------|------|
| `dashboard` | 대시보드 홈 | `/dashboard/[pid]` |
| `view_kanban` | 칸반보드 | `/dashboard/[pid]/kanban` |
| `group` | 멤버관리 | `/projects/[pid]/manage` |
| 하단 | AdBanner (sidebar 사이즈) | — |

### 레이아웃 구조
```
데스크톱: flex → aside(w-64 sticky) + main(flex-1)
모바일: 드로어(slide-in) + 플로팅 트리거 버튼
칸반 페이지: 사이드바 트리거 숨김
```

### 디자인 (에셋 기준)
- 배경: `bg-surface-container-low`
- 메뉴 활성: `bg-surface-container-lowest text-primary rounded-lg shadow-sm`
- 메뉴 비활성: `text-on-surface-variant hover:bg-surface-container-lowest/50`
- 아이콘: Material Symbols Outlined (20px)
- CTA 버튼: `bg-primary-container text-on-primary rounded-lg font-bold`
- 하단 광고: AdBanner + `mt-auto` 배치

---

## 5-1: 프로젝트 목록

### 대상 파일
- `src/app/projects/page.tsx` (25줄) — 변경 없음 (wrapper)
- `src/app/projects/layout.tsx` — **신규 생성** (SidebarShell 적용)
- `src/components/projects/ProjectList.tsx` (380줄) — 디자인 교체 + 필터 정리
- `src/components/projects/ProjectCard.tsx` (149줄) — 부분 교체

### 에셋 참조
- `docs/assets/pages/05_project_list_pc.html`

### 필터 변경 (기능 수정)

**삭제:**
- 도메인 별도 텍스트 입력 (검색에 통합)
- 주당 시간 필터 (chip 행 전체 삭제)

**유지 (디자인만 교체):**
- 검색바 (도메인도 검색 가능하도록 API 수정 필요)
- 상태 chip (전체/모집중/진행중/완료/일시중지)
- 단계 chip (idea/prototype/mvp/beta/launched)
- 실행 방식 chip (ai_heavy/balanced/traditional)
- 정렬 select (최신순/마감임박순)

### 디자인 변경 사항

#### ProjectList.tsx
| 영역 | 현재 | 에셋 기준 변경 |
|------|------|---------------|
| 필터 영역 배경 | `bg-muted/30 border-b border-border` | `bg-surface-container-low rounded-xl` (border 삭제) |
| 검색 input | `border border-input rounded-lg bg-background` | `bg-surface-container-lowest border-none rounded-xl focus:ring-2 focus:ring-primary pl-12` |
| 검색 아이콘 | SVG | `material-symbols-outlined search` |
| 정렬 select | `border border-input rounded-lg bg-background` | `bg-surface-container-lowest border-none rounded-lg` |
| 필터 초기화 | `border border-input rounded-lg bg-background` | `bg-surface-container-high text-on-surface-variant rounded-lg` |
| chip (비활성) | `bg-background border-border` | `bg-surface-container-high` (border 삭제) |
| chip (활성) | 색상별 다름 | `bg-primary text-on-primary` (통일) |
| 헤더 "전체 프로젝트" | `text-2xl font-bold text-foreground` | `text-3xl font-headline font-bold text-on-surface` |
| "새 프로젝트 만들기" 버튼 | `bg-primary text-primary-foreground` | `bg-primary-container text-on-primary rounded-lg` |
| 카드 그리드 | `grid-cols-1 sm:2 md:3 lg:4` | `grid-cols-1 md:2 xl:3 gap-8` |
| 페이지네이션 | `border border-border rounded-lg` | `bg-surface-container-high rounded-lg` (border 삭제) |

#### ProjectCard.tsx
이미 Phase 2에서 부분 교체됨. 추가:

| 영역 | 현재 | 변경 |
|------|------|------|
| hover | `hover:bg-surface-bright hover:shadow-ambient` | `hover:shadow-[0_20px_40px_rgba(26,28,28,0.04)] hover:-translate-y-1 transition-all duration-300` |

### 건드리면 안 되는 코드
| 위치 | 이유 |
|------|------|
| `useSearchParams`, `updateUrlParams` | URL 파라미터 기반 필터 로직 |
| `fetchProjects` useEffect | API fetch 로직 |
| `useApplicationStore` 연동 | 지원 상태 조회 |
| `toggleMultiParam` | 다중 필터 토글 로직 |

---

## 5-2: 프로젝트 상세

### 대상 파일
- `src/app/projects/[pid]/page.tsx` (850줄) — 디자인 교체

### 에셋 참조
- `docs/assets/pages/06_project_detail_pc.html`

### 변경 사항

| 영역 | 현재 | 에셋 기준 변경 |
|------|------|---------------|
| 페이지 배경 | `bg-background` | `bg-surface` |
| "목록으로" 링크 | SVG chevron | `material-symbols-outlined arrow_back` |
| 관리 버튼들 | `bg-blue-500/bg-gray-200/bg-red-500` | `bg-primary-container/bg-surface-container-high/bg-error-container` |
| status 배지 모집중 | `bg-blue-100 text-blue-800` | `bg-emerald-100 text-emerald-800` |
| 제목 | `text-3xl md:text-4xl` | `text-4xl md:text-5xl font-extrabold font-headline tracking-tight` |
| 메타 정보 | SVG 아이콘 | Material Symbols + `text-on-surface-variant` |
| 그리드 | `lg:grid-cols-3 gap-8` | `lg:grid-cols-12 gap-12` (8:4) |
| 프로젝트 동기 | `bg-muted/30 border border-border` | `bg-surface-container-low rounded-xl` |
| 사이드바 카드 | `bg-card border border-border` | `bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.04)]` |
| 사이드바 상단 | "프로젝트 요약" 제목 | 소유자 아바타+이름+"프로젝트 개설자" (에셋) |
| 요약 정보 | label + text | Material Symbols 아이콘 + label + bold 값 |
| 지원하기 버튼 | `bg-primary` | `bg-primary-container text-on-primary py-4 shadow-lg shadow-primary-container/20` |
| 문의하기 버튼 | `border border-border` | `bg-surface-container text-on-surface-variant` |

### 건드리면 안 되는 코드
| 위치 | 이유 |
|------|------|
| `handleLike/Delete/Inquiry` | API 통신 |
| `handleOpenApplyModal/Withdraw/LeaveProject` | 지원/탈퇴 플로우 |
| `applyState` 6가지 분기 | 버튼 상태 로직 |
| `ApplyModal`, `ReviewModal` | Phase 7 완료 |

---

## 5-3: 프로젝트 생성 (4단계 위자드)

### 대상 파일
- `src/app/projects/new/page.tsx` (653줄) — 위자드 변환 + 디자인 교체

### 에셋 참조
- `docs/assets/pages/07_project_create_pc.html`

### 위자드 4단계 분할

기존 한 페이지 폼의 4개 `<section>`을 step 상태로 분기:

| Step | 섹션 | 내용 |
|------|------|------|
| 1 | 핵심 정보 | 제목, 프로젝트 동기 |
| 2 | 진행 현황 | 현재 단계, 실행 방식, 주당 시간 |
| 3 | 매칭 조건 | 도메인, 찾는 사람, 최대 팀원 수 |
| 4 | 부가 정보 | 상세 설명, 기술스택, 기간, 링크, 이미지 |

### 위자드 UI
- Step indicator: `bg-surface-container-low p-6 rounded-xl` 에셋 기준
- 활성 step: 번호 `bg-primary-container text-on-primary rounded-lg`
- 비활성 step: `text-on-surface-variant/40`
- "다음 단계" 버튼: `bg-primary-container text-on-primary` + Material Symbols `arrow_forward`
- "이전" 버튼: `text-primary hover:bg-primary-container/5`
- Step 4에서 "프로젝트 생성하기" 최종 제출

### 디자인 변경 (공통 패턴 적용)
- 모든 input/textarea: `bg-surface-container-lowest border-none rounded-xl focus:ring-2 focus:ring-primary`
- 라벨: `text-sm font-bold uppercase tracking-widest text-primary font-label`
- 선택 카드: `bg-surface-container-low rounded-xl` / 활성: `ring-2 ring-primary`
- chip: `bg-surface-container-high` / 활성: `bg-primary-container text-on-primary`

### 건드리면 안 되는 코드
| 위치 | 이유 |
|------|------|
| `handleSubmit` | Cloudinary 업로드 + API POST |
| `SortableImage/DragOverlay` | dnd-kit 드래그 정렬 |
| `fetchCodes` useEffect | CommonCode API |
| `TagInput` | Phase 2 완료 |

---

## 5-4: 프로젝트 수정

### 대상 파일
- `src/app/projects/[pid]/edit/page.tsx` (739줄) — 디자인 교체

### 에셋 참조
- 5-3과 동일 패턴 (07_project_create_pc.html)

### 변경 사항
5-3 프로젝트 생성과 **동일한 디자인 패턴** 적용.
단, 위자드 대신 한 페이지 폼 유지 가능 (수정은 전체 필드를 한 번에 보는 것이 편리).
→ 디자인 토큰만 교체하고 레이아웃은 기존 유지.

### 건드리면 안 되는 코드
| 위치 | 이유 |
|------|------|
| `handleSubmit` | API PUT + 이미지 업로드 |
| 이미지 관리 로직 | 기존 이미지 + 새 이미지 혼합 관리 |
| `fetchProject` | 기존 데이터 로딩 |

---

## 5-5: 멤버 관리

### 대상 파일
- `src/app/projects/[pid]/manage/page.tsx` (388줄) — 디자인 교체

### 에셋 참조
- `docs/assets/pages/08_member_manage_pc.html`

### 변경 사항

| 영역 | 현재 | 변경 |
|------|------|------|
| 제목 | `text-3xl font-bold` | `text-4xl font-bold font-headline tracking-tight` |
| 멤버 그리드 | `grid-cols-1 md:2 lg:3` | `grid-cols-1 md:2 xl:4 gap-6` |
| 지원자 카드 | `bg-card border border-border` | `bg-surface-container-lowest rounded-xl border-l-4 border-primary` |
| 지원 동기 | `bg-muted/30 rounded-lg` | `border-l-4 border-primary/20 pl-6 italic` |
| 수락 버튼 | `bg-green-500` | `bg-primary-container text-on-primary` + `check_circle` |
| 거절 버튼 | `bg-orange-500` | `bg-error-container/10 text-error` + `cancel` |
| 대화하기 | `bg-blue-100` SVG | `bg-surface-container-low` + `chat_bubble` |
| 거절된 카드 | 동일 | `opacity-70 grayscale-[0.5] hover:grayscale-0 hover:opacity-100` |

### 건드리면 안 되는 코드
| 위치 | 이유 |
|------|------|
| `handleStatusChange/SaveOwnerNote/DeleteApplication` | API 로직 |
| 대화하기 onClick | chat API 연동 |

---

## 5-6: 대시보드 홈

### 대상 파일
- `src/app/dashboard/page.tsx` (113줄) — 디자인 교체

### 변경 사항
- 토큰 교체 (공통 패턴 적용)
- 프로젝트 카드가 ProjectCard 사용 시 → 5-1에서 이미 교체됨

---

## 5-7: 프로젝트 대시보드

### 대상 파일
- `src/app/dashboard/[pid]/page.tsx` (350줄) — 디자인 교체 + 위젯 추가
- `src/components/dashboard/ProjectHeader.tsx` — 디자인 교체
- `src/components/dashboard/ProjectOverview.tsx` — 디자인 교체
- `src/components/dashboard/MemberWidget.tsx` — 디자인 교체

### 에셋 참조
- `docs/assets/pages/09_dashboard_pc.html`

### 변경 사항

| 영역 | 현재 | 변경 |
|------|------|------|
| 그리드 | `lg:grid-cols-4` | `md:grid-cols-12` (Bento grid) |
| 팀 채팅 버튼 | `bg-indigo-500` | `bg-primary-container text-on-primary` |
| 하위 컴포넌트 | 각각 토큰 교체 | MD3 토큰 |

### 신규 위젯 (에셋 기준)

**Sprint Pulse:**
- 칸반 노트 상태별 진행률 바 (할 일/진행 중/완료)
- `bg-surface-container-lowest rounded-xl`
- 칸반 보드 링크

**Recent Chat:**
- 최근 채팅 메시지 미리보기 (2~3개)
- 채팅 입력 필드 (placeholder)
- 채팅 페이지 링크

### 건드리면 안 되는 코드
| 위치 | 이유 |
|------|------|
| `fetchProject`, Socket.io | 데이터/실시간 동기화 |
| CRUD 핸들러 | API + Socket 연동 |
| ResourceModal | Phase 7 완료 |

---

## 5-8: 레이아웃 리팩토링

### 대상 파일
- `src/app/projects/layout.tsx` — **신규 생성**
- `src/app/dashboard/[pid]/layout.tsx` (282줄) — SidebarShell로 리팩토링

### 변경 사항
1. 기존 `SidebarContent`를 `SidebarShell`로 추출
2. `/projects/layout.tsx` 신규 → SidebarShell + 프로젝트 메뉴
3. `/dashboard/[pid]/layout.tsx` → SidebarShell + 대시보드 메뉴 (권한체크 유지)

---

## 작업 순서

```
Step 0: SidebarShell 공통 컴포넌트 + projects/layout.tsx + dashboard layout 리팩토링
Step 1: 5-1 프로젝트 목록 (필터 정리 + 디자인) → 사용자 확인
Step 2: 5-2 프로젝트 상세 → 사용자 확인
Step 3: 5-3 프로젝트 생성 (위자드 변환) → 사용자 확인
Step 4: 5-4 프로젝트 수정 (토큰 교체) → 사용자 확인
Step 5: 5-5 멤버 관리 → 사용자 확인
Step 6: 5-6 대시보드 홈 → 사용자 확인
Step 7: 5-7 프로젝트 대시보드 (위젯 추가) → 사용자 확인
Step 8: 5-8 레이아웃 리팩토링 (SidebarShell 적용)
```

> 단, Step 0(SidebarShell)을 먼저 만들고 → Step 8(레이아웃 적용)은 다른 Step과 병행 가능

---

## 의존성

- Phase 7 완료 ✅ (ApplyModal, ReviewModal, ResourceModal 이미 교체)
- Phase 2 완료 ✅ (TagInput, EmptyState, ProjectThumbnail 등 공통 컴포넌트)
- Phase 1 완료 ✅ (디자인 토큰, globals.css)

## API 수정 필요 사항

- `GET /api/projects` — 검색 파라미터(`search`)에 도메인 필드도 포함하도록 수정
