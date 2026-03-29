## 2026-03-29 — FFLINA-PC (feature/193-eslint-improve) `42e3fea`

> 모델: claude (spm-done 자동생성)

## 작업 요약

ESLint Warning 105건 수정(prefer-const, no-console, no-img-element, no-explicit-any, exhaustive-deps) 및 lint-staged에 ESLint `--max-warnings 0` 활성화로 커밋 시 자동 검사 강제화

## 변경된 파일

- `.lintstagedrc.js` — lint-staged에 `eslint --fix --max-warnings 0` 추가 (커밋 시 Warning 0 강제)
- `.workzones.yml` — SPM 세션 워크존 등록
- `CLAUDE.md` — 진행 현황 표 업데이트
- `src/app/api/chat/messages/[roomId]/route.ts` — let→const, catch any→unknown
- `src/app/api/chat/rooms/route.ts` — any 4건 제거 (catch, forEach, as 캐스트)
- `src/app/api/users/blog/posts/route.ts` — console.log→console.warn
- `src/app/api/users/me/availability/route.ts` — catch any→unknown, console.log→console.warn
- `src/app/dashboard/[pid]/page.tsx` — any 8건→구체적 타입, exhaustive-deps eslint-disable
- `src/app/projects/[pid]/page.tsx` — any 11건→PopulatedAuthor/PopulatedProjectMember 등 인터페이스 정의
- `src/components/admin/AdminDashboard.tsx` — img→Image
- `src/components/admin/AdminProjectDetailModal.tsx` — img→Image, catch any 제거
- `src/components/admin/AdminUserDetailModal.tsx` — img→Image, catch any 제거
- `src/components/admin/TechStackManager.tsx` — img→Image
- `src/components/board/BoardShell.tsx` — img→Image, as any 제거
- `src/components/board/ShortcutHandler.tsx` — console.log 4건 제거
- `src/components/chat/ChatWindow.tsx` — img→Image, any 2건→구체적 타입, exhaustive-deps eslint-disable
- `src/components/dashboard/MemberWidget.tsx` — img→Image
- `src/components/dashboard/ResourceModal.tsx` — img→Image, any 6건→ResourceMetadata/IResource 타입
- `src/components/profile/AvailabilityScheduler.tsx` — console.log→console.warn, startDate deps 추가
- `src/components/profile/DetailProfileCard.tsx` — img→Image
- `src/components/profile/ProfileHeader.tsx` — img→Image (fill), alt undefined fallback
- `src/components/profile/ProfileSummaryCard.tsx` — img→Image (fill), parent relative 추가
- `src/components/profile/ProfileView.tsx` — any 6건→ProfileUserData 인터페이스 정의
- `src/components/profile/ReviewSection.tsx` — img→Image
- `src/components/profile/SkillSection.tsx` — img→Image
- `src/components/profile/external/GitHubStats.tsx` — img→Image
- `src/components/profile/modals/ImageEditModal.tsx` — img→Image (fill)
- `src/components/profile/portfolio/PortfolioCard.tsx` — img→Image (fill)
- `src/components/projects/ProjectList.tsx` — parent relative 추가, catch any→unknown
- `src/components/projects/ProjectThumbnail.tsx` — img→Image (fill)
- `src/components/projects/ReviewModal.tsx` — img→Image
- `src/lib/github/service.ts` — any→GitHubUserResponse, console.log→console.warn
- `src/lib/socket.ts` — console.log→console.warn
- `src/lib/utils/wbs/drawDependencies.ts` — any 6건→WbsTask/LinkValidation 인터페이스, console→console.warn

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: 659 passed / 0 failed (51 files)
- 신규 추가 테스트: 0개 (lint/타입 수정으로 앱 로직 변경 없음)
- 미작성 테스트 및 사유: 없음

## 건드리면 안 되는 부분

| 파일 | 위치 | 이유 |
| ------ | ----------- | ---- |
| ChatWindow.tsx | useEffect (L275, 336, 432) | Socket 연결/해제 로직 — deps 추가 시 무한 재연결 위험으로 eslint-disable 적용 |
| dashboard/[pid]/page.tsx | useEffect (L63, 93) | fetchProject가 deps에 포함되면 매 렌더마다 재실행되므로 eslint-disable 적용 |
| .lintstagedrc.js | eslint --max-warnings 0 | 이 설정 변경 시 커밋 게이트 무력화 위험 |

## 미완성 / 다음 세션에서 이어받을 부분

- 나머지 `no-explicit-any` 236건은 각 파일 수정 시 lint-staged에 의해 점진적으로 제거됨
- 나머지 `exhaustive-deps` 4건은 개별 검토 필요
