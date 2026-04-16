# 채팅 API MAP

## Route 목록

| 파일                         | 메서드 | 기능                       |
| ---------------------------- | ------ | -------------------------- |
| `rooms/route.ts`             | GET    | 채팅룸 목록                |
| `rooms/route.ts`             | POST   | 채팅룸 생성                |
| `rooms/[roomId]/route.ts`    | GET    | 단일 채팅룸 조회           |
| `rooms/[roomId]/route.ts`    | DELETE | 채팅룸 삭제                |
| `messages/[roomId]/route.ts` | GET    | 메시지 목록 (페이지네이션) |
| `messages/[roomId]/route.ts` | POST   | 메시지 전송                |

## 실시간 처리

REST API는 초기 로딩용. 실시간 메시지는 **Socket.io** 사용.

- 소켓 경로: `/api/socket/io`
- 소켓 훅: `src/hooks/useChatSocket.ts`
- 소켓 싱글톤: `src/lib/socket.ts`

## 의존 모델

- `src/lib/models/ChatRoom.ts`
- `src/lib/models/ChatMessage.ts`

## 의존 컴포넌트

- `src/components/chat/ChatRoomList.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/chat/ChatWidget.tsx` (글로벌 위젯 컨테이너)
- `src/components/chat/ChatWidgetRoomList.tsx` (위젯용 경량 룸 리스트)
- `src/components/chat/ChatWidgetWindow.tsx` (위젯용 미니 채팅)

## 자동 생성 파일 목록

> 마지막 갱신: 2026-03-28

- `messages/[roomId]/route.ts`
- `messages/route.ts`
- `rooms/[roomId]/route.ts`
- `rooms/route.ts`
