# Phase 6.5 — 글로벌 채팅 위젯 + 채팅 UX 개선 기획서

> 이슈: 미생성 (Phase 6 완료 후 별도 이슈)
> 작성일: 2026-04-07
> 상위 문서: `docs/plans/UIUX_DEVELOPMENT_SPEC.md`
> 선행 조건: Phase 6 완료

---

## 1. 배경 및 목적

SPM은 프로젝트 협업 도구이므로, **다른 화면(칸반, 대시보드)에서 페이지 이동 없이 빠르게 채팅**할 수 있어야 한다.
현재는 `/chat` 풀페이지로만 채팅이 가능하여 작업 컨텍스트가 끊기는 문제가 있다.

**목표:**
- 글로벌 헤더의 채팅 아이콘을 통해 **모든 페이지에서 접근 가능한 채팅 위젯** 제공
- 위젯에서 간단한 메시지 주고받기 지원
- 필요 시 풀페이지 채팅으로 확장, 선택한 채팅룸 이어서 사용

**확정 사항:**
- 풀페이지 채팅(`/chat`)에서는 **글로벌 푸터를 숨긴다** (Phase 6에서 적용 완료). 채팅은 풀 하이트로 화면을 채워야 하며, 푸터가 있으면 브라우저 스크롤과 채팅 내부 스크롤이 이중으로 발생하는 UX 문제가 있음.

---

## 2. 위젯 동작 플로우

### 2-1. 진입

```
[글로벌 헤더] → 💬 채팅 아이콘 클릭 → 위젯 드롭다운 열림 (위→아래 애니메이션)
```

- 현재: 아이콘 클릭 시 `router.push('/chat')` → **변경: 위젯 토글**
- 위젯 바깥 클릭 시 자동 닫힘
- ESC 키로 닫힘

### 2-2. 상태 1 — 룸 리스트 (위젯 기본 화면)

```
┌───────────────────────────┐
│ 메시지                [↗] │  ← [↗] 클릭 → /chat (풀페이지 기본 화면)
│───────────────────────────│
│ 🔍 채팅방, 참여자 검색... │
│───────────────────────────│
│ 🟢 Designer Kim    14:20 │  ← 클릭 → 상태 2 전환
│    Final assets...        │
│ 🔵 PM Lee       (2) 11:30│
│    언제 시간 되시나요?     │
│ 🟡 FE-Dev Group  Yesterday│
│    PR approved...         │
│                           │
│   (스크롤 가능)            │
└───────────────────────────┘
        max-w-[380px]
        max-h-[480px]
```

**기능:**
- 채팅룸 리스트 표시 (기존 ChatRoomList 데이터 재사용)
- 마지막 메시지, 시간, 읽지않은 뱃지 표시
- 카테고리별 아바타 컬러 (기존 패턴)
- 검색 (채팅방 이름 + 참여자 닉네임)
- 카테고리 필터 칩은 **생략** (공간 제약)

### 2-3. 상태 2 — 미니 채팅 (룸 선택 시)

```
┌───────────────────────────┐
│ ← Designer Kim       [↗] │  ← [↗] → /chat?roomId=xxx (이어서 채팅)
│───────────────────────────│
│                           │
│  ○ 안녕하세요!       14:10│
│         네, 확인했습니다 ● │ 14:15
│  ○ 감사합니다!       14:20│
│                           │
│  (스크롤로 과거 메시지)    │
│                           │
│───────────────────────────│
│ [메시지 입력...]    [전송] │
└───────────────────────────┘
        max-w-[380px]
        max-h-[560px]  ← 위아래 확장
```

**기능:**
- `← 뒤로` 버튼 → 상태 1(룸 리스트)로 복귀
- 메시지 목록 (최근 메시지 로드, 위로 스크롤 시 과거 메시지 추가 로드)
- 메시지 입력 + 전송 (Socket.io 실시간)
- 새 메시지 수신 시 자동 스크롤
- 상대방 메시지 좌측 / 내 메시지 우측 정렬
- 읽음 처리 (mark-messages-read)
- `[↗]` 확장 버튼 → `/chat?roomId=선택한룸ID`로 이동

**없는 기능 (풀페이지에서만 지원):**
- 메시지 검색
- 참가자 목록
- 메뉴 (나가기 등)
- 파일 첨부

### 2-4. 확장 → 풀페이지 전환

| 위젯 상태 | 확장 클릭 시 이동 | 동작 |
|-----------|------------------|------|
| 룸 리스트 (채팅룸 미선택) | `/chat` | 풀페이지 기본 화면 |
| 미니 채팅 (채팅룸 선택 중) | `/chat?roomId=xxx` | 해당 룸에서 이어서 채팅 |

---

## 3. 대상 파일 및 신규 파일

### 3-1. 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Header.tsx` | 채팅 아이콘 클릭 → 위젯 토글로 변경, 위젯 컴포넌트 마운트 |

### 3-2. 신규 파일

| 파일 | 용도 |
|------|------|
| `src/components/chat/ChatWidget.tsx` | 위젯 컨테이너 (드롭다운 + 상태 관리) |
| `src/components/chat/ChatWidgetRoomList.tsx` | 위젯용 룸 리스트 (ChatRoomList 경량 버전) |
| `src/components/chat/ChatWidgetWindow.tsx` | 위젯용 미니 채팅 (ChatWindow 경량 버전) |
| `src/store/chatWidgetStore.ts` | 위젯 전역 상태 (열림/닫힘, 선택 룸ID) |

### 3-3. 재사용 파일 (변경 없음)

| 파일 | 재사용 내용 |
|------|-----------|
| `src/hooks/useChatSocket.ts` | Socket.io 연결 (기존 훅 그대로) |
| `src/lib/utils/chat/chatUtils.ts` | `getRoomDisplayName` 등 유틸 |
| `src/types/chat.ts` | `IChatRoomClient`, `IChatMessageClient` 타입 |
| `src/constants/chat.ts` | `getCategoryColor` 등 상수 |

---

## 4. 기술 설계

### 4-1. chatWidgetStore (Zustand)

```ts
interface ChatWidgetState {
  isOpen: boolean;           // 위젯 드롭다운 열림 여부
  activeRoomId: string | null; // 선택된 채팅룸 (null = 룸 리스트)
  toggle: () => void;
  close: () => void;
  openRoom: (roomId: string) => void;
  backToList: () => void;
}
```

### 4-2. Socket.io 연동 전략

- **위젯이 닫혀있을 때**: 헤더에서 `message-received` 이벤트 수신 → 뱃지 카운터 증가 (기존 동작 유지)
- **위젯이 열려있을 때 (룸 리스트)**: 룸 목록의 lastMessage/unread 실시간 갱신
- **미니 채팅 활성 시**: `useChatSocket` 훅으로 해당 룸 join → 메시지 실시간 수신/발신
- **풀페이지 `/chat` 진입 시**: 위젯 자동 닫힘 (중복 소켓 방지)

### 4-3. 위젯 ↔ 풀페이지 상태 공유

- `chatWidgetStore.activeRoomId`를 URL 쿼리로 전달: `/chat?roomId=xxx`
- 풀페이지 `chat/page.tsx`의 기존 `useSearchParams` 로직이 `roomId`를 읽어 해당 룸 자동 선택
- 이미 `chat/page.tsx`에 `roomId` 쿼리 파라미터 처리가 구현되어 있음 (확인 필요)

### 4-4. 드롭다운 위치 및 크기

```
위치: 헤더 채팅 아이콘 아래, 우측 정렬
      (알림 드롭다운과 동일한 패턴)

룸 리스트 상태:
  width: 380px
  max-height: 480px

미니 채팅 상태:
  width: 380px
  max-height: 560px (위아래 확장, transition-all)

모바일 (< 640px):
  width: 100vw
  height: calc(100vh - 64px)  ← 헤더 아래 풀스크린
  position: fixed
```

### 4-5. 애니메이션

```
열림: opacity 0→1, translateY -8→0 (200ms ease-out)
닫힘: opacity 1→0, translateY 0→-8 (150ms ease-in)
상태 전환 (리스트↔채팅): max-height 트랜지션 (300ms)
```

---

## 5. 디자인 스타일

기존 Phase 6 MD3 토큰 적용:

- 컨테이너: `bg-surface-container-lowest rounded-xl shadow-[0_20px_60px_rgba(26,28,28,0.12)]`
- 헤더: `bg-surface-container-low border-b border-outline-variant/10`
- 메시지 버블: Phase 6 Step 2에서 교체한 스타일 그대로
  - 내 메시지: `bg-primary-container text-white rounded-2xl rounded-tr-none`
  - 상대 메시지: `bg-surface-container-low rounded-2xl rounded-tl-none`
- 입력창: `bg-surface-container-low rounded-2xl`

---

## 6. 절대 건드리지 않을 것

| 파일 | 이유 |
|------|------|
| `useChatSocket.ts` | 기존 Socket.io 훅 그대로 재사용 |
| `ChatWindow.tsx` | 풀페이지 전용, 위젯과 코드 공유하지 않음 |
| `ChatRoomList.tsx` | 풀페이지 전용, 위젯용은 별도 경량 컴포넌트 |
| `chat/page.tsx` 내부 Socket 로직 | 풀페이지 채팅의 기존 동작 보존 |

---

## 7. 작업 순서

| Step | 작업 | 예상 |
|------|------|------|
| 1 | `chatWidgetStore.ts` 생성 | 0.5일 |
| 2 | `ChatWidget.tsx` 컨테이너 (드롭다운 + 열림/닫힘) | 0.5일 |
| 3 | `ChatWidgetRoomList.tsx` (룸 리스트 경량 버전) | 1일 |
| 4 | `ChatWidgetWindow.tsx` (미니 채팅 경량 버전) | 1~2일 |
| 5 | `Header.tsx` 연동 (아이콘 클릭 → 위젯 토글) | 0.5일 |
| 6 | `/chat` 페이지 진입 시 roomId 쿼리 파라미터 처리 확인/수정 | 0.5일 |
| 7 | 모바일 반응형 (풀스크린 오버레이) | 0.5일 |
| 8 | 통합 테스트 (Socket.io 실시간, 위젯↔풀페이지 전환) | 0.5일 |

**예상 총 소요: 5~6일**

---

## 8. 향후 확장 가능성

- 위젯 내 읽지않은 뱃지 숫자 표시 (현재는 빨간 점만)
- 위젯 내 타이핑 인디케이터
- 위젯 내 이미지/파일 첨부 미리보기
- 위젯 리사이즈 (드래그로 크기 조절)
- 위젯 위치 이동 (드래그로 화면 내 자유 배치)
- 여러 채팅방 동시 열기 (탭 형태)
