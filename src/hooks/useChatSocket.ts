import { useEffect, useState, useCallback } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

export const useChatSocket = (roomId?: string) => {
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
        if (roomId) {
            // 임시로 userId를 넘겨주는 로직 (추후 session 객체 등에서 가져와 실제 ID 연동 필요)
            // 현재 단계에선 단순히 소켓 서버에 '나 들어왔다'고 알림
            const tempUserId = sessionStorage.getItem('spm_mock_userId') || '65f0a1b2c3d4e5f6a1b2c3d9';
            socketInstance.emit('join-chat-room', { roomId, userId: tempUserId });

            // 📢 [Step 7.2] 방에 들어왔으니 "나 여기 있는 메시지 다 읽었음!" 신호 전송
            socketInstance.emit('mark-messages-read', { roomId, userId: tempUserId });
        }

        // 4. 클린업 (컴포넌트 언마운트 시)
        return () => {
            if (roomId) {
                const tempUserId = sessionStorage.getItem('spm_mock_userId') || '65f0a1b2c3d4e5f6a1b2c3d9';
                socketInstance.emit('leave-chat-room', { roomId, userId: tempUserId });
            }

            socketInstance.off('connect', onConnect);
            socketInstance.off('disconnect', onDisconnect);

            // 다른 곳(헤더나 보드 등)에서 소켓을 쓰고 있을 수 있으므로 
            // 컴포넌트 언마운트 시 무조건 disconnectSocket()을 호출하면 안됨.
            // 필요하다면 전역 소켓 관리 로직을 더 정교하게 다듬어야 함.
        };
    }, [roomId]);

    // 외부 컴포넌트에서 이벤트를 구독하거나 해제할 수 있는 헬퍼 함수
    const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
        if (!socket) return;
        socket.on(event, callback);
        return () => {
            socket.off(event, callback);
        };
    }, [socket]);

    const emit = useCallback((event: string, data: any) => {
        if (!socket) return;
        socket.emit(event, data);
    }, [socket]);

    return { socket, isConnected, subscribe, emit };
};
