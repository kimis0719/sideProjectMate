# Phase 2 테스트 사용 가이드 (Zustand 스토어 + 훅)

---

## 1. Phase 1과의 차이점

Phase 1이 **순수 함수**(입력 → 출력)를 테스트했다면, Phase 2는 **상태 관리 로직**을 테스트합니다.

| 비교        | Phase 1          | Phase 2                                |
| ----------- | ---------------- | -------------------------------------- |
| 대상        | 유틸 함수        | Zustand 스토어, React 훅               |
| Mock        | 없음 (순수 함수) | fetch, Socket.io, 스토어 상태          |
| 검증 포인트 | 반환값           | 상태 변화, API 호출, 소켓 이벤트, 롤백 |

---

## 2. 테스트 파일 구조

```
src/
├── __tests__/
│   ├── setup.ts                     # 전역 설정
│   ├── fixtures/                    # Mock 데이터 (Phase 1)
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── chat.ts
│   │   └── index.ts
│   └── helpers/                     # 테스트 헬퍼 (Phase 2 신규)
│       ├── mockSession.ts           # next-auth 세션 Mock
│       ├── mockSocket.ts            # Socket.io 클라이언트 Mock
│       └── index.ts                 # 통합 export
│
├── store/
│   ├── wbsStore.ts
│   ├── wbsStore.test.ts             ← 53개 테스트
│   ├── boardStore.ts
│   ├── boardStore.test.ts           ← 76개 테스트
│   ├── modalStore.ts
│   └── modalStore.test.ts           ← 26개 테스트
│
└── hooks/
    ├── useModal.ts
    └── useModal.test.ts             ← 6개 테스트
```

---

## 3. 기본 명령어 (Phase 1과 동일)

```bash
# 개발 중 — 파일 저장할 때마다 자동 재실행
npm run test:watch

# 전체 실행
npm run test:run

# 특정 스토어만 실행
npx vitest run src/store/wbsStore.test.ts
npx vitest run src/store/boardStore.test.ts

# 커버리지 확인
npm run test:coverage
```

---

## 4. Phase 2 핵심 테스트 패턴

### 4-1. fetch Mock (API 호출 대체)

실제 서버에 요청하지 않고 가짜 응답을 반환합니다.

```typescript
// 성공 응답 Mock
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true, data: { _id: 'task-001', title: '작업' } }),
});

// 실패 응답 Mock
global.fetch = vi.fn().mockResolvedValue({
  ok: false,
  json: () => Promise.resolve({ success: false, message: '에러' }),
});
```

### 4-2. Socket Mock (소켓 이벤트 대체)

```typescript
// src/__tests__/helpers/mockSocket.ts의 createMockSocket() 사용
const { mockSocket, emitFromServer } = createMockSocket();

// 클라이언트 → 서버 이벤트 검증
expect(mockSocket.emit).toHaveBeenCalledWith('wbs-create-task', { projectId: '1', task: data });

// 서버 → 클라이언트 이벤트 시뮬레이션
emitFromServer('wbs-task-created', { _id: 'new-001', title: '원격 작업' });
```

### 4-3. Zustand 스토어 직접 테스트

React 렌더링 없이 스토어를 직접 조작합니다.

```typescript
// 상태 읽기
const state = useWbsStore.getState();

// 상태 직접 설정 (테스트 준비용)
useWbsStore.setState({ tasks: [mockTask], selectedTaskId: 'task-001' });

// 액션 호출
await useWbsStore.getState().fetchTasks(1);

// 각 테스트 전 초기화
beforeEach(() => {
  useWbsStore.setState({ tasks: [], selectedTaskId: null, ... });
});
```

---

## 5. 주요 테스트 시나리오 읽는 법

### Optimistic Update 검증

서버 응답 전에 UI가 먼저 반영되는 것을 확인합니다.

```typescript
it('Optimistic Update로 임시 ID를 가진 작업이 즉시 추가된다', async () => {
  // fetch를 지연시켜 중간 상태를 관찰
  let resolveFetch;
  global.fetch = vi.fn().mockReturnValue(
    new Promise((resolve) => {
      resolveFetch = resolve;
    })
  );

  const promise = useWbsStore.getState().addTask(newTask);

  // 서버 응답 전 — 이미 UI에 반영됨
  expect(useWbsStore.getState().tasks).toHaveLength(1);
  expect(useWbsStore.getState().tasks[0].id).toMatch(/^temp-/);

  // 서버 응답 후 — 임시 ID가 실제 ID로 교체됨
  resolveFetch({ ok: true, json: () => Promise.resolve({ success: true, data: serverTask }) });
  await promise;
  expect(useWbsStore.getState().tasks[0].id).toBe('saved-001');
});
```

### 에러 롤백 검증

API 실패 시 원래 상태로 돌아가는 것을 확인합니다.

```typescript
it('API 실패 시 원래 상태로 롤백된다', async () => {
  useWbsStore.setState({ tasks: [originalTask] });
  global.fetch = vi.fn().mockResolvedValue({ ok: false });

  await useWbsStore.getState().updateTask('task-001', { title: '변경 시도' });

  // 원래 제목 유지
  expect(useWbsStore.getState().tasks[0].title).toBe('원래 제목');
});
```

### 소켓 이벤트 수신 검증

다른 팀원이 보낸 실시간 이벤트를 처리하는 것을 확인합니다.

```typescript
it('wbs-task-deleted 이벤트 수신 시 해당 task가 제거된다', () => {
  useWbsStore.setState({ tasks: [task1, task2] });
  useWbsStore.getState().initSocket(1); // 이벤트 핸들러 등록

  emitFromServer('wbs-task-deleted', 'task-001'); // 서버 이벤트 시뮬레이션

  expect(useWbsStore.getState().tasks).toHaveLength(1);
});
```

---

## 6. 앞으로 추가 개발 시 테스트 추가하는 법

### Case A — 기존 스토어에 새 액션을 추가할 때

예: `wbsStore`에 `reorderTasks()` 액션을 추가했을 때

```typescript
// wbsStore.test.ts 맨 아래에 describe 블록 추가
describe('reorderTasks', () => {
  it('작업 순서가 변경된다', () => {
    useWbsStore.setState({ tasks: [task1, task2, task3] });
    useWbsStore.getState().reorderTasks(['task-3', 'task-1', 'task-2']);
    expect(useWbsStore.getState().tasks[0].id).toBe('task-3');
  });

  it('소켓으로 순서 변경을 브로드캐스트한다', () => {
    useWbsStore.setState({ currentPid: 1 });
    useWbsStore.getState().reorderTasks([...]);
    expect(mockSocket.emit).toHaveBeenCalledWith('wbs-reorder-tasks', expect.anything());
  });
});
```

### Case B — 새로운 Zustand 스토어를 만들 때

예: `src/store/chatStore.ts`를 새로 만들었을 때

```
1. src/store/chatStore.ts          ← 새 스토어
2. src/store/chatStore.test.ts     ← 바로 옆에 테스트 파일 생성
```

```typescript
// chatStore.test.ts 기본 구조
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 소켓이 필요하면 vi.hoisted + vi.mock 패턴 사용
const { mockSocket } = vi.hoisted(() => {
  const listeners = new Map();
  return {
    mockSocket: {
      emit: vi.fn(),
      on: vi.fn((event, handler) => {
        /* 핸들러 등록 */
      }),
      off: vi.fn((event) => {
        /* 핸들러 해제 */
      }),
      disconnect: vi.fn(),
    },
  };
});
vi.mock('@/lib/socket', () => ({ getSocket: () => mockSocket }));

import { useChatStore } from './chatStore';

const resetStore = () => {
  useChatStore.setState({
    /* 초기값 */
  });
};

describe('chatStore', () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
    mockSocket.emit.mockClear();
  });

  // 테스트 작성...
});
```

> **주의**: `boardStore`처럼 `socketClient.connect()`를 사용하는 스토어는 vi.mock에 `socketClient`도 포함해야 합니다.

### Case C — API 호출이 있는 액션 테스트 체크리스트

새로운 fetch 기반 액션을 테스트할 때 반드시 확인할 항목:

| 확인 항목                                                  | 예시                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| API 성공 시 상태가 올바르게 업데이트되는가                 | `expect(state.tasks).toHaveLength(2)`                                |
| API 호출 URL과 method가 올바른가                           | `expect(fetch).toHaveBeenCalledWith('/api/...', { method: 'POST' })` |
| Optimistic Update가 있다면, 서버 응답 전 상태가 반영되는가 | fetch를 지연시켜 중간 상태 관찰                                      |
| API 실패 시 롤백이 동작하는가                              | `mockFetchFailure()` → 원래 상태 유지                                |
| 소켓 브로드캐스트가 올바른 이벤트명과 데이터로 호출되는가  | `expect(mockSocket.emit).toHaveBeenCalledWith(...)`                  |
| 소켓 조건이 없으면 emit하지 않는가                         | `currentPid: null` → `emit` 미호출                                   |

---

## 7. 테스트 헬퍼 사용법

### mockSession.ts

```typescript
import { createMockSession } from '@/__tests__/helpers';

// 기본 세션 (Alice, MEM 타입)
const session = createMockSession();

// 커스텀 세션
const adminSession = createMockSession({
  user: { _id: 'admin-001', memberType: 'ADM' },
});

// 미인증 상태는 null 전달
const noSession = null;
```

### mockSocket.ts

```typescript
import { createMockSocket } from '@/__tests__/helpers';

const { mockSocket, emitFromServer, clearListeners } = createMockSocket();

// mockSocket     — on/off/emit/disconnect를 가진 가짜 소켓
// emitFromServer — 서버 → 클라이언트 이벤트 시뮬레이션
// clearListeners — 등록된 모든 이벤트 리스너 초기화
```

---

## 8. vi.mock 호이스팅 주의사항

`vi.mock()`은 파일 최상단으로 호이스팅되므로, 외부 변수를 참조하면 에러가 발생합니다.

```typescript
// ❌ 에러 — mockSocket이 아직 초기화되지 않음
const { mockSocket } = createMockSocket();
vi.mock('@/lib/socket', () => ({
  getSocket: () => mockSocket, // ReferenceError!
}));

// ✅ 올바른 방법 — vi.hoisted()로 선언을 호이스팅
const { mockSocket } = vi.hoisted(() => {
  return {
    mockSocket: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
    },
  };
});
vi.mock('@/lib/socket', () => ({
  getSocket: () => mockSocket, // 정상 동작
}));
```

> `wbsStore.test.ts`는 `createMockSocket()`이 동작하지만, `boardStore.test.ts`는 `socketClient` import 순서 때문에 `vi.hoisted()` 패턴이 필수입니다.

---

## 9. 현재 전체 테스트 현황

```
총 364개 테스트 (10개 파일)

Phase 1 (순수 함수):          203개
  ├ taskDependency.test.ts      59개
  ├ scheduleConflict.test.ts    52개
  ├ iconUtils.test.ts           43개
  ├ profileUtils.test.ts        27개
  ├ chat.test.ts                 9개
  └ chatUtils.test.ts           13개

Phase 2 (스토어 + 훅):        161개
  ├ wbsStore.test.ts            53개
  ├ boardStore.test.ts          76개
  ├ modalStore.test.ts          26개
  └ useModal.test.ts             6개
```

---

## 10. 한 줄 요약

| 상황                       | 할 일                                                        |
| -------------------------- | ------------------------------------------------------------ |
| 기존 스토어에 새 액션 추가 | 해당 스토어 테스트 파일에 `describe` 블록 추가               |
| 새 Zustand 스토어 생성     | 파일 옆에 `*.test.ts` 만들고, resetStore + vi.mock 패턴 적용 |
| fetch 사용 액션            | 성공/실패/롤백/소켓 브로드캐스트 4가지 검증                  |
| 소켓 수신 이벤트           | `emitFromServer()`로 서버 이벤트 시뮬레이션 후 상태 확인     |
| vi.mock 에러 발생          | `vi.hoisted()` 패턴으로 변경                                 |
