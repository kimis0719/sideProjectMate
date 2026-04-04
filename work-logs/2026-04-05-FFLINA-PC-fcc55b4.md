## 2026-04-05 — FFLINA-PC (feature/253-uiux-phase5-project-pages) `fcc55b4`

> 모델: claude (spm-done 자동생성)

## 작업 요약

UI/UX 전면 개편 Phase 5 — 프로젝트 관련 8개 화면 디자인 교체 + 공통 SidebarShell + 좋아요 토글 + 4단계 위자드 + 대시보드 위젯 기획서

## 변경된 파일

### 공통 컴포넌트
- `src/components/common/SidebarShell.tsx` — 공통 사이드바 셸 신규 (데스크톱 고정 + 모바일 드로어 + AdBanner)
- `src/components/common/SidebarShell.test.ts` — 메뉴 config/isActive/hideTrigger 로직 테스트
- `src/components/common/TagInput.tsx` — Tab키로 태그 추가 기능
- `src/components/common/TagInput.test.ts` — addTag/키 입력/위자드 canProceed 테스트 (13개)

### 프로젝트 목록 (5-1)
- `src/app/projects/layout.tsx` — 프로젝트 사이드바 레이아웃 신규
- `src/app/projects/page.tsx` — AdBanner 사이드바로 이동, 토큰 교체
- `src/components/projects/ProjectList.tsx` — 필터 정리 (도메인·주당시간 삭제) + MD3 토큰
- `src/components/projects/ProjectCard.tsx` — hover 효과 + ASIS 포인트색 → primary-container + "N명 원함"

### 프로젝트 상세 (5-2)
- `src/app/projects/[pid]/page.tsx` — MD3 전면 교체 (12칸 그리드, 소유자 프로필 카드, Material Symbols, break-all)
- `src/app/api/projects/[pid]/like/route.ts` — 좋아요 토글 재설계 ($addToSet/$pull + likedBy 배열)
- `src/lib/models/Project.ts` — likedBy 필드 추가
- `src/components/ProjectImageSlider.tsx` — 5초 무한루프 + 썸네일 인디케이터 + 1개 이미지 버그 수정
- `src/components/projects/ProjectThumbnail.tsx` — priority prop 추가 (LCP 경고 해결)

### 프로젝트 생성 (5-3)
- `src/app/projects/new/page.tsx` — 4단계 위자드 변환 (핵심/진행/매칭/부가) + MD3 토큰

### 프로젝트 수정 (5-4)
- `src/app/projects/[pid]/edit/page.tsx` — MD3 토큰 교체 (생성과 스타일 싱크)

### 멤버 관리 (5-5)
- `src/app/projects/[pid]/manage/page.tsx` — 지원자 카드 상태별 border 색상 + 인용 스타일 + MD3 토큰
- `src/components/projects/ApplyModal.tsx` — disabled 버튼 가시성 개선 + 경고 메시지 위치 이동

### 대시보드 홈 (5-6)
- `src/app/dashboard/page.tsx` — MD3 토큰 + 단계 배지 + 날짜 추가

### 프로젝트 대시보드 (5-7)
- `src/app/dashboard/[pid]/page.tsx` — Bento grid + 팀 채팅 버튼 MD3
- `src/app/dashboard/[pid]/layout.tsx` — SidebarShell로 리팩토링 (권한체크 유지)
- `src/components/dashboard/ProjectHeader.tsx` — 상태 배지 MD3 토큰
- `src/components/dashboard/ProjectOverview.tsx` — 카드 스타일 MD3
- `src/components/dashboard/MemberWidget.tsx` — 아바타 40px + emerald 온라인 점

### 문서
- `docs/plans/PHASE_5_PROJECT_PAGES_SPEC.md` — 상세 기획서 신규
- `docs/plans/PHASE_5_5_DASHBOARD_WIDGETS_SPEC.md` — 대시보드 위젯 기획서 신규
- `docs/plans/UIUX_DEVELOPMENT_SPEC.md` — Phase 5.5 일정 추가

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: 501 passed / 0 failed
- 신규 추가 테스트: 23개
  - `src/components/common/SidebarShell.test.ts` (10개)
  - `src/components/common/TagInput.test.ts` (13개)
- 미작성 테스트 및 사유: 없음

## 건드리면 안 되는 부분

| 파일 | 위치 | 이유 |
|------|------|------|
| like/route.ts | $addToSet/$pull 토글 로직 | likedBy 배열 조작 — 순서 변경 시 좋아요 데이터 불일치 |
| Project.ts | likedBy 필드 | 좋아요 API와 쌍으로 동작 — 필드 삭제/변경 금지 |
| SidebarShell.tsx | showAd prop 분기 | 데스크톱/모바일 광고 중복 방지 로직 |
| dashboard/[pid]/layout.tsx | 권한 체크 useEffect | owner/member 접근 제어 — 로직 변경 시 보안 위험 |
| MemberWidget.tsx | Socket.io member-online/offline | 실시간 온라인 상태 동기화 — 이벤트 핸들러 변경 금지 |

## 미완성 / 다음 세션에서 이어받을 부분

- Phase 5.5 대시보드 위젯 (Sprint Pulse + Recent Chat) — 기획서 완료, 개발 미착수
- 즐겨찾기 페이지 (`/projects/favorites`) — 사이드바 메뉴만 추가, 페이지 미구현
