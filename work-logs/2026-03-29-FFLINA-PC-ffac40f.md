## 2026-03-29 — FFLINA-PC (feature/198-api-health-log-fix) `ffac40f`

> 모델: claude (spm-done 자동생성)

## 작업 요약

/api/health 로그 분석 후 bind 에러 수정, CI TypeScript 에러 15건 수정, 느린 API 추가 최적화

## 변경된 파일

- `src/middleware.ts` — (삭제) 커스텀 서버(server.ts)와 bind 에러 충돌로 제거
- `src/app/api/admin/stats/route.ts` — Application countDocuments 3개를 aggregation 1개로 통합
- `src/app/api/admin/ai-settings/route.ts` — GET에 .lean() 추가
- `src/app/api/projects/[pid]/route.ts` — views 증가와 데이터 조회를 Promise.all 병렬화
- `src/app/api/projects/route.ts` — sortOptions 타입을 Record<string, 1|-1>로 수정
- `src/app/api/admin/common-codes/route.ts` — catch error.code 타입 안전 처리
- `src/app/api/admin/tech-stacks/[id]/route.ts` — catch error.code 타입 안전 처리
- `src/app/api/admin/tech-stacks/route.ts` — catch error.code 타입 안전 처리
- `src/app/api/auth/register/route.ts` — catch error.code 타입 안전 처리
- `src/app/api/reviews/route.ts` — catch error.code 타입 안전 처리
- `src/app/api/users/[id]/route.ts` — catch error.name/error.message 타입 안전 처리
- `src/app/api/users/github-stats/route.ts` — error.message 접근 타입 안전 처리
- `src/lib/models/Project.ts` — IResource.metadata 타입을 구체적으로 정의 (ResourceModal 에러 해결)
- `src/lib/models/User.ts` — catch error 타입 수정
- `CLAUDE.md` — 현재 작업 현황 표 업데이트

## 테스트 결과

- 실행 명령: `npm run test:run`
- 결과: 659 passed / 0 failed
- 신규 추가 테스트: 0개
- 미작성 테스트 및 사유: 없음 (타입 수정 + 에러 수정, 기존 테스트로 동작 검증 완료)

## 건드리면 안 되는 부분

| 파일 | 위치 | 이유 |
| --- | --- | --- |
| src/lib/models/Project.ts | IResource.metadata 타입 | ResourceModal 등 다수 컴포넌트가 의존, 필드 추가/삭제 시 타입 오류 발생 |
| src/lib/auth.ts | jwt 콜백 .select().lean() | 세션 데이터 필드와 직결, 변경 시 인증 오류 위험 |

## 미완성 / 다음 세션에서 이어받을 부분

없음
