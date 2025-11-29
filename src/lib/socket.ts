import { io, Socket } from 'socket.io-client';

class SocketClient {
    private static instance: SocketClient;
    public socket: Socket | null = null;

    private constructor() { }

    public static getInstance(): SocketClient {
        if (!SocketClient.instance) {
            SocketClient.instance = new SocketClient();
        }
        return SocketClient.instance;
    }

    public connect(): Socket {
        if (this.socket) {
            return this.socket;
        }

        // 서버 경로와 일치해야 함 (/api/socket/io)
        this.socket = io({
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return this.socket;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketClient = SocketClient.getInstance();
