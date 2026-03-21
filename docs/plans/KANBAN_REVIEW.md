# 칸반 보드 코드 리뷰 — 버그 / 개선 / 성능

> 분석 대상 파일
> - `src/store/boardStore.ts`
> - `src/components/board/BoardShell.tsx`
> - `src/components/board/NoteItem.tsx`
> - `src/components/board/SectionItem.tsx`
> - `src/app/api/kanban/notes/route.ts`
> - `src/app/api/kanban/notes/batch/route.ts`

---

## 🔴 버그 (실제 결함)

### BUG-1. `applyRemoteSectionUpdate` — 스테일 클로저로 인한 히스토리 오염
**파일**: `boardStore.ts` L1010–1017

```ts
// ❌ 문제 코드
applyRemoteSectionUpdate: (section) => {
  useBoardStore.temporal.getState().pause();
  set((state) => ({
    sections: state.sections.map((s) => s.id === section.id ? { ...s, ...section } : s)
  }));
  useBoardStore.temporal.getState().resume();

  const patch = (s: any) => ({
    ...s,
    sections: state.sections.map(...)  // ← 'state'가 set() 콜백 외부의 클로저 변수!
  });
```

`patch` 함수 내의 `state.sections`는 Zustand의 현재 상태가 아니라, 바깥 스코프의 `state`를 참조합니다. 실제로 이 위치에서 `state`라는 이름의 변수가 선언되어 있지 않기 때문에 `undefined`를 참조하거나 위에 선언된 클로저를 참조하게 됩니다. Undo/Redo 히스토리 패치가 잘못된 섹션 데이터를 주입하게 됩니다.

**수정 방향**: `set()` 호출 후 `get().sections`로 현재 상태를 명시적으로 읽어야 합니다.

---

### BUG-2. `fitToContent` — 노트 크기 하드코딩
**파일**: `boardStore.ts` L726–729

```ts
// ❌ 노트의 실제 width/height를 무시하고 고정값 200x140 사용
notes.forEach((n) => {
  maxX = Math.max(maxX, n.x + 200);  // n.width를 써야 함
  maxY = Math.max(maxY, n.y + 140);  // n.height를 써야 함
});
```

노트를 리사이즈한 뒤 "전체 보기" 기능을 사용하면 바운딩 박스 계산이 틀려져 일부 노트가 뷰포트 밖으로 잘립니다.

---

### BUG-3. 섹션 삭제 모달 — 백드롭 클릭이 의도치 않은 삭제를 유발
**파일**: `SectionItem.tsx` L514–548

```ts
const isDeleteAll = await confirm('섹션 삭제', '...', {
  confirmText: '모두 삭제',
  cancelText: '섹션만 삭제',
  closeOnBackdropClick: false   // ← false이지만 X 버튼은 null을 반환
});

if (isDeleteAll === null) return;   // X 버튼 → 안전하게 종료

if (isDeleteAll === true) {
  // 모두 삭제
} else {
  // ❌ false인 경우(취소 버튼)와 구분 없이 '섹션만 삭제' 실행됨
  removeSection(section.id);
  await fetch(`/api/kanban/sections/${section.id}?deleteNotes=false`, { method: 'DELETE' });
}
```

**[취소] 버튼**이 "섹션만 삭제"를 의미하는 것은 UX상 매우 비직관적입니다. 일반적으로 취소는 "아무것도 하지 않음"이 기대됩니다. 코드에도 이 문제가 주석으로 언급되어 있습니다.

**수정 방향**: 모달을 [모두 삭제 / 섹션만 삭제 / 취소] 3-버튼 구조로 변경하거나, 별도 `isDeleteAll === false` 케이스를 명시적으로 `return`으로 처리해야 합니다.

---

### BUG-4. `GET /api/kanban/notes` — 인증 검사 누락
**파일**: `src/app/api/kanban/notes/route.ts` L13–31

```ts
export async function GET(request: Request) {
  // ❌ 인증 체크 없음! boardId만 알면 누구나 노트를 조회 가능
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get('boardId');
  ...
  const notes = await Note.find({ boardId });
  return NextResponse.json(notes);
}
```

POST 핸들러에는 `getServerSession` 체크가 있지만 GET에는 없습니다. CLAUDE.md 컨벤션에도 "인증이 필요한 엔드포인트에 `getServerSession` 체크"가 명시되어 있습니다.

---

### BUG-5. Undo/Redo — 섹션 변경 사항이 Socket으로 전파되지 않음
**파일**: `boardStore.ts` L877–927

`undo()`와 `redo()` 함수는 노트의 변경 사항만 Socket으로 브로드캐스트하며, 섹션 변경 내용은 전파하지 않습니다.

```ts
undo: () => {
  useBoardStore.temporal.getState().undo();
  // ... 노트 변경은 Socket으로 전파
  // ❌ 섹션 변경은 누락됨
  // "섹션에 대해서도 상세 동기화가 필요하지만..." 주석이 있지만 미구현
},
```

섹션을 이동하거나 리사이즈한 후 Undo를 하면 본인 화면에서는 원복되지만 다른 접속자 화면에는 반영되지 않습니다.

---

### BUG-6. API 응답 형식 비일관성
**파일**: `src/app/api/kanban/notes/route.ts`, `batch/route.ts`

CLAUDE.md에 정의된 응답 형식은 `{ success: boolean, data | message | error }` 이지만, 칸반 API는 `{ error: string }` 또는 raw 배열을 반환합니다.

```ts
// ❌ 현재 (notes/route.ts)
return NextResponse.json({ error: 'A valid boardId is required' }, { status: 400 });
return NextResponse.json(notes);  // success 래퍼 없음

// ✅ CLAUDE.md 컨벤션
return NextResponse.json({ success: false, message: '유효한 boardId가 필요합니다.' }, { status: 400 });
return NextResponse.json({ success: true, data: notes });
```

클라이언트(`boardStore.ts`)가 `if (notesRes.ok)` 방식으로 처리하기 때문에 현재는 동작하지만, 다른 API Route와 에러 처리 방식이 달라집니다.

---

## 🟡 코드 품질 / 리팩토링

### REF-1. 유틸 함수 중복 (3곳)

| 함수 | 중복 위치 | 내용 |
|------|-----------|------|
| `stringToColor` | `NoteItem.tsx` L12–19, `SectionItem.tsx` L10–17 | userId → HEX 색상 변환 |
| `debounce` | `NoteItem.tsx` L34–53, `SectionItem.tsx` L21–40 | 디바운스 헬퍼 |
| 유저 색상 계산 | `boardStore.ts` L674–679, L695–701 | userId 해시 → 선택 색상 |

**수정 방향**: 세 함수 모두 `src/lib/utils/boardUtils.ts` 같은 공용 유틸 파일로 추출하세요.

---

### REF-2. `NoteItem.tsx` — `getDDayInfo` 동일 인자로 3회 호출
**파일**: `NoteItem.tsx` L1152–1158

```tsx
// ❌ 한 렌더에서 3번 호출
style={{
  borderColor: getDDayInfo(dueDate).color,    // 1회
  color: getDDayInfo(dueDate).color,          // 2회
}}
>
  {getDDayInfo(dueDate).label}               {/* 3회 */}
```

**수정 방향**: 렌더 함수 상단에서 한 번만 호출해 변수에 저장합니다.

```tsx
const ddayInfo = dueDate ? getDDayInfo(dueDate) : null;
```

---

### REF-3. `NoteItem.tsx` — `data-section-id`에서 스토어 직접 접근
**파일**: `NoteItem.tsx` L768

```tsx
// ❌ 렌더마다 Store에서 탐색
data-section-id={useBoardStore.getState().notes.find(n => n.id === id)?.sectionId || ''}
```

`NoteItem`은 현재 `sectionId`를 props로 받지 않습니다. 렌더마다 전체 notes 배열을 선형 탐색하게 됩니다.

**수정 방향**: `sectionId`를 `NoteItem`의 prop으로 추가하거나, Zustand 셀렉터를 통해 구독합니다.

---

### REF-4. `duplicateNotes` — 배치 API 없이 N번 API 호출
**파일**: `boardStore.ts` L521–524

```ts
duplicateNotes: (ids) => {
  const { duplicateNote } = get();
  ids.forEach(id => duplicateNote(id));  // N개를 N번 개별 POST 요청
},
```

`duplicateNote`는 내부에서 `fetch('/api/kanban/notes', { method: 'POST' })`를 직접 호출합니다. 10개를 복사하면 10번 API 요청이 발생합니다.

**수정 방향**: 배치 생성 API(`POST /api/kanban/notes/batch`)를 추가하고 `duplicateNotes`에서 사용합니다.

---

### REF-5. `handleAddSection` — 불필요한 중복 서버 요청
**파일**: `BoardShell.tsx` L370–396

섹션 생성 API가 이미 서버에서 포함된 노트들의 `sectionId`를 업데이트합니다. 그러나 클라이언트는 이후 `updateNotes()`를 호출해 동일한 내용을 다시 PATCH 요청합니다. 코드 자체에도 이 문제가 길게 주석으로 언급되어 있습니다.

**수정 방향**: 스토어에 `localUpdateNotes(updates)` 액션을 추가하여 DB 요청 없이 로컬 상태만 업데이트하는 경로를 만드세요.

---

### REF-6. `useLayoutEffect` 의존성 배열 억제
**파일**: `NoteItem.tsx` L473

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [draft, isEditing, tags, text]);
```

`height`, `id`, `updateNote`, `debouncedSave`가 의존성 배열에서 누락되어 ESLint를 억제하고 있습니다. 스테일 클로저 버그의 잠재적 원인입니다.

---

### REF-7. `initSocket` — 언마운트 시 소켓 리스너 미해제
**파일**: `BoardShell.tsx` L117–129

```tsx
React.useEffect(() => {
  if (boardPid && session?.user && boardId) {
    initSocket({ ... });

    return () => {
      socketClient.socket?.emit('leave-board', { boardId, userId: session.user.id });
      // ❌ socket.off('note-created'), socket.off('note-updated') 등이 없음
    };
  }
}, [boardPid, session, boardId, initSocket]);
```

컴포넌트 언마운트 시 `leave-board`만 emit되고, `initSocket` 내에서 등록된 이벤트 리스너(`note-created`, `note-updated` 등 10개 이상)가 해제되지 않습니다. 소켓이 싱글톤이므로 다른 페이지로 이동해도 리스너가 살아있습니다.

**수정 방향**: `initSocket`이 클린업 함수를 반환하거나, useEffect cleanup에서 모든 리스너를 명시적으로 해제합니다.

---

## 🟢 성능 개선

### PERF-1. 드래그 중 스냅 계산 — O(n) 연산이 매 포인터 이벤트마다 실행
**파일**: `NoteItem.tsx` L569–570, `SectionItem.tsx` L310

```ts
// onPointerMove 핸들러 내부 (60fps+)
const allNotes = useBoardStore.getState().notes;  // 전체 배열 가져오기
const { x: sx, y: sy, guides } = calculateSnap(newX, newY, width, height, id, allNotes);
// calculateSnap은 O(n) — 노트 9개 × 6개 좌표 점 비교
```

보드에 노트가 많을수록 드래그 성능이 저하됩니다.

**개선 방향**:
- `requestAnimationFrame`으로 호출 빈도를 프레임당 1회로 제한합니다.
- 또는 화면에 보이는 노트만 필터링한 뒤 스냅 계산 대상으로 사용합니다.

```ts
// rAF throttle 예시
const rafRef = useRef<number | null>(null);
const onPointerMove = (e) => {
  if (rafRef.current) return;
  rafRef.current = requestAnimationFrame(() => {
    // 스냅 계산 ...
    rafRef.current = null;
  });
};
```

---

### PERF-2. 다중 노트 드래그 중 DOM 직접 조작 — N개 querySelector 호출
**파일**: `NoteItem.tsx` L591–604

```ts
selectedNoteIds.forEach(selectedId => {
  if (selectedId === id) return;
  const el = document.querySelector(`[data-note-id="${selectedId}"]`);  // ← 매 프레임 DOM 탐색
  const transform = el.style.transform;
  const match = transform.match(/translate3d\(([^p]+)px,...\)/);       // ← 정규식 파싱
  el.style.transform = `translate3d(...)`;
});
```

선택된 노트 수 × 60fps = 대량의 DOM 탐색 + 정규식 파싱이 발생합니다.

**개선 방향**: 드래그 시작 시 각 노트의 DOM Element와 초기 위치를 `Map<id, { el, startX, startY }>` 형태로 캐싱하고, 이동 시에는 저장된 element와 누적 delta만 사용합니다.

```ts
// 드래그 시작 시 1회
const nodeCache = new Map();
selectedNoteIds.forEach(id => {
  const el = document.querySelector(`[data-note-id="${id}"]`);
  const note = notes.find(n => n.id === id);
  if (el && note) nodeCache.set(id, { el, startX: note.x, startY: note.y });
});

// 드래그 중 (캐시 활용)
nodeCache.forEach(({ el, startX, startY }) => {
  el.style.transform = `translate3d(${startX + totalDx}px, ${startY + totalDy}px, 0)`;
});
```

---

### PERF-3. 섹션 드래그 중 자식 노트 DOM 탐색
**파일**: `SectionItem.tsx` L329–339

```ts
// onPointerMoveHeader 내부 (매 프레임)
const childNoteEls = document.querySelectorAll(`[data-section-id="${section.id}"]`);
childNoteEls.forEach((el) => {
  const transform = el.style.transform;
  const match = transform.match(...);  // 정규식 파싱
  el.style.transform = `translate3d(...)`;
});
```

PERF-2와 동일한 패턴입니다. 섹션 이동 시 자식 노트가 많을수록 매 프레임 DOM 전체 탐색 + 정규식이 실행됩니다.

---

### PERF-4. 빠른 패닝 중 스테일 `pan` 값 사용
**파일**: `BoardShell.tsx` L286–288

```tsx
// isPanning 중 실행되는 handlePointerMove
setPan(pan.x + dx, pan.y + dy);
// ↑ pan은 마지막 렌더 사이클의 값 — 빠른 이동 시 렌더 전에 여러 이벤트가 쌓이면 누적 오차 발생
```

**개선 방향**: `pan.x` 대신 `useBoardStore.getState().pan`을 사용하여 항상 최신 스토어 값을 참조합니다.

```ts
const { pan: currentPan } = useBoardStore.getState();
setPan(currentPan.x + dx, currentPan.y + dy);
```

---

### PERF-5. `removeNotes` — 배치 삭제인데 Socket은 개별 emit
**파일**: `boardStore.ts` L456–460

```ts
// ❌ N개 삭제 = N번 socket emit
ids.forEach(id => {
  socket.emit('delete-note', { boardId: boardId!, noteId: id });
});
```

서버에는 `batch-delete` API가 있지만, 소켓 이벤트는 여전히 건별로 전송됩니다. 노트 100개 삭제 시 socket 이벤트 100개가 발생합니다.

**개선 방향**: `server.ts`에 `delete-notes-batch` 이벤트를 추가하고, 클라이언트에서 배열로 한 번에 전송합니다.

---

### PERF-6. Temporal 히스토리 전체 순회 — 이벤트가 많을수록 느려짐
**파일**: `boardStore.ts` L940–966 (applyRemoteNoteCreation, Update, Deletion)

원격 업데이트마다 전체 Undo 히스토리(최대 50개 스냅샷)를 순회하여 각 스냅샷에 변경 사항을 주입합니다.

```ts
const { pastStates, futureStates } = useBoardStore.temporal.getState();
const inject = (s: any) => ({ ...s, notes: [...s.notes, note] });
(useBoardStore.temporal as any).setState({
  pastStates: pastStates.map(inject),   // 최대 50회 순회
  futureStates: futureStates.map(inject)
});
```

노트 수 × 히스토리 스냅샷 수 만큼 객체 복사가 발생합니다. 실시간 협업 환경에서 원격 이벤트가 빈번할수록 누적됩니다.

**개선 방향**: 히스토리 한도를 낮추거나(현재 50), 원격 이벤트 수신 시 미래 스냅샷(`futureStates`)만 삭제하고 현재 상태와 병합하는 단순화 전략을 고려합니다.

---

## 우선순위 요약

| 우선순위 | 항목 | 파일 | 영향 |
|----------|------|------|------|
| 🔴 즉시 | BUG-1: applyRemoteSectionUpdate 스테일 클로저 | boardStore.ts | 실시간 협업 시 히스토리 오염 |
| 🔴 즉시 | BUG-4: GET 노트 API 인증 누락 | notes/route.ts | 보안 취약점 |
| 🔴 즉시 | BUG-2: fitToContent 하드코딩 치수 | boardStore.ts | 전체 보기 기능 오작동 |
| 🟡 단기 | BUG-3: 섹션 삭제 모달 취소 UX | SectionItem.tsx | 데이터 의도치 않게 삭제 가능 |
| 🟡 단기 | BUG-5: Undo/Redo 섹션 미동기화 | boardStore.ts | 협업 중 불일치 |
| 🟡 단기 | REF-7: 소켓 리스너 미해제 | BoardShell.tsx | 메모리 누수 가능성 |
| 🟡 단기 | PERF-4: 패닝 시 스테일 pan 값 | BoardShell.tsx | UX 끊김 |
| 🟢 중기 | REF-1: 유틸 함수 중복 | NoteItem, SectionItem | 유지보수성 |
| 🟢 중기 | PERF-1: 스냅 계산 rAF 제한 | NoteItem.tsx | 고부하 보드 성능 |
| 🟢 중기 | PERF-2/3: DOM 쿼리 캐싱 | NoteItem, SectionItem | 다중 선택 드래그 성능 |
| 🟢 장기 | REF-4: duplicateNotes 배치화 | boardStore.ts | 네트워크 요청 수 감소 |
| 🟢 장기 | PERF-5: 배치 삭제 Socket 이벤트 | boardStore.ts | 대량 삭제 시 네트워크 부하 |
| 🟢 장기 | BUG-6: API 응답 형식 통일 | kanban API 전체 | 코드 일관성 |
