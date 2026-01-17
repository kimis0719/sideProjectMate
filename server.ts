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

    // 리소스 잠금 관리 (Memory Store)
    // key: "type:id" (예: "note:123", "section:456") -> socketId
    const resourceLocks = new Map<string, string>();

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

        // 8. 잠금 요청 (Generic)
        socket.on('request-lock', (data) => {
            const { boardId, id, type, userId } = data; // type: 'note' | 'section'
            const key = `${type}:${id}`;

            const currentLock = resourceLocks.get(key);

            if (!currentLock || currentLock === socket.id) {
                resourceLocks.set(key, socket.id);
                // Broadcast lock event
                const eventName = type === 'note' ? 'note-locked' : 'section-locked';
                io.in(boardId).emit(eventName, { id, userId, socketId: socket.id });
            } else {
                socket.emit('lock-failed', { id, type });
            }
        });

        // 9. 잠금 해제 (Generic)
        socket.on('release-lock', (data) => {
            const { boardId, id, type } = data;
            const key = `${type}:${id}`;
            const currentLock = resourceLocks.get(key);

            if (currentLock === socket.id) {
                resourceLocks.delete(key);
                const eventName = type === 'note' ? 'note-unlocked' : 'section-unlocked';
                io.in(boardId).emit(eventName, { id });
            }
        });

        // 10. 보드 전체 동기화 (Undo/Redo 시)
        socket.on('sync-board', (data) => {
            const { boardId, notes, sections } = data;
            // 나를 제외한 다른 사람들에게 전파
            socket.to(boardId).emit('board-synced', { notes, sections });
        });

        // 11. 노트 선택 (실시간 표시)
        socket.on('select-note', (data) => {
            const { boardId, noteIds, userId, color } = data;
            // 보드 내의 다른 사용자들에게 선택 상태 전달 (socket.id 포함)
            socket.to(boardId).emit('note-selected', { noteIds, userId, color, socketId: socket.id });
        });

        // 12. 노트 선택 해제
        socket.on('deselect-note', (data) => {
            const { boardId, userId } = data;
            socket.to(boardId).emit('note-deselected', { userId, socketId: socket.id });
        });

        // 13. 실시간 알림 전송
        socket.on('send-notification', (data) => {
            const { targetUserId, ...rest } = data;
            // 전체 사용자 중 대상 유저에게만 전송 (서버 전체 브로드캐스트 후 클라이언트 필터링 혹은 룸 활용 가능)
            // 여기서는 간단히 전체에 보내고 클라이언트가 본인 것인지 판단하게 함
            io.emit('notification-received', { targetUserId, ...rest });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            // 이 소켓이 잠근 모든 리소스 해제
            resourceLocks.forEach((socketId, key) => {
                if (socketId === socket.id) {
                    resourceLocks.delete(key);
                    const [type, id] = key.split(':');
                    const eventName = type === 'note' ? 'note-unlocked' : 'section-unlocked';
                    io.emit(eventName, { id });
                }
            });
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
