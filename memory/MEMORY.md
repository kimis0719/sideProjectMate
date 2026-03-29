# Side Project Mate - 프로젝트 메모리

## 프로젝트 개요
- Next.js 14 App Router + Express + Socket.io 풀스택 플랫폼
- MongoDB Atlas (Mongoose), next-auth v4, Tailwind CSS, Zustand

## 브랜치 현황
- 현재 브랜치: `130-claude-wbs-refactor`
- 어드민 페이지 개발 진행 중 (admin-page-plan.md 참조)
- Phase 1 완료 (기반 작업)
- Phase 2 완료 (핵심 관리 기능)
- Phase 3 완료 (통계 대시보드)

## WBS 개편 완료 현황 (WBS_REDESIGN.md 기준)
- **Phase 1** (버그 수정): 완료
  - FIX-1: batch/route.ts 의존관계 쿼리 수정
  - FIX-2: API 응답 형식 통일 ({ success, data })
  - FIX-3: addTask selectedTaskId Optimistic Update 버그 수정
  - FIX-4: GanttChart 타이머 cleanup
- **Phase 2** (UX 개선): 완료
  - TaskPanel.tsx 신규 생성 (TaskForm + DependencySettingModal 통합)
  - WbsPage 레이아웃 재구성 (페이지 제목 "일정 관리")
  - TaskList 슬림화 (접기/펴기, 인라인 편집 제거)
  - TaskForm.tsx, DependencySettingModal.tsx 삭제
- **Phase 3** (GanttChart 재구현): 완료
  - gantt-task-react 라이브러리 제거 (소스 임포트 없음, package.json만 잔류)
  - GanttHeader.tsx 신규 생성 (Day/Week/Month 뷰 2행 헤더)
  - GanttBar.tsx 신규 생성 (드래그 날짜 조정, 마일스톤 다이아몬드, 충돌 표시)
  - GanttArrows.tsx 신규 생성 (FS/SS/FF 의존관계 화살표)
  - GanttChart.tsx 완전 재작성 (커스텀 SVG, sticky 좌측 패널, 오늘 세로선)
- **Phase 4** (실시간 협업): 완료
  - server.ts에 WBS 전용 소켓 이벤트 추가 (join/leave-wbs-project, wbs-create/update/delete-task)
  - wbsStore.ts에 initSocket/cleanupSocket 액션 추가, CRUD 성공 후 소켓 broadcast
  - WbsPage에 initSocket(mount) / cleanupSocket(unmount) 호출

## 주요 파일 경로
- WBS 페이지: `src/app/dashboard/[pid]/wbs/page.tsx`
- WBS 컴포넌트: `src/components/wbs/` (GanttChart, GanttHeader, GanttBar, GanttArrows, TaskPanel, TaskList)
- WBS Store: `src/store/wbsStore.ts`
- WBS API: `src/app/api/wbs/tasks/` (route.ts, [taskId]/route.ts, batch/route.ts)
- 스케줄 충돌 유틸: `src/lib/utils/wbs/scheduleConflict.ts`
- 미사용 파일: `src/lib/utils/wbs/drawDependencies.ts` (GanttChart 재작성으로 더 이상 참조 없음)

## GanttChart 아키텍처 (Phase 3 결과)
- 레이아웃: 외부 overflow-auto + sticky 헤더(top) + sticky 좌측 패널(left)
- 좌측 패널: 작업명 HTML 목록 (width=220px, sticky left-0)
- 헤더 SVG: GanttHeader 컴포넌트 (별도 SVG, sticky top-0)
- 바디 SVG: GanttBar(작업 바) + GanttArrows(의존 화살표) + 오늘선
- 드래그: clientX delta → days delta → onDateChange 콜백
- 충돌: checkAllScheduleConflicts → conflictTaskIds Set → 주황 테두리 + ⚠ 아이콘
- 뷰 모드 픽셀: Day=30px/일, Week=14px/일, Month=5px/일

## 어드민 페이지 (admin-page-plan.md)
- Phase 1 완료: User.ts enum 확장, next-auth.d.ts memberType, auth.ts delYn 체크, adminAuth.ts 신규, admin 레이아웃/사이드바
- 신규 파일: `src/lib/adminAuth.ts` (requireAdmin 유틸)
- 관리자 레이아웃: `src/app/admin/layout.tsx` (서버 컴포넌트, getServerSession으로 인증 가드)
- 사이드바: `src/components/admin/AdminSidebar.tsx` (클라이언트 컴포넌트, usePathname active 표시)
- 서브 페이지: /admin/users (UserManageTable), /admin/projects (ProjectModerateTable), /admin/common-codes (CommonCodeManager), /admin/tech-stacks (TechStackManager)
- Phase 2 API: /api/admin/common-codes, /api/admin/tech-stacks, /api/admin/users, /api/admin/projects (모두 requireAdmin 사용)
- User.delYn: Boolean 타입 (true = 비활성화), 로그인 시 `delYn === true` 체크

## 테스트 환경 (Phase 1 설정 완료)
- 테스트 러너: Vitest v4.0.18 + @vitest/coverage-v8
- 설정 파일: `vitest.config.ts` (루트, `resolve.alias`로 `@/` 별칭 연결)
- 전역 setup: `src/__tests__/setup.ts` (afterEach vi.restoreAllMocks)
- 테스트 파일 위치: 원본 파일 바로 옆 (`*.test.ts`)
- scripts: test / test:run / test:coverage / test:watch
- Phase 1 Step 1-1~1-5 완료 (181개 테스트 전부 통과)
- 테스트 파일: taskDependency.test.ts(59), scheduleConflict.test.ts(52), iconUtils.test.ts(43), profileUtils.test.ts(27)

## 코딩 컨벤션 요약
- `@/` 경로 별칭 필수
- API Route: `{ success, data | message | error }` 형식
- 클라이언트 컴포넌트: 파일 최상단 `'use client'` 선언
- 전역 모달: `useModal` 훅 사용 (window.alert 금지)
- Zustand 스토어: devtools 미들웨어 필수
