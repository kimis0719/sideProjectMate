import express from 'express';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Next.js 앱 준비
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);

    // Socket.io 서버 설정
    const io = new Server(httpServer, {
        path: '/api/socket/io', // 클라이언트가 접속할 경로
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Socket.io 이벤트 핸들링
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // 1. 보드 접속 (Room Join)
        socket.on('join-board', (boardId: string) => {
            socket.join(boardId);
            console.log(`Socket ${socket.id} joined board: ${boardId}`);
        });

        // 2. 노트 업데이트 (이동, 수정)
        socket.on('update-note', (data) => {
            const { boardId, note } = data;
            // 나를 제외한 같은 방의 다른 사용자들에게 전파
            socket.to(boardId).emit('note-updated', note);
        });

        // 3. 노트 생성
        socket.on('create-note', (data) => {
            const { boardId, note } = data;
            socket.to(boardId).emit('note-created', note);
        });

        // 4. 노트 삭제
        socket.on('delete-note', (data) => {
            const { boardId, noteId } = data;
            socket.to(boardId).emit('note-deleted', noteId);
        });

        // 5. 섹션 업데이트
        socket.on('update-section', (data) => {
            const { boardId, section } = data;
            socket.to(boardId).emit('section-updated', section);
        });

        // 6. 섹션 생성
        socket.on('create-section', (data) => {
            const { boardId, section } = data;
            socket.to(boardId).emit('section-created', section);
        });

        // 7. 섹션 삭제
        socket.on('delete-section', (data) => {
            const { boardId, sectionId } = data;
            socket.to(boardId).emit('section-deleted', sectionId);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    // Next.js 요청 처리
    server.all(/.*/, (req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
