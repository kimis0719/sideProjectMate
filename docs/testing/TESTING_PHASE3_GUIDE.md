# Phase 3 테스트 사용 가이드 (API Route 통합 테스트)

---

## 1. 이전 Phase와의 차이점

Phase 1이 **순수 함수**, Phase 2가 **Zustand 스토어**를 테스트했다면, Phase 3는 **API Route Handler + 실제 DB 연동**을 테스트합니다.

| 비교 | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| 대상 | 유틸 함수 | Zustand 스토어, 훅 | API Route Handler |
| Mock | 없음 | fetch, Socket.io | dbConnect, getServerSession |
| DB | 없음 | 없음 | 인메모리 MongoDB (mongodb-memory-server) |
| 검증 포인트 | 반환값 | 상태 변화, 롤백 | HTTP 응답 코드, DB 실제 저장/삭제, 권한 검증 |
| 핵심 패키지 | vitest | vitest | vitest + mongodb-memory-server |

---

## 2. 테스트 파일 구조

```
src/
├── __tests__/
│   ├── setup.ts                         # 전역 설정
│   ├── fixtures/                        # Mock 데이터 (Phase 1~)
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── chat.ts
│   │   └── index.ts
│   └── helpers/                         # 테스트 헬퍼
│       ├── mockSession.ts              # next-auth 세션 Mock (Phase 2)
│       ├── mockSocket.ts               # Socket.io 클라이언트 Mock (Phase 2)
│       ├── mockDb.ts                   # 인메모리 MongoDB 헬퍼 (Phase 3 신규)
│       ├── apiTestHelper.ts            # NextRequest 생성, 인증 Mock (Phase 3 신규)
│       └── index.ts                    # 통합 export
│
└── app/api/
    ├── wbs/tasks/
    │   ├── route.ts
    │   ├── route.test.ts                ← 13개 테스트 (GET, POST)
    │   ├── [taskId]/
    │   │   ├── route.ts
    │   │   └── route.test.ts            ← 10개 테스트 (PATCH, DELETE)
    │   └── batch/
    │       ├── route.ts
    │       └── route.test.ts            ← 10개 테스트 (PATCH, DELETE)
    ├── projects/
    │   ├── route.ts
    │   ├── route.test.ts                ← 15개 테스트 (GET, POST)
    │   └── [pid]/
    │       ├── route.ts
    │       └── route.test.ts            ← 18개 테스트 (GET, PUT, DELETE, PATCH)
    ├── applications/
    │   ├── route.ts
    │   ├── route.test.ts                ← 6개 테스트 (GET)
    │   └── [appId]/
    │       ├── route.ts
    │       └── route.test.ts            ← 14개 테스트 (PUT, DELETE)
    └── admin/stats/
        ├── route.ts
        └── route.test.ts                ← 7개 테스트 (GET + 권한 검증)
```

---

## 3. 기본 명령어

```bash
# 전체 테스트 실행
npm run test:run

# API 테스트만 실행
npx vitest run src/app/api/

# 특정 API만 실행
npx vitest run src/app/api/wbs/tasks/route.test.ts
npx vitest run src/app/api/projects/route.test.ts

# 특정 describe만 실행
npx vitest run -t "GET /api/wbs/tasks"

# 커버리지 확인
npm run test:coverage
```

---

## 4. Phase 3 핵심 개념

### 4-1. 인메모리 MongoDB

실제 MongoDB Atlas에 연결하지 않고, 메모리에서 동작하는 MongoDB 인스턴스를 사용합니다.
테스트 속도가 빠르고, 외부 환경에 의존하지 않습니다.

```typescript
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

describe('GET /api/wbs/tasks', () => {
  beforeAll(async () => await setupTestDB());    // 인메모리 DB 시작 + 연결
  afterEach(async () => await clearTestDB());    // 테스트 간 데이터 격리
  afterAll(async () => await teardownTestDB());  // DB 종료
});
```

| 함수 | 역할 | 호출 시점 |
|------|------|----------|
| `setupTestDB()` | MongoMemoryServer 시작 + Mongoose 연결 | `beforeAll` |
| `clearTestDB()` | 모든 컬렉션 데이터 삭제 | `afterEach` |
| `teardownTestDB()` | Mongoose 연결 해제 + 서버 종료 | `afterAll` |

### 4-2. dbConnect 무시

API Route는 내부에서 `dbConnect()`를 호출하지만, 테스트에서는 인메모리 DB에 이미 연결되어 있으므로 이를 무시합니다.

```typescript
// 모든 API 테스트 파일의 최상단에 선언
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
```

### 4-3. getServerSession Mock

인증이 필요한 API를 테스트할 때, `getServerSession`을 Mock하여 세션 상태를 제어합니다.

```typescript
// 1. Mock 함수 선언
const mockGetServerSession = vi.fn();

// 2. next-auth 모듈 Mock (일부 라우트는 'next-auth/next'에서도 import)
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// 3. 테스트에서 세션 상태 설정
// 인증된 상태
mockGetServerSession.mockResolvedValue({
  user: { _id: user._id.toString(), memberType: 'user' },
  expires: '2099-12-31',
});

// 미인증 상태
mockGetServerSession.mockResolvedValue(null);

// 관리자 상태
mockGetServerSession.mockResolvedValue({
  user: { _id: admin._id.toString(), memberType: 'admin' },
  expires: '2099-12-31',
});
```

### 4-4. NextRequest 생성

API Route Handler를 직접 호출하기 위해 `NextRequest` 객체를 생성합니다.

```typescript
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

// GET 요청 (쿼리 파라미터 포함)
const request = createMockNextRequest('http://localhost:3000/api/wbs/tasks?pid=1');

// POST 요청 (body 포함)
const request = createMockNextRequest('http://localhost:3000/api/wbs/tasks', {
  method: 'POST',
  body: {
    pid: 1,
    title: '새 작업',
    assignee: userId,
    startDate: '2024-01-01',
    endDate: '2024-01-10',
  },
});

// DELETE 요청
const request = createMockNextRequest('http://localhost:3000/api/wbs/tasks/batch', {
  method: 'DELETE',
  body: { ids: ['id1', 'id2'] },
});
```

> **참고**: 일부 라우트(projects 등)는 `Request`를 사용합니다(NextRequest가 아닌). 이 경우 `new Request(url, options)`로 직접 생성하세요.

### 4-5. Route Handler 직접 호출

테스트에서 HTTP 서버를 띄우지 않고, export된 함수를 직접 호출합니다.

```typescript
import { GET, POST } from './route';

// 파라미터 없는 라우트
const response = await GET(request);
const body = await response.json();

// URL 파라미터가 있는 라우트 ([pid], [taskId] 등)
const response = await PATCH(request, { params: { taskId: 'abc123' } });
const body = await response.json();
```

---

## 5. API 테스트 작성 템플릿

### 5-1. 인증 불필요 라우트 (예: GET /api/wbs/tasks)

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

// dbConnect 무시
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));

// 테스트 대상 import
import Task from '@/lib/models/wbs/TaskModel';
import User from '@/lib/models/User';
import { GET } from './route';

describe('GET /api/wbs/tasks', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  it('pid로 해당 프로젝트의 작업만 조회한다', async () => {
    // Arrange — 테스트 데이터 DB에 직접 삽입
    const user = await User.create({ authorEmail: 'a@test.com', nName: '유저', uid: 1, password: 'pw' });
    await Task.create({ pid: 1, title: '작업', assignee: user._id, startDate: new Date(), endDate: new Date() });

    // Act — Route Handler 직접 호출
    const request = createMockNextRequest('http://localhost:3000/api/wbs/tasks?pid=1');
    const response = await GET(request);
    const body = await response.json();

    // Assert — HTTP 응답 + 데이터 검증
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });
});
```

### 5-2. 인증 필요 라우트 (예: POST /api/projects)

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));  // headers() 호출 무시

// getServerSession Mock
const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

import User from '@/lib/models/User';
import { POST } from './route';

describe('POST /api/projects', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();  // 세션 Mock 초기화
  });
  afterAll(async () => await teardownTestDB());

  it('인증된 유저가 프로젝트를 생성하면 201을 반환한다', async () => {
    const user = await User.create({ ... });

    // 인증 상태 설정
    mockGetServerSession.mockResolvedValue({
      user: { _id: user._id.toString() },
      expires: '2099-12-31',
    });

    const request = new Request('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '프로젝트', category: 'WEB', content: '내용', members: [...] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });

  it('미인증 시 401을 반환한다', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/projects', { ... });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
```

### 5-3. 관리자 권한 라우트 (예: GET /api/admin/stats)

```typescript
// requireAdmin()은 내부적으로 getServerSession을 호출하므로
// getServerSession만 Mock하면 됩니다.

it('일반 유저는 403을 반환한다', async () => {
  mockGetServerSession.mockResolvedValue({
    user: { _id: 'user-id', memberType: 'user' },  // admin이 아님
    expires: '2099-12-31',
  });

  const response = await GET();
  expect(response.status).toBe(403);
});

it('관리자는 통계를 조회할 수 있다', async () => {
  mockGetServerSession.mockResolvedValue({
    user: { _id: 'admin-id', memberType: 'admin' },
    expires: '2099-12-31',
  });

  const response = await GET();
  expect(response.status).toBe(200);
});
```

---

## 6. API 테스트 필수 검증 항목

모든 API Route 테스트에서 반드시 확인해야 할 항목입니다.

### 공통 (모든 라우트)

| 검증 항목 | 설명 |
|----------|------|
| 성공 응답 형식 | `{ success: true, data: ... }` 또는 `{ success: true, message: '...' }` |
| 실패 응답 형식 | `{ success: false, message: '...' }` |
| HTTP 상태 코드 | 200, 201, 400, 401, 403, 404, 500 적절히 사용 |

### 인증 필요 라우트

| 검증 항목 | 설명 |
|----------|------|
| 미인증 → 401 | `mockGetServerSession.mockResolvedValue(null)` |
| 권한 없음 → 403 | 작성자가 아닌 유저, 일반 유저가 admin 접근 |
| 인증 성공 | 정상 세션으로 기능 동작 확인 |

### CRUD 라우트

| 검증 항목 | 설명 |
|----------|------|
| 생성 후 DB 저장 | `await Model.findById(id)` 로 실제 저장 확인 |
| 수정 후 값 유지 | 변경하지 않은 필드가 원래 값 유지하는지 확인 |
| 삭제 후 DB 제거 | `await Model.findById(id)` 가 `null` 인지 확인 |
| 연관 데이터 정리 | 삭제 시 다른 문서의 참조(dependencies 등)도 정리 |
| 필수 필드 누락 → 400 | 각 필수 필드별 누락 테스트 |
| 존재하지 않는 ID → 404 | 유효하지만 존재하지 않는 ObjectId |

### 목록 조회 라우트

| 검증 항목 | 설명 |
|----------|------|
| 페이지네이션 | page, limit 파라미터 동작 + total 값 정확성 |
| 필터 | search, category, status 등 개별 필터 동작 |
| 정렬 | 기대한 순서로 결과 반환 |
| 빈 결과 | 결과 없을 때 `[]` 반환 (에러가 아님) |
| populate | 참조 필드가 올바르게 확장되었는지 확인 |

---

## 7. 테스트 데이터 생성 패턴

### 헬퍼 함수 패턴

각 테스트 파일에서 자주 사용하는 데이터 생성을 헬퍼 함수로 추출합니다.

```typescript
// 유저 생성 헬퍼 (uid, email 충돌 방지)
async function createTestUser(overrides?: Record<string, unknown>) {
  return User.create({
    authorEmail: `user-${Date.now()}-${Math.random()}@test.com`,
    nName: '테스트유저',
    uid: Date.now() + Math.floor(Math.random() * 10000),
    memberType: 'user',
    password: 'test1234',
    ...overrides,
  });
}

// 프로젝트 생성 헬퍼 (pid 자동 증가)
async function createTestProject(authorId: string, overrides?: Record<string, unknown>) {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'project_pid' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return Project.create({
    pid: counter!.seq,
    title: `테스트 프로젝트 ${counter!.seq}`,
    category: 'WEB',
    author: authorId,
    members: [{ role: '프론트엔드', current: 0, max: 2 }],
    content: '테스트 프로젝트입니다.',
    status: '01',
    ...overrides,
  });
}
```

> **주의**: `uid`와 `authorEmail`에는 유니크 인덱스가 있으므로, `Date.now()` + `Math.random()` 조합으로 충돌을 방지합니다.

### 복합 시나리오 패턴

프로젝트 + 지원자처럼 여러 모델이 필요한 경우, 설정 함수를 만듭니다.

```typescript
async function createProjectWithApplicant() {
  const owner = await createTestUser({ nName: '프로젝트장' });
  const applicant = await createTestUser({ nName: '지원자' });
  const project = await Project.create({
    pid: Date.now(), title: '프로젝트', category: 'WEB', author: owner._id,
    members: [{ role: '프론트엔드', current: 0, max: 2 }], content: '내용', status: '01',
  });
  const application = await Application.create({
    projectId: project._id, applicantId: applicant._id,
    role: '프론트엔드', message: '지원합니다', status: 'pending',
  });
  return { owner, applicant, project, application };
}
```

---

## 8. Mock이 필요한 모듈 정리

API Route 테스트에서 자주 Mock해야 하는 모듈 목록입니다.

| 모듈 | Mock 방법 | 이유 |
|------|----------|------|
| `@/lib/mongodb` | `vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }))` | 인메모리 DB에 이미 연결됨 |
| `next-auth` | `vi.fn()`으로 `getServerSession` 교체 | 세션 상태 제어 |
| `next-auth/next` | 동일하게 Mock | 일부 라우트에서 이 경로로 import |
| `@/lib/auth` | `vi.mock('@/lib/auth', () => ({ authOptions: {} }))` | 실제 authOptions 불필요 |
| `next/headers` | `vi.mock('next/headers', () => ({ headers: vi.fn() }))` | `headers()` 호출 무시 |

### next-auth Mock 주의사항

라우트에 따라 `next-auth`와 `next-auth/next` 중 어느 것을 import하는지 확인하세요.
**둘 다 Mock**하면 안전합니다.

```typescript
// 라우트가 어디서 import하는지 모를 때 — 둘 다 Mock
const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
```

---

## 9. 앞으로 추가 개발 시 테스트 추가하는 법

### Case A — 기존 API Route에 새 HTTP 메서드를 추가할 때

예: `/api/projects/[pid]`에 `POST` 메서드 추가

```typescript
// 해당 route.test.ts에 describe 블록 추가
describe('POST /api/projects/[pid]', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  it('정상 동작 시 201을 반환한다', async () => { ... });
  it('미인증 시 401을 반환한다', async () => { ... });
  it('필수 필드 누락 시 400을 반환한다', async () => { ... });
});
```

### Case B — 새 API Route를 만들 때

예: `src/app/api/reviews/route.ts` 생성

1. 라우트 파일 옆에 `route.test.ts` 생성
2. 아래 보일러플레이트 복사 후 수정

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from '@/__tests__/helpers/mockDb';
import { createMockNextRequest } from '@/__tests__/helpers/apiTestHelper';

vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));

const mockGetServerSession = vi.fn();
vi.mock('next-auth', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('next-auth/next', () => ({
  getServerSession: (...args: any[]) => mockGetServerSession(...args),
}));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// 필요한 모델 import
import { GET, POST } from './route';

// 테스트 데이터 생성 헬퍼 (필요 시)
async function createTestUser(overrides?: Record<string, unknown>) {
  // ...
}

describe('GET /api/reviews', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => {
    await clearTestDB();
    vi.restoreAllMocks();
  });
  afterAll(async () => await teardownTestDB());

  // 테스트 작성...
});
```

### Case C — requireAdmin 사용 라우트

`@/lib/adminAuth`의 `requireAdmin()`을 사용하는 라우트는 별도 Mock이 불필요합니다.
`requireAdmin()` 내부에서 `getServerSession`을 호출하므로, next-auth Mock만으로 충분합니다.

```typescript
// 일반 유저 → 403
mockGetServerSession.mockResolvedValue({
  user: { _id: 'user-id', memberType: 'user' },
  expires: '2099-12-31',
});

// 관리자 → 200
mockGetServerSession.mockResolvedValue({
  user: { _id: 'admin-id', memberType: 'admin' },
  expires: '2099-12-31',
});
```

---

## 10. 트러블슈팅

### Q: `MongoMemoryServer` 시작이 느리다

**A**: 첫 실행 시 MongoDB 바이너리를 다운로드합니다(약 100MB). 이후에는 캐시되어 빠르게 시작합니다. 전체 API 테스트 소요 시간은 약 4~5초입니다.

### Q: `unique index` 충돌 에러가 발생한다

**A**: `afterEach`에서 `clearTestDB()`가 호출되는지 확인하세요. 또한 테스트 데이터 생성 시 `Date.now()` + `Math.random()` 조합으로 유니크 필드 충돌을 방지합니다.

### Q: `getServerSession`이 Mock되지 않는다

**A**: 테스트 대상 라우트가 `next-auth`와 `next-auth/next` 중 어디서 import하는지 확인하세요. 안전하게 **둘 다 Mock**하세요.

### Q: `headers()` 호출로 에러가 발생한다

**A**: 일부 라우트에서 `next/headers`의 `headers()`를 호출합니다. `vi.mock('next/headers', () => ({ headers: vi.fn() }))` 을 추가하세요.

### Q: Mongoose 스키마 검증 에러로 테스트가 실패한다

**A**: `findByIdAndUpdate`에 `runValidators: true` 옵션이 있으면, 스키마의 커스텀 validator가 실행됩니다. 특히 `endDate >= startDate` 검증 시 `findByIdAndUpdate`는 `this`가 쿼리 객체를 참조하므로 예상과 다르게 동작할 수 있습니다. 이런 경우 라우트 핸들러 내에서 별도로 검증하는 것이 안전합니다.

---

## 11. 현재 전체 테스트 현황

```
총 457개 테스트 (18개 파일)

Phase 1 (순수 함수):                203개
  ├ taskDependency.test.ts            59개
  ├ scheduleConflict.test.ts          52개
  ├ iconUtils.test.ts                 43개
  ├ profileUtils.test.ts              27개
  ├ chat.test.ts                       9개
  └ chatUtils.test.ts                 13개

Phase 2 (스토어 + 훅):             161개
  ├ wbsStore.test.ts                  53개
  ├ boardStore.test.ts                76개
  ├ modalStore.test.ts                26개
  └ useModal.test.ts                   6개

Phase 3 (API 통합):                 93개
  ├ wbs/tasks/route.test.ts           13개
  ├ wbs/tasks/[taskId]/route.test.ts  10개
  ├ wbs/tasks/batch/route.test.ts     10개
  ├ projects/route.test.ts            15개
  ├ projects/[pid]/route.test.ts      18개
  ├ applications/route.test.ts         6개
  ├ applications/[appId]/route.test.ts 14개
  └ admin/stats/route.test.ts          7개
```

---

## 12. 한 줄 요약

| 상황 | 할 일 |
|------|-------|
| 새 API Route 생성 | 파일 옆에 `route.test.ts` 만들고, 보일러플레이트 복사 |
| 인증 필요 라우트 | `mockGetServerSession`으로 인증/미인증 상태 제어 |
| 관리자 전용 라우트 | `memberType: 'admin'`으로 세션 설정 |
| DB 데이터 필요 | `beforeAll`에서 `setupTestDB()`, 헬퍼로 데이터 생성 |
| 필수 검증 | 성공 201, 미인증 401, 권한 없음 403, 없는 리소스 404, 입력 오류 400 |
| headers() 에러 | `vi.mock('next/headers', () => ({ headers: vi.fn() }))` 추가 |
| 유니크 충돌 | 데이터 생성 시 `Date.now() + Math.random()` 사용 |
