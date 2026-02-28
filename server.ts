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

    // ==========================================
    // 기존 로직: 리소스 잠금 관리 (Memory Store)
    // ==========================================
    // key: "type:id" (예: "note:123", "section:456") -> socketId
    const resourceLocks = new Map<string, string>();

    // ==========================================
    // 신규 로직: 온라인 유저 관리 (Side Project Mate)
    // ==========================================
    // socketId -> { userId, projectId }
    const onlineUsers = new Map<string, { userId: string, projectId: string }>();

    // ==========================================
    // 신규 로직: 칸반보드 접속자 관리 (Presence)
    // ==========================================
    // boardId -> Map<socketId, any(userInfo)>
    const boardUsers = new Map<string, Map<string, any>>();
    // socketId -> { boardId, user }
    const socketUserMap = new Map<string, { boardId: string, user: any }>();

    // Socket.io 이벤트 핸들링
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // ------------------------------------------------------------
        // [Part 1] 기존 보드/노트 협업 로직 (유지)
        // ------------------------------------------------------------

        // 1. 보드 접속 (Room Join)
        socket.on('join-board', (boardId: string) => {
            socket.join(boardId);
            console.log(`Socket ${socket.id} joined board: ${boardId}`);
        });

        // 1.5 보드 접속 실시간 유저 정보 동기화 (Presence)
        socket.on('user-activity', (data) => {
            const { boardId, user } = data;

            if (!boardUsers.has(boardId)) {
                boardUsers.set(boardId, new Map());
            }

            const roomUsers = boardUsers.get(boardId)!;
            roomUsers.set(socket.id, user);
            socketUserMap.set(socket.id, { boardId, user });

            // 중복된 사용자(다중 탭 접속 등)를 제외한 유저 목록 전송
            const uniqueUsers = Array.from(
                new Map(Array.from(roomUsers.values()).map(u => [u._id, u])).values()
            );

            io.in(boardId).emit('board-users-update', uniqueUsers);
        });

        // 1.6 보드 퇴장 (Leave)
        socket.on('leave-board', (data) => {
            const { boardId } = data;
            socket.leave(boardId);

            if (boardUsers.has(boardId)) {
                const roomUsers = boardUsers.get(boardId)!;
                roomUsers.delete(socket.id);

                const uniqueUsers = Array.from(
                    new Map(Array.from(roomUsers.values()).map(u => [u._id, u])).values()
                );
                io.in(boardId).emit('board-users-update', uniqueUsers);
            }
            socketUserMap.delete(socket.id);
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

        // 4-1. 노트 배치 삭제
        socket.on('delete-notes-batch', (data) => {
            const { boardId, noteIds } = data;
            socket.to(boardId).emit('notes-deleted-batch', noteIds);
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


        // ------------------------------------------------------------
        // [Part 2] Side Project Mate 신규 로직 (추가)
        // ------------------------------------------------------------

        // 1. 프로젝트 접속 (Room Join)
        socket.on('join-project', ({ projectId, userId }) => {
            socket.join(`project-${projectId}`);

            // 온라인 상태 등록
            onlineUsers.set(socket.id, { userId, projectId });

            console.log(`User ${userId} joined project: ${projectId}`);

            // 같은 프로젝트에 있는 다른 사람들에게 '나 들어왔어' 알림 (본인은 제외)
            socket.to(`project-${projectId}`).emit('member-online', { userId });
        });

        // 2. 리소스 변경 알림 (동기화)
        socket.on('resource-update', ({ projectId, action, resource }) => {
            // action: 'create' | 'update' | 'delete'
            socket.to(`project-${projectId}`).emit('resource-updated', { action, resource });
            console.log(`Resource updated in project ${projectId}: ${action}`);
        });

        // 3. 프로젝트 상태/개요 변경 알림
        socket.on('project-update', ({ projectId, type, data }) => {
            // type: 'status' | 'overview'
            socket.to(`project-${projectId}`).emit('project-updated', { type, data });
        });


        // [Part 3] 채팅 실시간 소켓 이벤트 핸들러

        // 채팅방 접속
        socket.on('join-chat-room', ({ roomId, userId }) => {
            const chatRoomKey = `chat-${roomId}`;
            socket.join(chatRoomKey);
        });

        // 채팅방 이탈
        socket.on('leave-chat-room', ({ roomId, userId }) => {
            const chatRoomKey = `chat-${roomId}`;
            socket.leave(chatRoomKey);
        });

        // 메시지 브로드캐스트 (낙관적 업데이트 사용 중이므로 발신자 제외)
        socket.on('send_message', (messageData) => {
            const { roomId } = messageData;
            const chatRoomKey = `chat-${roomId}`;
            socket.to(chatRoomKey).emit('receive_message', messageData);
        });

        // 읽음 처리 브로드캐스트
        socket.on('mark-messages-read', ({ roomId, userId }) => {
            const chatRoomKey = `chat-${roomId}`;
            socket.to(chatRoomKey).emit('messages-read-receipt', { roomId, readByUserId: userId });
        });

        // Step 9.5: 새 채팅방 생성 알림 브로드캐스트
        // POST /api/chat/rooms에서 방 생성 후 클라이언트가 이 이벤트를 발생시키면
        // 상대방의 개인 소켓 Room에 new-room 이벤트를 전송해서 목록을 실시간 갱신!
        socket.on('notify-new-room', ({ participantIds, room }) => {
            participantIds.forEach((participantId: string) => {
                socket.to(`user-${participantId}`).emit('new-room', room);
            });
        });

        // 개인 소켓 Room 입장 (로그인 후 user-{id} 방에 join해야 new-room 등 개인 이벤트를 받을 수 있어!)
        socket.on('join-user-room', ({ userId }) => {
            socket.join(`user-${userId}`);
        });

        socket.on('disconnect', () => {

            // 1. [기존] 이 소켓이 잠근 모든 리소스 해제
            resourceLocks.forEach((socketId, key) => {
                if (socketId === socket.id) {
                    resourceLocks.delete(key);
                    const [type, id] = key.split(':');
                    const eventName = type === 'note' ? 'note-unlocked' : 'section-unlocked';
                    io.emit(eventName, { id });
                }
            });

            // 2. [신규] 프로젝트 멤버 오프라인 처리
            const userInfo = onlineUsers.get(socket.id);
            if (userInfo) {
                const { userId, projectId } = userInfo;
                onlineUsers.delete(socket.id);

                // 퇴장 알림
                io.to(`project-${projectId}`).emit('member-offline', { userId });
            }

            // 3. [신규] 칸반보드 Presence 접속 해제 처리
            const boardUserInfo = socketUserMap.get(socket.id);
            if (boardUserInfo) {
                const { boardId } = boardUserInfo;
                if (boardUsers.has(boardId)) {
                    const roomUsers = boardUsers.get(boardId)!;
                    roomUsers.delete(socket.id);

                    const uniqueUsers = Array.from(
                        new Map(Array.from(roomUsers.values()).map(u => [u._id, u])).values()
                    );
                    io.in(boardId).emit('board-users-update', uniqueUsers);
                }
                socketUserMap.delete(socket.id);
            }
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
