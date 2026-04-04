# Phase 5.5 — 대시보드 위젯 신규 개발 상세 기획서

> 선행 조건: Phase 5 프로젝트 대시보드 디자인 교체 완료
> 실행 시점: Phase 8 이후, Phase 9 이전
> 예상 기간: 0.5~1일

---

## 개요

프로젝트 대시보드(`/dashboard/[pid]`)에 두 가지 위젯을 추가하여 프로젝트 현황을 한눈에 파악할 수 있도록 한다.

| 위젯 | 기능 | 에셋 참조 |
|------|------|----------|
| Sprint Pulse | 칸반 노트 상태별 카운트 + 진행률 바 | `09_dashboard_pc.html` Sprint Pulse 섹션 |
| Recent Chat | 최근 팀 채팅 메시지 미리보기 | `09_dashboard_pc.html` Recent Chat 섹션 |

---

## 1. Sprint Pulse 위젯

### 데이터 흐름

```
pid (프로젝트 ID)
  → GET /api/kanban/boards?pid={pid}  → boardId
  → GET /api/kanban/notes?boardId={boardId}&status=active  → activeNotes[]
  → GET /api/kanban/notes?boardId={boardId}&status=done    → doneNotes[]
```

### 기존 API 현황

| API | 존재 여부 | 비고 |
|-----|----------|------|
| `GET /api/kanban/boards?pid=` | ✅ 있음 | boardId 조회, 없으면 자동 생성 |
| `GET /api/kanban/notes?boardId=&status=` | ✅ 있음 | 상태별 노트 조회 |
| 노트 카운트 집계 API | ❌ 없음 | 전체 노트를 받아서 클라이언트에서 count |

### API 신규/수정 필요 사항

**옵션 A (추천): 클라이언트 집계** — API 수정 없음
- 기존 API 2번 호출 → `notes.length`로 카운트
- 노트 수가 적으므로 (프로젝트당 ~50개 이하) 성능 문제 없음

**옵션 B: 서버 집계 API 신규** — 향후 최적화 시
```
GET /api/kanban/boards/{boardId}/stats
→ { active: 12, done: 18, total: 30 }
```

### 신규 컴포넌트

**`src/components/dashboard/SprintPulseWidget.tsx`**

```tsx
interface SprintPulseWidgetProps {
  pid: string;  // 프로젝트 pid (숫자)
}
```

**UI 구조 (에셋 기준):**
```
┌─────────────────────────────┐
│ Sprint Pulse    칸반 보드 보기 →│
├─────────────────────────────┤
│ 할 일                     4 │
│ ████░░░░░░░░░░░░░░░░░░  25% │
│                             │
│ 진행 중                   2 │
│ ██░░░░░░░░░░░░░░░░░░░░  12% │
│                             │
│ 완료                     18 │
│ ████████████████░░░░░░  75% │
└─────────────────────────────┘
```

**동작:**
- 마운트 시 boards API → notes API 2번 호출
- active 노트 중 sectionId가 있는 것 = "진행 중", 없는 것(인박스) = "할 일"
- done 노트 = "완료"
- 진행률 바: `(count / total) * 100%`
- "칸반 보드 보기" → `/dashboard/{pid}/kanban` 링크

### 건드리면 안 되는 코드

| 파일 | 이유 |
|------|------|
| `boardStore.ts` | 대시보드 위젯은 독립적으로 API 호출, 스토어 미사용 |
| 칸반 notes/boards API | 읽기 전용 사용, 수정 없음 |

---

## 2. Recent Chat 위젯

### 데이터 흐름

```
projectId (MongoDB ObjectId)
  → GET /api/chat/rooms (필터: category=TEAM, projectId 매칭)  → roomId
  → GET /api/chat/messages/{roomId}?limit=3  → recentMessages[]
```

### 기존 API 현황

| API | 존재 여부 | 비고 |
|-----|----------|------|
| `GET /api/chat/rooms` | ✅ 있음 | 내 채팅방 목록 (projectId 포함) |
| `GET /api/chat/messages/{roomId}?limit=N` | ✅ 있음 | 최근 메시지 조회 |
| `POST /api/chat/rooms` | ✅ 있음 | TEAM 방 자동 생성/중복방지 |

### API 신규/수정 필요 사항

**없음** — 기존 API만으로 구현 가능

단, `GET /api/chat/rooms` 응답에서 `projectId`와 `category`로 필터링해야 함.
현재 API는 전체 목록을 반환하므로 클라이언트에서 필터링.

### 신규 컴포넌트

**`src/components/dashboard/RecentChatWidget.tsx`**

```tsx
interface RecentChatWidgetProps {
  projectId: string;  // MongoDB ObjectId (_id)
  pid: string;        // 프로젝트 pid (숫자, 라우팅용)
}
```

**UI 구조 (에셋 기준):**
```
┌─────────────────────────────┐
│ Recent Chat                 │
├─────────────────────────────┤
│ 👤 신경 지연 시간 테스트가  │
│    새로운 기준치를 통과했나요?│
│                             │
│         네, 현재 일관되게   👤│
│         12ms를 유지합니다.   │
├─────────────────────────────┤
│ [메시지 입력...]        전송 │
└─────────────────────────────┘
```

**동작:**
- 마운트 시 rooms API에서 TEAM + projectId 매칭 방 찾기
- 방이 없으면 "아직 팀 채팅방이 없습니다" 표시
- 최근 3개 메시지 표시 (발신자 아바타 + 텍스트)
- 내 메시지: 우측 정렬 (`bg-primary-container`)
- 상대 메시지: 좌측 정렬 (`bg-surface-container-low`)
- 메시지 입력 → 전송 기능은 **미포함** (간소화, 채팅 페이지로 유도)
- 하단 "채팅 열기" 링크 → `/chat?roomId={roomId}`

### 건드리면 안 되는 코드

| 파일 | 이유 |
|------|------|
| chat rooms/messages API | 읽기 전용 사용, 수정 없음 |
| Socket.io 이벤트 | 위젯은 폴링 방식, 소켓 미사용 (간소화) |
| ChatWindow.tsx | 기존 채팅 UI와 독립 |

---

## 3. 대시보드 페이지 통합

### 변경 대상
- `src/app/dashboard/[pid]/page.tsx`

### Bento Grid 배치 (에셋 기준)

```
현재:
┌──────────────────┬─────────┐
│ ProjectOverview  │ 팀채팅  │
│ (col-span-8)     │ Member  │
│                  │ (col-4) │
└──────────────────┴─────────┘

변경 후:
┌──────────────────┬─────────┐
│ ProjectOverview  │ 팀채팅  │
│ (col-span-8)     │ Member  │
│                  │ (col-4) │
├─────────┬────────┴─────────┤
│ Sprint  │ Recent Chat      │
│ Pulse   │                  │
│ (col-4) │ (col-4)          │
├─────────┴──────────────────┤
│ Key Resources (col-4)      │
│ (기존 ResourceModal FAB)   │
└────────────────────────────┘
```

### 데이터 전달

```tsx
<SprintPulseWidget pid={pid} />
<RecentChatWidget projectId={project._id} pid={pid} />
```

두 위젯 모두 자체적으로 API 호출하므로 page.tsx에서 추가 데이터 로딩 불필요.

---

## 4. 작업 순서

```
Step 1: SprintPulseWidget 컴포넌트 개발 + 테스트
Step 2: RecentChatWidget 컴포넌트 개발 + 테스트
Step 3: dashboard/[pid]/page.tsx 그리드 통합
Step 4: 사용자 확인
```

---

## 5. 디자인 스타일

두 위젯 모두 기존 ProjectOverview/MemberWidget과 동일한 카드 스타일:

```
bg-surface-container-lowest rounded-xl
shadow-[0_2px_8px_rgba(26,28,28,0.04)]
p-6 md:p-8
```

진행률 바:
- 할 일: `bg-primary-container`
- 진행 중: `bg-amber-400`
- 완료: `bg-emerald-400`
- 트랙: `bg-surface-container-low h-1.5 rounded-full`

---

## 6. 의존성

- Phase 5 대시보드 디자인 교체 ✅ (선행 완료)
- 칸반 boards/notes API ✅ (Phase 3.5에서 구현 완료)
- 채팅 rooms/messages API ✅ (기존 구현 완료)
- **API 신규 개발 없음** — 기존 API 읽기 전용 사용
