import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

// 🔧 Step 9.1: userId를 외부에서 prop으로 받아서 sessionStorage 의존성 완전 제거
// 이전에는 useChatSocket 내부에서 sessionStorage를 직접 읽었으나,
// 이제 ChatWindow에서 실제 세션 userId를 받아서 주입하는 방식으로 변경했어!
interface UseChatSocketOptions {
  roomId?: string;
  userId?: string; // 실제 로그인 사용자 ID (ChatWindow에서 주입)
}

export const useChatSocket = ({ roomId, userId }: UseChatSocketOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. 소켓 인스턴스 가져오기 (없으면 새로 연결됨)
    const socketInstance = getSocket();
    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);

    // 2. 기본 연결 이벤트 리스너 세팅
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    // 3. 특정 방(roomId)이 주어지면 방에 입장 (Join Room)
    if (roomId && userId) {
      // 🔧 Step 9.1: 이제 sessionStorage 없이 실제 userId 주입!
      socketInstance.emit('join-chat-room', { roomId, userId });

      // 📢 [Step 7.2] 방에 들어왔으니 "나 여기 있는 메시지 다 읽었음!" 신호 전송
      socketInstance.emit('mark-messages-read', { roomId, userId });
    }

    // 4. 클린업 (컴포넌트 언마운트 시)
    return () => {
      if (roomId && userId) {
        socketInstance.emit('leave-chat-room', { roomId, userId });
      }

      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);

      // 다른 곳(헤더나 보드 등)에서 소켓을 쓰고 있을 수 있으므로
      // 컴포넌트 언마운트 시 무조건 disconnectSocket()을 호출하면 안됨.
      // 필요하다면 전역 소켓 관리 로직을 더 정교하게 다듬어야 함.
    };
  }, [roomId, userId]);

  // 외부 컴포넌트에서 이벤트를 구독하거나 해제할 수 있는 헬퍼 함수
  const subscribe = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (!socket) return;
      socket.on(event, callback);
      return () => {
        socket.off(event, callback);
      };
    },
    [socket]
  );

  const emit = useCallback(
    (event: string, data: any) => {
      if (!socket) return;
      socket.emit(event, data);
    },
    [socket]
  );

  return { socket, isConnected, subscribe, emit };
};
