# 테스트 작성 가이드 (Vitest)

> 체크리스트 요약은 `CLAUDE.md` 참조. 이 문서는 상세 패턴이 필요할 때 읽으세요.

## 현황

- **총 테스트 수**: 457개 (Phase 1: 203개, Phase 2: 161개, Phase 3: 93개)
- **실행 명령어**: `npm run test:run` / `test:watch` / `test:coverage`

## 테스트 파일 위치

원본 파일 바로 옆에 배치. 별도 폴더 금지.

```
src/lib/utils/wbs/taskDependency.test.ts   ← 순수 함수 (Phase 1)
src/store/wbsStore.test.ts                 ← 스토어/훅 (Phase 2)
src/app/api/wbs/tasks/route.test.ts        ← API Route (Phase 3)
```

## Phase별 작성 기준

| Phase | 대상                                             | 필수 커버리지                                       |
| ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1     | `src/lib/utils/**`, `src/constants/**` 순수 함수 | 정상 3개 + 엣지 2개 + 실패 1개 이상                 |
| 2     | `src/store/**`, `src/hooks/**`                   | fetch 성공/실패, Optimistic Update, 소켓 emit, 롤백 |
| 3     | `src/app/api/**` Route Handler                   | 401/403/400/404/201, DB 실제 저장 확인              |

## 핵심 패턴

**Phase 2 Socket Mock** (`vi.hoisted()` 필수):

```ts
const mockSocket = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));
vi.mock('@/lib/socket', () => ({ getSocket: () => mockSocket }));
```

**Phase 3 필수 Mock**:

```ts
vi.mock('@/lib/mongodb');
vi.mock('next-auth');
vi.mock('next/headers');
```

**Phase 3 DB 생명주기**:

```ts
beforeAll(() => setupTestDB());
afterEach(() => clearTestDB());
afterAll(() => teardownTestDB());
```

## Fixture 재사용

`src/__tests__/fixtures/` 기존 데이터 우선 사용. 중복 Mock 데이터 생성 금지.

## 상세 가이드 위치

- Phase 2: `docs/testing/TESTING_PHASE2_GUIDE.md`
- Phase 3: `docs/testing/TESTING_PHASE3_GUIDE.md`
