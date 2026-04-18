## 2026-04-18 — FFLINA-PC (feature/SPM-13-start) `cdcd7db`

> 모델: codex (spm-done 수동 생성)

## 작업 요약

대시보드 사이드바에서 권한 없는 사용자에게 노출되던 `멤버관리` 메뉴를 소유자 전용으로 제한하고, 메뉴 규칙 테스트를 동기화했다.

## 변경된 파일

- `src/app/dashboard/[pid]/layout.tsx`
  - `멤버관리`, `프로젝트 설정` 메뉴를 `isOwner` 조건으로만 노출하도록 변경
- `src/components/common/SidebarShell.test.ts`
  - 대시보드 메뉴 생성 규칙을 소유자/일반 멤버 케이스로 분리해 검증하도록 수정
- `CLAUDE.md`
  - "현재 진행 중인 작업 현황" 표를 기본 상태로 복원
- `tsconfig.tsbuildinfo`
  - 타입 체크 실행으로 인한 빌드 메타데이터 갱신

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: 581 passed / 0 failed
- 실행 명령: `npx tsc --noEmit`
- 결과: 통과
- 신규 추가 테스트: 0개
- 미작성 테스트 및 사유: 없음

## 건드리면 안 되는 부분

| 파일 | 위치 | 이유 |
| --- | --- | --- |
| `src/app/dashboard/[pid]/layout.tsx` | `menuItems` 구성부 | 메뉴 권한 조건(`isOwner`)을 제거하거나 완화하면 SPM-13 이슈가 재발할 수 있음 |

## 미완성 / 다음 세션에서 이어받을 부분

없음
