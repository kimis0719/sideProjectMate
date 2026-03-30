## 2026-03-30 — HyunJin (feature/200-redesign-phase0)

> 모델: claude (spm-done 자동생성)

## 작업 요약

SPM 서비스 전면 개편 Phase 0 — 상수 파일 생성, CommonCode DB 초기 데이터 입력, WBS 링크 숨김, 랜딩 문구 변경으로 Phase 1이 의존할 기반 정리

## 변경된 파일

- `src/constants/project.ts` — 신규: PROJECT_STAGES / PROJECT_STATUSES / EXECUTION_STYLES 상수 및 타입 (Phase 1 모델이 import)
- `src/constants/user.ts` — 신규: LAUNCH_STYLES / WORK_STYLES 상수 및 타입, USER_ROLES deprecated 처리
- `src/components/admin/CommonCodeManager.tsx` — GROUPS 배열에 신규 5개 그룹 탭 추가 (DOMAIN / LOOKING_FOR / WORK_STYLE / PROJECT_STAGE / EXECUTION_STYLE), TODO(Phase 7) 주석 추가
- `scripts/seed-common-codes.ts` — 신규: CommonCode 31개 항목 자동 입력 스크립트 (--dry-run / --force 옵션)
- `tsconfig.scripts.json` — 신규: scripts/ 전용 tsconfig (Windows PowerShell 호환)
- `docs/plans/SPM_REDESIGN_PLAN.md` — Phase 7에 7-D 공통코드 그룹 관리 DB화 작업 추가 (CommonCodeGroup 모델 + CRUD API + 하드코딩 해소)
- `src/app/dashboard/[pid]/layout.tsx` — WBS (일정) 네비게이션 링크 주석 처리 (TODO Phase 7 완전 제거)
- `src/components/HeroSection.tsx` — 히어로 슬라이드 3개 및 팀원 매칭 feature 문구를 새 포지셔닝으로 변경 ("아이디어를 빠르게 실행할 동료를 찾아요")
- `.claude/skills/` — Impeccable 스킬 설치 (adapt / animate / arrange / audit 등 디자인 커맨드)

## CommonCode DB 입력 완료 항목

| 그룹 | 항목 수 |
|------|--------|
| DOMAIN | 10개 |
| LOOKING_FOR | 8개 |
| WORK_STYLE | 5개 |
| PROJECT_STAGE | 5개 |
| EXECUTION_STYLE | 3개 |
| **합계** | **31개** |

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: 659 passed / 0 failed (51 files)
- 신규 추가 테스트: 0개 (상수 파일·스크립트·텍스트 변경으로 앱 로직 변경 없음)
- 미작성 테스트 및 사유: 없음

## 건드리면 안 되는 부분

없음 (Phase 0 작업은 상수 파일 생성, 텍스트 변경, 스크립트 추가로 구성 — 강결합/캐시/소켓/Undo 패턴 없음)

## 미완성 / 다음 세션에서 이어받을 부분

- Phase 1 진행 필요: 데이터 모델 개편 (DB 마이그레이션 5건 + ProjectModel / UserModel / ApplicationModel 수정 + API Route 수정)
- Phase 1 시작 전 [CP-1-0] 체크포인트에서 개발자 확인 필수
- CommonCodeManager.tsx GROUPS 하드코딩은 Phase 7에서 DB 동적 로딩으로 전환 예정
