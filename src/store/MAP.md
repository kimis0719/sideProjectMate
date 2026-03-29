# Store MAP

| 파일            | 관리 상태           | 주요 액션                                          |
| --------------- | ------------------- | -------------------------------------------------- |
| `boardStore.ts` | 칸반 보드/섹션/노트 | fetchBoard, addNote, moveNote, setFilterLabel      |
| `wbsStore.ts`   | WBS 태스크 트리     | fetchTasks, addTask, updateTask, undo/redo (zundo) |
| `modalStore.ts` | 전역 모달 상태      | openModal, closeModal                              |
| `instructionStore.ts` | AI 지시서 모달/생성 | openModal, generate (SSE), setTarget, setPreset |

## 공통 패턴

```ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FooState { ... }
interface FooActions { ... }

export const useFooStore = create<FooState & FooActions>()(
  devtools((set, get) => ({ ... }), { name: 'fooStore' })
);
```

## 주의

- `window.alert()` / `window.confirm()` 금지 → `modalStore` 또는 `useModal` 훅 사용
- Socket 이벤트 핸들러는 스토어 액션과 분리 (`useChatSocket.ts` 참고)

## 자동 생성 파일 목록
> 마지막 갱신: 2026-03-29

- `boardStore.ts`
- `instructionStore.ts`
- `modalStore.ts`
- `wbsStore.ts`
