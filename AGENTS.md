# AGENTS.md — Side Project Mate (OpenAI Codex용)

> 이 파일은 `CLAUDE.md`와 동일한 프로젝트 규칙을 OpenAI Codex 에이전트에게 전달합니다.
> Claude Code 팀원과 **동일한 품질·컨벤션·워크플로우**를 유지하는 것이 목표입니다.

---

## 프로젝트 핵심 정보

- **스택**: Next.js 14 / TypeScript / MongoDB(Mongoose) / Zustand / Socket.io / Tailwind
- **서버**: `server.ts` (Express + Socket.io) 위에서 Next.js App Router 구동
- **배포**: Render.com (`render.yaml`) — `main` 브랜치 push 시 자동 배포
- **경로 별칭**: `@/` → `src/` (항상 `@/` 사용, 상대경로 금지)

---

## 컨텍스트 로딩 (매 세션 필수)

### 항상 읽을 것

1. `.workzones.yml` — 다른 팀원의 작업 구역 확인 (충돌 방지)
2. `work-logs/` 최신 3개 — 팀원 최근 작업 파악

### 작업 유형별 추가 로딩

| 작업             | 읽을 파일                                        |
| ---------------- | ------------------------------------------------ |
| API 작업         | `src/app/api/MAP.md` → 해당 도메인 `MAP.md`      |
| AI 기능 작업     | `src/app/api/ai/MAP.md`                          |
| 칸반 작업        | `src/app/api/kanban/MAP.md` + `src/store/MAP.md` |
| 프로젝트 작업    | `src/app/api/projects/MAP.md`                    |
| 유저/프로필 작업 | `src/app/api/users/MAP.md`                       |
| WBS 작업         | `src/app/api/wbs/MAP.md`                         |
| 채팅 작업        | `src/app/api/chat/MAP.md`                        |
| 모델 작업        | `src/lib/models/MAP.md`                          |
| 스토어 작업      | `src/store/MAP.md`                               |
| 컨벤션 확인      | `docs/conventions.md`                            |
| 아키텍처 확인    | `docs/architecture.md`                           |
| 테스트 작성      | `docs/testing-guide.md`                          |

---

## API Route 필수 패턴

```ts
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// 핸들러는 export 하지 않고, withApiLogging 래퍼로 감싸서 export
async function _GET(request: NextRequest) {
  await dbConnect();
  // 인증 필요 시:
  const session = await getServerSession(authOptions);
  if (!session?.user?._id)
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  // 읽기 전용 쿼리는 반드시 .lean() 사용
  const data = await Model.find(query).lean();
  // 성공 응답:
  return NextResponse.json({ success: true, data });
}

export const GET = withApiLogging(_GET, '/api/도메인/경로');
```

> **예외**: Streaming 응답(`Response` 반환) API는 래퍼 적용 불가

---

## 코드 생성 체크리스트

- [ ] `'use client'` 선언 (클라이언트 컴포넌트)
- [ ] API Route: `dynamic` + `dbConnect()` + 인증 체크 + `withApiLogging` 래퍼
- [ ] API Route: 읽기 전용 쿼리에 `.lean()` 사용
- [ ] 응답 형식 `{ success, data | message }` 통일
- [ ] Mongoose 모델 중복 등록 방지 패턴: `mongoose.models.X || mongoose.model(...)`
- [ ] Zustand 스토어에 `devtools` 미들웨어
- [ ] Socket `socket.off()` cleanup 등록
- [ ] `@/` 경로 별칭 사용 / `any` 타입 금지
- [ ] 독립 쿼리 2개 이상이면 `Promise.all()` 병렬 실행
- [ ] 무제한 조회 API에 페이지네이션(`.limit()`) 적용

---

## 파일 네이밍 규칙

| 대상            | 규칙                      | 예시                              |
| --------------- | ------------------------- | --------------------------------- |
| React 컴포넌트  | PascalCase                | `BoardShell.tsx`, `NoteItem.tsx`  |
| 훅              | camelCase, `use` 접두어   | `useModal.ts`, `useChatSocket.ts` |
| 스토어          | camelCase, `Store` 접미어 | `boardStore.ts`, `wbsStore.ts`    |
| 유틸/라이브러리 | camelCase                 | `iconUtils.ts`, `profileUtils.ts` |
| Mongoose 모델   | PascalCase, 단수형        | `User.ts`, `Project.ts`           |

---

## 코드 스타일

- **들여쓰기**: 2 spaces
- **세미콜론**: 있음
- **따옴표**: 문자열 `'`, JSX attribute `"`
- **타입**: `any` 금지. 기존 인터페이스 활용 또는 `src/types/`에 추가

---

## 테스트 체크리스트

- [ ] 코드 추가/수정 시 `*.test.ts` 파일 함께 생성
- [ ] `npm run test:run` 전체 통과 확인
- [ ] 기존 `src/__tests__/fixtures/` fixture 재사용
- [ ] 테스트 파일은 원본 파일 바로 옆에 배치 (별도 폴더 금지)
- [ ] 상세 패턴: `docs/testing-guide.md` 참조

### 테스트 Phase별 기준

| Phase | 대상 | 필수 커버리지 |
|-------|------|--------------|
| 1 | `src/lib/utils/**` 순수 함수 | 정상 3개 + 엣지 2개 + 실패 1개 |
| 2 | `src/store/**`, `src/hooks/**` | fetch 성공/실패, 낙관적 업데이트, 소켓 emit |
| 3 | `src/app/api/**` Route Handler | 401/403/400/404/201, DB 실제 저장 확인 |

---

## Git 전략

```
main → 배포 (Render 자동 배포)
feature/SPM-[번호]-[슬러그]  → 기능 개발
fix/SPM-[번호]-[슬러그]      → 버그 수정
hotfix/SPM-[번호]-[슬러그]   → 긴급 수정
```

### 커밋 메시지 형식

```
[type]: [설명] (SPM-[번호])

# type: feat, fix, refactor, test, docs, chore
# 예시: feat: 칸반보드 드래그앤드롭 개선 (SPM-42)
```

---

## SPM 워크플로우 (Codex 수동 절차)

> Claude Code에서는 `/spm-start`, `/spm-commit`, `/spm-done` 커맨드로 자동화됩니다.
> Codex에서는 아래 절차를 수동으로 따라야 합니다.
> 상세 가이드: `docs/codex-setup-guide.md`

### 작업 시작

1. `gh auth status`로 GitHub CLI 인증 확인
2. Linear에서 이슈 확인 (SPM-[번호])
3. `main`에서 브랜치 생성: `git checkout -b feature/SPM-[번호]-[슬러그]`
4. `.workzones.yml`에 작업 구역 등록
5. `CLAUDE.md` 현황 표 업데이트
6. 도메인 `MAP.md` + 최근 `work-logs/` 3개 읽기

### 중간 커밋

1. 새 함수/필드에 대한 테스트 파일 작성
2. `npm run test:run` 전체 통과 확인
3. `npx tsc --noEmit` 타입 체크 통과 확인
4. `git add` → `git commit` → `git push`

### 작업 종료

1. `npm run test:run` + `npx tsc --noEmit` 최종 검증
2. `work-logs/YYYY-MM-DD-[작업자]-[SHA].md` 생성
3. `.workzones.yml`에서 본인 항목 제거
4. `CLAUDE.md` 현황 표 복원
5. 도메인 `MAP.md` 갱신 (새 파일/함수/엔드포인트 반영)
6. `git add` → `git commit` → `git push`
7. `gh pr create`로 PR 생성

---

## Linear 이슈 관리 (Codex용)

> Claude Code는 Linear MCP 서버로 이슈를 직접 조회/생성/업데이트합니다.
> Codex에서는 **Linear CLI** 또는 **웹 UI**를 사용하세요.

- 팀 식별자: `SPM`
- 이슈 형식: `SPM-[번호]`
- PR 본문 마지막 줄에 `Linear: SPM-[번호]` 추가 → 자동 연동

---

## 성능 관련 환경변수

| 환경변수 | 기본값 | 설명 |
|---------|--------|------|
| `API_LOGGING` | 활성화 | `false`로 설정 시 API 로깅/집계 비활성화 |
| `MONGODB_DEBUG` | 비활성화 | `true`로 설정 시 Mongoose 쿼리 로그 출력 |

### 성능 모니터링

- `/api/health` — API 응답시간 통계 확인
- 500ms 초과 API는 `[SLOW API]` 로그로 자동 경고
