# Side Project Mate — 테스트 도입 가이드 & 개발 계획서

> **작성일**: 2026-03-07
> **대상**: HyunJin 및 팀원 (테스트 경험 없음 전제)
> **목적**: 테스트가 전혀 없는 프로젝트에 체계적으로 테스트를 도입하기 위한 가이드

---

## Part 1 — 테스트란 무엇인가? (개념 편)

### 테스트의 3가지 레벨

테스트는 범위에 따라 크게 세 가지로 나뉩니다. 피라미드 형태로 아래가 넓고 위가 좁아야 건강한 구조입니다.

```
        /\
       /  \      E2E 테스트 (소수, 느림, 비쌈)
      / E2E\     → 실제 브라우저에서 사용자 시나리오 전체 테스트
     /------\
    /통합 테스트\   → API + DB + 인증이 함께 동작하는지 확인
   /----------\
  /  단위 테스트  \  → 함수 하나가 올바른 값을 반환하는지 확인
 /--------------\    (가장 많이, 가장 빠르게)
```

#### 1. 단위 테스트 (Unit Test)

**"이 함수에 A를 넣으면 B가 나오는가?"**

외부 의존성 없이 하나의 함수나 모듈을 독립적으로 테스트합니다. 가장 빠르고 작성이 쉽습니다.

```typescript
// 예: profileUtils.ts의 프로필 완성도 계산
test('빈 프로필의 완성도는 0%', () => {
  const score = calculateProfileCompleteness({});
  expect(score).toBe(0);
});

test('모든 항목을 채운 프로필의 완성도는 100%', () => {
  const score = calculateProfileCompleteness(fullProfile);
  expect(score).toBe(100);
});
```

**우리 프로젝트에서의 대상**:
- `taskDependency.ts` — 의존관계 검증, 순환 참조 감지, 크리티컬 패스 계산
- `scheduleConflict.ts` — 날짜 겹침 감지, 충돌 심각도, 조정 제안
- `iconUtils.ts` — 기술명 → 아이콘 슬러그 매핑
- `profileUtils.ts` — 프로필 완성도 점수 계산

#### 2. 통합 테스트 (Integration Test)

**"API에 요청을 보내면 DB에서 올바른 데이터를 가져와 올바른 형태로 응답하는가?"**

여러 모듈이 함께 동작하는 시나리오를 테스트합니다. DB 연결, 인증 처리, 응답 형식이 모두 맞는지 확인합니다.

```typescript
// 예: GET /api/projects 통합 테스트
test('프로젝트 목록 조회 시 페이지네이션이 동작한다', async () => {
  // 테스트용 DB에 프로젝트 10개 삽입
  await Project.insertMany(mockProjects);

  // API 호출
  const response = await GET(mockRequest({ page: '1', limit: '5' }));
  const body = await response.json();

  // 검증
  expect(body.success).toBe(true);
  expect(body.data.projects).toHaveLength(5);
  expect(body.data.totalPages).toBe(2);
});
```

**우리 프로젝트에서의 대상**:
- API Route Handlers (`/api/projects`, `/api/applications`, `/api/wbs/tasks` 등)
- Zustand 스토어 액션 (API 호출 + 상태 업데이트 흐름)
- Socket.io 이벤트 핸들러

#### 3. E2E 테스트 (End-to-End Test)

**"실제 사용자처럼 브라우저에서 클릭하고 입력하면 기대한 결과가 나오는가?"**

실제 브라우저를 열어 전체 플로우를 테스트합니다. 가장 느리고 비용이 크지만, 실제 사용자 경험을 검증합니다.

```typescript
// 예: Playwright E2E 테스트
test('프로젝트 지원 → 수락 → 채팅방 생성 플로우', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'user@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/projects/1');
  await page.click('text=지원하기');
  // ... 이후 플로우 검증
});
```

**우리 프로젝트에서의 대상** (Phase 3 이후):
- 회원가입 → 온보딩 → 프로필 완성 플로우
- 프로젝트 생성 → 지원 → 수락 → 채팅방 생성 플로우
- 칸반 보드 실시간 동기화

---

### 왜 Vitest인가? (Jest vs Vitest)

우리 프로젝트(Next.js 14 + TypeScript)에 가장 적합한 테스트 러너를 비교합니다.

| 비교 항목 | Jest | Vitest |
|-----------|------|--------|
| TypeScript 지원 | 별도 설정 필요 (ts-jest) | 네이티브 지원 |
| ESM 지원 | 불완전 (실험적) | 완벽 (ESM 우선) |
| 실행 속도 | 느림 (cold start) | 빠름 (Vite 기반 HMR) |
| 설정 복잡도 | 높음 (특히 Next.js) | 낮음 (vite.config 재사용) |
| 모킹 API | `jest.mock()` | `vi.mock()` (동일 패턴) |
| 커뮤니티 | 더 크지만 성장 둔화 | 빠르게 성장, Vite 생태계 |
| Next.js 호환 | 공식 지원 | 플러그인으로 지원 |
| Watch 모드 | 있음 | 더 빠름 (Vite HMR) |

**결론**: Vitest를 채택합니다. TypeScript 네이티브 지원과 빠른 실행 속도가 결정적입니다. Jest의 `expect` / `describe` / `it` 문법과 거의 동일해서 학습 비용도 낮습니다.

---

### 테스트 용어 정리

실제 코드를 작성하기 전에 알아야 할 핵심 개념입니다.

| 용어 | 설명 | 예시 |
|------|------|------|
| **describe** | 테스트 그룹을 묶는 블록 | `describe('profileUtils', () => { ... })` |
| **it / test** | 개별 테스트 케이스 | `it('빈 프로필은 0%', () => { ... })` |
| **expect** | 결과 검증 (단언문) | `expect(result).toBe(100)` |
| **Mock** | 가짜 객체/함수로 대체 | DB 호출 대신 가짜 데이터 반환 |
| **Spy** | 함수 호출 여부·횟수 감시 | `vi.spyOn(console, 'error')` |
| **Fixture** | 테스트용 고정 데이터 | `const mockUser = { email: 'test@test.com' }` |
| **Coverage** | 테스트가 코드의 몇 %를 실행했는지 | `80% statement coverage` |
| **AAA 패턴** | Arrange(준비) → Act(실행) → Assert(검증) | 모든 테스트의 기본 구조 |

```typescript
// AAA 패턴 예시
test('날짜 범위가 겹치면 true를 반환한다', () => {
  // Arrange (준비)
  const range1 = { start: new Date('2024-01-01'), end: new Date('2024-01-10') };
  const range2 = { start: new Date('2024-01-05'), end: new Date('2024-01-15') };

  // Act (실행)
  const result = isDateRangeOverlap(range1.start, range1.end, range2.start, range2.end);

  // Assert (검증)
  expect(result).toBe(true);
});
```

---

## Part 2 — 우리 프로젝트의 테스트 전략

### 테스트 대상 우선순위

코드를 분석한 결과, **외부 의존성이 없는 순수 함수**부터 시작하는 것이 가장 효율적입니다.

#### Tier 1: 순수 함수 (의존성 없음, 최고 ROI)

| 파일 | 함수 수 | 예상 테스트 수 | 난이도 |
|------|---------|---------------|--------|
| `lib/utils/wbs/taskDependency.ts` | 9개 | 50~70개 | 쉬움 |
| `lib/utils/wbs/scheduleConflict.ts` | 7개 | 40~50개 | 쉬움 |
| `lib/iconUtils.ts` | 2개 + 상수 | 25개 | 매우 쉬움 |
| `lib/profileUtils.ts` | 1개 | 20개 | 매우 쉬움 |
| `lib/utils/resourceUtils.ts` | 2개 | 15개 | 쉬움 |

이 파일들은 import하면 바로 테스트할 수 있습니다. Mock이 필요 없어 테스트 입문에 이상적입니다.

#### Tier 2: 상태 관리 (Zustand Mock 필요)

| 파일 | 액션 수 | 예상 테스트 수 | 난이도 |
|------|---------|---------------|--------|
| `store/wbsStore.ts` | 8개 | 40~50개 | 보통 |
| `store/boardStore.ts` | 10개+ | 40~50개 | 보통 |
| `hooks/useModal.ts` | 3개 | 15개 | 보통 |

`fetch()`, `getSocket()` 등을 Mock으로 대체해야 합니다.

#### Tier 3: API Routes (DB Mock 필요)

| 라우트 그룹 | 핸들러 수 | 예상 테스트 수 | 난이도 |
|-------------|----------|---------------|--------|
| `/api/wbs/tasks` | GET, POST, PUT, DELETE | 30~40개 | 보통~어려움 |
| `/api/projects` | GET, POST, PUT, DELETE | 30~40개 | 보통~어려움 |
| `/api/applications` | GET, POST, PUT | 20~30개 | 보통 |
| `/api/admin/*` | 9개 라우트 | 40~50개 | 어려움 |

`mongodb-memory-server`로 인메모리 DB를 사용하거나, Mongoose 모델을 Mock합니다.

#### Tier 4: E2E (나중에)

Playwright로 핵심 사용자 플로우만 검증합니다. 초기에는 도입하지 않습니다.

---

### 필요한 패키지

```json
{
  "devDependencies": {
    "vitest": "^1.6.0",
    "@vitest/coverage-v8": "^1.6.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "mongodb-memory-server": "^9.1.0",
    "msw": "^2.2.0"
  }
}
```

| 패키지 | 역할 | 어디서 쓰이나 |
|--------|------|-------------|
| `vitest` | 테스트 러너 + 단언 + 모킹 | 전체 |
| `@vitest/coverage-v8` | 코드 커버리지 리포트 | 전체 |
| `@testing-library/react` | React 컴포넌트/훅 테스트 | Tier 2 (훅) |
| `@testing-library/jest-dom` | DOM 매처 확장 | 컴포넌트 테스트 |
| `mongodb-memory-server` | 인메모리 MongoDB (테스트용) | Tier 3 (API) |
| `msw` | HTTP 요청 가로채기 (Mock Server) | Tier 2 (스토어) |

---

### 폴더 구조

```
src/
├── __tests__/                    # 테스트 유틸, 공통 fixture
│   ├── setup.ts                  # Vitest 전역 설정 (DOM cleanup 등)
│   ├── fixtures/                 # 테스트용 Mock 데이터
│   │   ├── users.ts              # Mock 유저 데이터
│   │   ├── projects.ts           # Mock 프로젝트 데이터
│   │   ├── tasks.ts              # Mock WBS 태스크 데이터
│   │   └── index.ts              # 통합 export
│   └── helpers/                  # 테스트 헬퍼 유틸
│       ├── mockDb.ts             # mongodb-memory-server 세팅
│       ├── mockSession.ts        # next-auth 세션 Mock
│       └── mockSocket.ts         # Socket.io Mock
│
├── lib/
│   ├── utils/
│   │   └── wbs/
│   │       ├── taskDependency.ts
│   │       ├── taskDependency.test.ts      # ← 같은 폴더에 배치
│   │       ├── scheduleConflict.ts
│   │       └── scheduleConflict.test.ts
│   ├── iconUtils.ts
│   ├── iconUtils.test.ts
│   ├── profileUtils.ts
│   └── profileUtils.test.ts
│
├── store/
│   ├── wbsStore.ts
│   ├── wbsStore.test.ts
│   ├── boardStore.ts
│   └── boardStore.test.ts
│
└── app/api/
    └── wbs/tasks/
        ├── route.ts
        └── route.test.ts
```

테스트 파일은 **원본 파일 바로 옆에 배치**합니다 (`*.test.ts`). 이렇게 하면 테스트 대상을 찾기 쉽고, import 경로도 짧아집니다.

---

### Vitest 설정

```typescript
// vitest.config.ts (프로젝트 루트)
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,                    // describe, it, expect 전역 사용
    environment: 'node',              // 기본 환경 (API/유틸 테스트)
    include: ['src/**/*.test.ts'],    // 테스트 파일 패턴
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],     // 터미널 + HTML 리포트
      include: ['src/lib/**', 'src/store/**'],
      exclude: ['src/**/*.test.ts'],
    },
    setupFiles: ['src/__tests__/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),   // @/ 별칭 연동
    },
  },
});
```

```typescript
// src/__tests__/setup.ts
import { afterEach, vi } from 'vitest';

// 각 테스트 후 모든 Mock 초기화
afterEach(() => {
  vi.restoreAllMocks();
});
```

```json
// package.json에 스크립트 추가
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

---

## Part 3 — 단계별 구현 계획 (Claude Code 활용)

### Phase 1: 환경 설정 + 순수 함수 테스트 (2~3일)

> **Claude Code 프롬프트 예시**: 아래 프롬프트를 Claude Code에서 직접 사용할 수 있습니다.

#### Step 1-1. 환경 구성

```
vitest를 설치하고 vitest.config.ts, setup.ts를 구성해줘.
CLAUDE.md의 @/ 경로 별칭이 테스트에서도 동작하도록 설정해줘.
package.json에 test, test:run, test:coverage, test:watch 스크립트를 추가해줘.
```

#### Step 1-2. Mock 데이터 Fixture 작성

```
src/__tests__/fixtures/ 폴더에 테스트용 Mock 데이터를 만들어줘.
기존 Mongoose 모델(User, Project, Task 등)의 인터페이스를 참고해서
테스트에서 자주 쓸 수 있는 사전 정의 데이터를 작성해줘.
```

#### Step 1-3. taskDependency.ts 단위 테스트

```
src/lib/utils/wbs/taskDependency.ts의 전체 함수에 대한 단위 테스트를 작성해줘.
taskDependency.test.ts 파일을 같은 폴더에 만들어줘.

테스트해야 할 함수 목록:
1. getPredecessorTasks — 선행 작업 목록 반환
2. getSuccessorTasks — 후행 작업 목록 반환
3. validateDependencyConstraint — FS/SS/FF 제약조건 검증
4. validateAllDependencies — 전체 의존관계 일괄 검증
5. detectCircularDependency — 순환 참조 감지 (A→B→C→A)
6. calculateCriticalPath — 최장 경로(크리티컬 패스) 계산
7. identifyParallelTasks — 병렬 실행 가능한 작업 식별
8. identifySerialTasks — 직렬 체인 식별

엣지 케이스도 반드시 포함:
- 빈 배열, 단일 작업, 의존관계 없는 작업
- 자기 자신 참조, 3단계 이상 순환
- 동일 날짜의 시작/종료
```

#### Step 1-4. scheduleConflict.ts 단위 테스트

```
src/lib/utils/wbs/scheduleConflict.ts의 전체 함수에 대한 단위 테스트를 작성해줘.

테스트해야 할 함수 목록:
1. isDateRangeOverlap — 날짜 범위 겹침 여부
2. getOverlapRange — 겹치는 날짜 범위와 일수 계산
3. checkScheduleConflict — 특정 작업의 일정 충돌 검출
4. calculateTaskDuration — 작업 소요일수 계산
5. generateAdjustmentSuggestions — 충돌 해결 제안 생성
6. checkAllScheduleConflicts — 전체 작업의 충돌 일괄 검출
7. calculateConflictSeverity — 충돌 심각도 점수 계산

엣지 케이스:
- 정확히 같은 날짜 범위
- 하루짜리 작업끼리 같은 날
- 담당자가 다른 작업은 충돌 아님
- excludeId로 자기 자신 제외
```

#### Step 1-5. iconUtils.ts + profileUtils.ts 단위 테스트

```
src/lib/iconUtils.ts와 src/lib/profileUtils.ts의 단위 테스트를 작성해줘.

iconUtils 테스트:
- getIconSlug: 대소문자 무시, 특수문자 처리 ('C++' → 'cpp', 'Next.js' → 'nextjs')
- getSkillCategory: 언어/프레임워크/도구/DB 분류 정확성
- 매핑에 없는 이름의 fallback 동작

profileUtils 테스트:
- 빈 프로필 → 0%
- 풀 프로필 → 100%
- 각 항목별 점수 기여 검증 (아바타 15%, 소개 20% 등)
- 소개 10자 미만 → 점수 미부여
- 최대 100% 초과 방지
```

**Phase 1 완료 기준**: `npm run test:run` 실행 시 120~150개 테스트 전부 통과, 커버리지 리포트 생성

---

### Phase 2: Zustand 스토어 + 훅 테스트 (3~5일)

#### Step 2-1. 테스트 헬퍼 작성

```
src/__tests__/helpers/ 폴더에 테스트 헬퍼를 작성해줘.

1. mockSession.ts — next-auth 세션 Mock
   - createMockSession(overrides?) → 가짜 세션 객체 반환
   - vi.mock('next-auth') 으로 getServerSession을 Mock

2. mockSocket.ts — Socket.io 클라이언트 Mock
   - createMockSocket() → on/off/emit/disconnect를 가진 가짜 소켓 반환
   - vi.mock('@/lib/socket') 으로 getSocket을 Mock
```

#### Step 2-2. wbsStore.ts 테스트

```
src/store/wbsStore.test.ts를 작성해줘.

테스트 전략:
- fetch()를 vi.fn()으로 Mock
- getSocket()을 vi.mock()으로 Mock
- Zustand 스토어는 각 테스트마다 초기 상태로 리셋

테스트 항목:
1. fetchTasks: API 호출 → 상태 업데이트 → isLoading 상태 변화
2. addTask: Optimistic Update → 서버 응답 → 임시 ID 교체
3. addTask 실패: API 에러 시 롤백 동작
4. updateTask: 기존 태스크 업데이트 → 서버 반영
5. deleteTask: 삭제 → 목록에서 제거 → 에러 시 롤백
6. selectTask: selectedTaskId 상태 변경
7. setViewMode: viewMode 상태 변경 (day/week/month)
```

#### Step 2-3. boardStore.ts 테스트

```
src/store/boardStore.test.ts를 작성해줘.
wbsStore 테스트와 동일한 패턴으로 작성하되,
칸반 보드 특유의 로직을 반영해줘:
- 노트 드래그(섹션 간 이동) 시 상태 변경
- Socket 이벤트 발행 검증
- Undo/Redo (Zundo) 동작 검증
- 잠금(lock) 요청/해제 로직
```

#### Step 2-4. useModal 훅 테스트

```
src/hooks/useModal.test.ts를 작성해줘.
@testing-library/react의 renderHook을 사용해서 테스트.

1. confirm()이 모달을 열고 사용자 응답을 Promise로 반환하는지
2. alert()이 모달을 열고 확인 시 resolve되는지
3. close()가 모달 상태를 초기화하는지
4. isDestructive 옵션이 올바르게 전달되는지
```

**Phase 2 완료 기준**: 스토어 + 훅 테스트 100개 이상 추가, 총 250개 이상 통과

---

### Phase 3: API Route 통합 테스트 (5~7일)

#### Step 3-1. 인메모리 DB 헬퍼 작성

```
src/__tests__/helpers/mockDb.ts에 mongodb-memory-server 설정을 작성해줘.

기능:
- setupTestDB() — 인메모리 MongoDB 시작 + Mongoose 연결
- teardownTestDB() — 연결 해제 + 인스턴스 종료
- clearTestDB() — 모든 컬렉션 데이터 삭제 (테스트 간 격리)

사용 패턴:
beforeAll(async () => await setupTestDB());
afterEach(async () => await clearTestDB());
afterAll(async () => await teardownTestDB());
```

#### Step 3-2. API 테스트 헬퍼

```
src/__tests__/helpers/apiTestHelper.ts를 작성해줘.

기능:
- createMockNextRequest(url, options) → NextRequest 객체 생성
- mockAuthenticated(userId, memberType) → getServerSession Mock
- mockUnauthenticated() → null 세션 Mock
```

#### Step 3-3. WBS API 통합 테스트

```
src/app/api/wbs/tasks/route.test.ts를 작성해줘.

인메모리 MongoDB를 사용한 실제 DB 연동 테스트.

GET /api/wbs/tasks:
1. pid 쿼리 파라미터로 해당 프로젝트의 태스크만 조회
2. populate('assignee')가 동작하는지 확인
3. 빈 결과 시 빈 배열 반환 (에러 아님)
4. pid 없으면 400 에러

POST /api/wbs/tasks:
1. 미인증 시 401 반환
2. 필수 필드 누락 시 400 반환
3. 정상 생성 시 201 + { success: true, data: task }
4. 생성된 태스크가 DB에 실제 저장되었는지 확인

PATCH /api/wbs/tasks/[taskId]:
1. 미인증 시 401
2. 존재하지 않는 taskId 시 404
3. 부분 업데이트 동작 확인 (title만 변경 시 다른 필드 유지)

DELETE /api/wbs/tasks/[taskId]:
1. 미인증 시 401
2. 삭제 후 DB에서 실제 제거 확인
3. 다른 태스크의 의존관계에서도 제거되었는지 확인
```

#### Step 3-4. Projects API 통합 테스트

```
src/app/api/projects/route.test.ts를 작성해줘.

GET:
1. 페이지네이션 (page, limit)
2. 검색 (search 쿼리)
3. 카테고리 필터
4. 상태 필터 (모집중/진행중/완료)
5. 정렬 (최신/인기/조회수)

POST:
1. 미인증 시 401
2. 필수 필드 검증
3. pid 자동 생성 (Counter 모델 연동)
4. author 자동 설정 (세션의 _id)
```

#### Step 3-5. Admin API 통합 테스트

```
src/app/api/admin/stats/route.test.ts를 작성해줘.

1. 일반 유저(memberType: 'user') 접근 시 403
2. 관리자(memberType: 'admin') 접근 시 통계 데이터 반환
3. 통계 수치가 실제 DB 데이터와 일치하는지 검증
```

**Phase 3 완료 기준**: API 테스트 100개 이상 추가, 총 350개 이상 통과

---

### Phase 4: CI/CD 연동 + 커버리지 목표 (1~2일)

#### Step 4-1. GitHub Actions 워크플로우

```
.github/workflows/test.yml을 작성해줘.

트리거: push to main, pull request
작업:
1. Node.js 20 설정
2. npm ci (의존성 설치)
3. npm run test:run (테스트 실행)
4. npm run test:coverage (커버리지 리포트)
5. 커버리지 결과를 PR 코멘트로 자동 게시
```

#### Step 4-2. 커버리지 목표 설정

```
vitest.config.ts에 커버리지 임계값을 설정해줘.

// Phase 1 목표 (출시 전 최소)
thresholds: {
  statements: 50,    // 전체 구문의 50% 이상
  branches: 40,      // 분기의 40% 이상
  functions: 50,     // 함수의 50% 이상
  lines: 50,         // 라인의 50% 이상
}

// Phase 2 목표 (출시 후 3개월)
// statements: 70, branches: 60, functions: 70, lines: 70
```

**Phase 4 완료 기준**: PR 생성 시 자동 테스트 실행, 커버리지 리포트 확인 가능

---

## Part 4 — Claude Code 실전 활용 팁

### 효과적인 프롬프트 패턴

#### 패턴 1: 파일 지정 + 함수 목록 + 엣지 케이스

```
src/lib/utils/wbs/taskDependency.ts 파일을 읽고,
모든 export 함수에 대한 단위 테스트를 작성해줘.
테스트 파일은 같은 폴더에 taskDependency.test.ts로 만들어줘.

각 함수마다:
- 정상 동작 케이스 3개 이상
- 엣지 케이스 2개 이상 (빈 배열, null, 경계값)
- 에러 케이스 1개 이상

기존 CLAUDE.md 컨벤션을 따라줘.
```

#### 패턴 2: 기존 테스트 패턴 참조

```
src/lib/iconUtils.test.ts를 참고해서
src/lib/profileUtils.ts의 테스트를 동일한 스타일로 작성해줘.
describe/it 구조, fixture 형태, 단언문 패턴을 맞춰줘.
```

#### 패턴 3: 실패 케이스 우선

```
src/app/api/wbs/tasks/route.ts의 에러 처리 경로만 집중 테스트해줘.
- 미인증 (세션 없음) → 401
- 잘못된 입력 → 400
- 존재하지 않는 리소스 → 404
- DB 연결 실패 → 500
각 경우에 { success: false, message: '...' } 형태의 응답을 검증해줘.
```

#### 패턴 4: 테스트 실패 → 코드 수정

```
npm run test:run 결과 실패한 테스트가 있어.
실패 원인을 분석하고 테스트가 아니라 원본 코드의 버그인지,
테스트의 기대값이 잘못된 건지 판단해서 수정해줘.
실제 버그를 발견하면 코드를 수정하고 관련 테스트가 통과하는지 확인해줘.
```

### 주의사항

1. **테스트를 위해 원본 코드를 수정하지 마세요.** 테스트가 원본 코드에 맞춰야 합니다. 단, 원본 코드에 실제 버그가 있으면 테스트가 발견한 것이므로 원본을 수정합니다.

2. **Mock은 최소한으로.** 외부 의존성(DB, 네트워크, 파일시스템)만 Mock하고, 테스트 대상 코드 자체는 Mock하지 않습니다.

3. **테스트 이름은 한국어로.** 우리 프로젝트는 한국어 주석을 사용하므로, 테스트 이름도 한국어로 작성하면 가독성이 좋습니다.

```typescript
describe('일정 충돌 유틸', () => {
  it('같은 담당자의 날짜가 겹치면 충돌을 반환한다', () => { ... });
  it('다른 담당자는 날짜가 겹쳐도 충돌이 아니다', () => { ... });
  it('자기 자신은 충돌 검사에서 제외한다', () => { ... });
});
```

4. **커버리지 100%를 목표로 하지 마세요.** 80%면 충분합니다. 나머지 20%는 노력 대비 효과가 급격히 떨어집니다.

---

## Part 5 — 전체 일정 요약

```
Week 1 (Phase 1)
├── Day 1: Vitest 환경 구성 + fixture 작성
├── Day 2: taskDependency.ts + scheduleConflict.ts 테스트
└── Day 3: iconUtils.ts + profileUtils.ts + resourceUtils.ts 테스트
            → 목표: 150개 테스트 통과

Week 2 (Phase 2)
├── Day 4-5: 테스트 헬퍼 + wbsStore 테스트
├── Day 6-7: boardStore + useModal 테스트
└── Day 8: 중간 점검 + 리팩토링
            → 목표: 250개 테스트 통과

Week 3 (Phase 3)
├── Day 9-10: 인메모리 DB 설정 + WBS API 통합 테스트
├── Day 11-12: Projects + Applications API 테스트
└── Day 13-14: Admin API 테스트
              → 목표: 350개 테스트 통과

Week 3+ (Phase 4)
├── GitHub Actions CI 설정
└── 커버리지 임계값 설정 + README 배지 추가
    → 목표: PR마다 자동 테스트 실행
```

---

## 부록 A — Vitest 주요 API 치트시트

```typescript
// ── 기본 구조 ──
describe('그룹 이름', () => {
  it('테스트 이름', () => {
    expect(actual).toBe(expected);          // 일치 (===)
    expect(actual).toEqual(expected);       // 깊은 비교 (객체/배열)
    expect(actual).toBeTruthy();            // truthy 값
    expect(actual).toBeNull();              // null
    expect(actual).toContain(item);         // 배열/문자열에 포함
    expect(actual).toHaveLength(n);         // 길이
    expect(actual).toBeGreaterThan(n);      // 크기 비교
    expect(actual).toThrow();               // 에러 발생
    expect(actual).resolves.toBe(value);    // Promise 해결값
    expect(actual).rejects.toThrow();       // Promise 거부
  });
});

// ── Mock ──
const mockFn = vi.fn();                    // 가짜 함수
mockFn.mockReturnValue('hello');            // 반환값 지정
mockFn.mockResolvedValue(data);             // Promise 반환
vi.mock('@/lib/socket');                    // 모듈 전체 Mock
vi.spyOn(object, 'method');                 // 기존 메서드 감시

// ── 생명주기 ──
beforeAll(() => { /* 전체 시작 전 1번 */ });
beforeEach(() => { /* 각 테스트 전 */ });
afterEach(() => { /* 각 테스트 후 */ });
afterAll(() => { /* 전체 종료 후 1번 */ });
```

---

## 부록 B — 테스트로 발견할 수 있는 기존 버그 목록

테스트를 작성하면서 자연스럽게 발견될 가능성이 높은 기존 버그들입니다.

| 버그 | 파일 | 테스트로 감지 가능한 이유 |
|------|------|------------------------|
| 배치 삭제 의존관계 쿼리 오류 | `wbs/tasks/batch/route.ts` | 삭제 후 다른 태스크 의존관계 검증 시 실패 |
| addTask 임시 ID 미교체 | `wbsStore.ts` | 서버 응답 후 selectedTaskId 상태 검증 시 실패 |
| GanttChart 타이머 미해제 | `GanttChart.tsx` | 언마운트 후 콜백 실행 여부 검증 시 감지 |
| WBS API 응답 형식 불일치 | `wbs/tasks/route.ts` | `{ success, data }` 구조 검증 시 실패 |
| mypage Hook 규칙 위반 | `mypage/page.tsx` | 컴포넌트 렌더링 테스트 시 React 경고 감지 |

---

*본 문서는 Side Project Mate 코드베이스를 직접 분석하여 작성되었습니다.*
*최종 업데이트: 2026-03-07*
