import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        socket = io({
            path: '/api/socket/io',
            addTrailingSlash: false,
            transports: ['websocket', 'polling'], // 웹소켓 우선 시도
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket?.id);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

// 기존 코드 호환성 유지 (Important for Header.tsx, boardStore.ts)
export const socketClient = {
    connect: getSocket,
    disconnect: disconnectSocket,
    get socket() {
        return socket;
    }
};
