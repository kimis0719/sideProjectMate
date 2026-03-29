# CLAUDE.md — Side Project Mate

> AI 에이전트 및 팀원을 위한 **빠른 참조 카드**입니다.
> 상세 내용은 `docs/` 하위 파일을 필요할 때만 읽으세요.

---

## 프로젝트 핵심 정보

- **스택**: Next.js 14 / TypeScript / MongoDB(Mongoose) / Zustand / Socket.io / Tailwind
- **서버**: `server.ts` (Express + Socket.io) 위에서 Next.js App Router 구동
- **배포**: Render.com (`render.yaml`)
- **경로 별칭**: `@/` → `src/` (항상 `@/` 사용, 상대경로 금지)

---

## AI 컨텍스트 로딩 가이드

### 항상 읽을 것 (모든 세션 필수)

1. `.workzones.yml` — locked 구역 확인 (충돌 방지)
2. `work-logs/` 최신 3개 — 팀원 최근 작업 파악

### 작업 유형별 추가 로딩

| 작업             | 읽을 파일                                        |
| ---------------- | ------------------------------------------------ |
| API 작업         | `src/app/api/MAP.md` → 해당 도메인 `MAP.md`      |
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

> 위 파일들로 대부분의 컨텍스트가 확보됩니다.
> `DEV_ROADMAP.md`, `docs/plans/` 등은 기획 확인 시에만 읽으세요.

---

## API Route 필수 패턴

```ts
export const dynamic = 'force-dynamic';
await dbConnect();
// 인증 필요 시:
const session = await getServerSession(authOptions);
if (!session?.user?._id)
  return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
// 성공 응답:
return NextResponse.json({ success: true, data: { ... } });
// 실패 응답:
return NextResponse.json({ success: false, message: '...' }, { status: 400 });
```

---

## 코드 생성 체크리스트

- [ ] `'use client'` 선언 (클라이언트 컴포넌트)
- [ ] API Route: `dynamic` + `dbConnect()` + 인증 체크
- [ ] 응답 형식 `{ success, data | message }` 통일
- [ ] Mongoose 모델 중복 등록 방지 패턴
- [ ] Zustand 스토어에 `devtools` 미들웨어
- [ ] Socket `socket.off()` cleanup 등록
- [ ] `@/` 경로 별칭 사용 / `any` 타입 금지

---

## 테스트 체크리스트

- [ ] 코드 추가/수정 시 `*.test.ts` 파일 함께 생성
- [ ] `npm run test:run` 전체 통과 확인
- [ ] 기존 `src/__tests__/fixtures/` fixture 재사용
- [ ] 상세 패턴: `docs/testing-guide.md`

---

## Git 전략

```
main → 배포 (Render 자동 배포)
feature/* / fix/* /
```

---

## 현재 진행 중인 작업 현황

| 담당 영역                  | 작업자 | 상태    | 작업 내용 |
| -------------------------- | ------ | ------- | --------- |
| (현재 작업 중인 항목 없음) | — | 🟢 자유 | — |
