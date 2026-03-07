'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatWindow from '@/components/chat/ChatWindow';
import { getSocket } from '@/lib/socket';
import { IChatRoomClient } from '@/types/chat';

// useSearchParams()를 사용하는 실제 페이지 컨텐츠 컴포넌트
// Next.js 규칙: useSearchParams()는 반드시 Suspense 경계 안에서만 사용 가능!
function ChatPageContent() {
    // 현재 선택된 채팅방 ID 상태
    const [activeRoomId, setActiveRoomId] = useState<string>('');
    // message-received 핸들러 내 stale closure 방지용 ref (useEffect deps 없이 최신값 참조)
    const activeRoomIdRef = useRef<string>('');

    // 📋 Step 9.2: 실제 DB에서 불러온 채팅방 목록을 저장하는 상태야.
    const [rooms, setRooms] = useState<IChatRoomClient[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);

    // 📱 [모바일 반응형] 채팅방 목록을 보여줄지 여부를 관리하는 상태야.
    // PC에서는 항상 목록과 창을 함께 보여주고,
    // 모바일에서는 목록 또는 창 중 하나만 보여주는 방식으로 동작해!
    const [showListOnMobile, setShowListOnMobile] = useState<boolean>(true);

    const { data: session } = useSession();
    const searchParams = useSearchParams();

    // Step 9.2: 서버에서 내가 참여 중인 채팅방 목록을 가져오는 함수
    const fetchRooms = useCallback(async () => {
        try {
            const res = await fetch('/api/chat/rooms');
            const { success, data } = await res.json();
            if (success && data) {
                setRooms(data as IChatRoomClient[]);
            }
        } catch {
            // 목록 로드 실패 시 빈 목록 유지
        } finally {
            setIsLoadingRooms(false);
        }
    }, []);

    // 최초 마운트 시 채팅방 목록 로드
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Step 9.3: URL 쿼리로 특정 방이 지정된 경우 해당 방을 자동으로 활성화
    // (DM 보내기 버튼에서 /chat?roomId=xxx 형태로 이동할 때 사용)
    useEffect(() => {
        const roomId = searchParams.get('roomId');
        if (roomId) {
            setActiveRoomId(roomId);
            setShowListOnMobile(false);
        }
    }, [searchParams]);

    // activeRoomId 변경 시 ref도 동기화 (소켓 핸들러 stale closure 방지)
    useEffect(() => {
        activeRoomIdRef.current = activeRoomId;
    }, [activeRoomId]);

    // Step 9.5: 실시간 채팅방 목록 동기화
    useEffect(() => {
        const socket = getSocket();
        // 개인 소켓 Room 입장 보장 — message-received 수신을 위해 반드시 필요!
        // (Header도 join-user-room을 emit하지만, 타이밍 의존 없이 여기서도 emit)
        if (session?.user?._id) {
            socket.emit('join-user-room', { userId: session.user._id });
        }

        // receive_message: 소켓이 join한 방(활성 채팅방)에서만 수신됨
        // → lastMessage/updatedAt 갱신만. unreadCount는 올리지 않음 (보고 있는 방이므로)
        const handleReceiveMessage = (message: any) => {
            setRooms(prev => {
                const updated = prev.map(room => {
                    if (room._id === message.roomId) {
                        return { ...room, lastMessage: message.content, updatedAt: message.createdAt };
                    }
                    return room;
                });
                return [...updated].sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            });
        };

        // Step 7: message-received: 개인 소켓 Room(user-{id})으로 수신
        // 발신자 포함 전체 참여자가 받음 (io.to 사용) → 모든 방의 lastMessage 갱신 커버
        const handleMessageReceived = (message: any) => {
            const isActive = message.roomId === activeRoomIdRef.current;
            const isSender = message.sender === session?.user?._id;
            setRooms(prev => {
                const updated = prev.map(room => {
                    if (room._id === message.roomId) {
                        return {
                            ...room,
                            lastMessage: message.content,
                            updatedAt: message.createdAt,
                            // 보고 있는 방이거나 내가 보낸 메시지면 unread 증가 안 함
                            myUnreadCount: (isActive || isSender)
                                ? room.myUnreadCount
                                : (room.myUnreadCount ?? 0) + 1,
                        };
                    }
                    return room;
                });
                return [...updated].sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            });
        };

        // Step 9.5: 새 채팅방이 생성되면 목록에 즉시 추가 (상대방이 DM을 시작했을 때!)
        const handleNewRoom = (newRoom: IChatRoomClient) => {
            setRooms(prev => {
                const exists = prev.some(r => r._id === newRoom._id);
                if (exists) return prev;
                return [newRoom, ...prev];
            });
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('message-received', handleMessageReceived);
        socket.on('new-room', handleNewRoom);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('message-received', handleMessageReceived);
            socket.off('new-room', handleNewRoom);
        };
    }, [session?.user?._id]);

    const handleRoomClick = (id: string) => {
        setActiveRoomId(id);
        // 모바일에서 채팅방 클릭 시 목록을 숨기고 채팅창만 보여줌
        setShowListOnMobile(false);
        // 클릭한 방의 읽지 않은 메시지 카운트 즉시 초기화
        setRooms(prev => prev.map(r => r._id === id ? { ...r, myUnreadCount: 0 } : r));
    };

    const handleBackToList = () => {
        // 뒤로가기 버튼 클릭 시 목록을 다시 보여줌
        setShowListOnMobile(true);
    };

    // 🚪 Step 9.4: 채팅방 나가기 완료 핸들러
    // ChatWindow에서 나가기 API 호출 성공 후 이 함수가 호출됨
    const handleLeaveRoom = (roomId: string) => {
        // 목록에서 해당 방 즉시 제거
        setRooms(prev => prev.filter(r => r._id !== roomId));
        // 나간 방이 현재 활성화된 방이면 선택 초기화
        if (activeRoomId === roomId) {
            setActiveRoomId('');
            setShowListOnMobile(true); // 모바일에선 목록으로 돌아가기
        }
    };

    const activeRoom = rooms.find(r => r._id === activeRoomId);

    return (
        <div className="flex h-[calc(100vh-64px)] bg-muted overflow-hidden">
            {/* 좌측 사이드바: 채팅방 리스트 영역
                - PC(md 이상): 항상 표시 (block)
                - 모바일: showListOnMobile 상태에 따라 표시/숨김 */}
            <div className={`
                w-full md:w-80 bg-background border-r border-border flex flex-col shadow-sm z-10 min-h-0 overflow-hidden
                ${showListOnMobile ? 'flex' : 'hidden'} md:flex
            `}>
                <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">메시지</h2>
                </div>

                {/* Step 9.2: 로딩 상태 처리 */}
                {isLoadingRooms ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2">
                        <div className="w-5 h-5 border-2 border-border border-t-muted-foreground rounded-full animate-spin" />
                        <p className="text-xs">채팅방 목록 불러오는 중...</p>
                    </div>
                ) : (
                    <ChatRoomList
                        rooms={rooms}
                        activeRoomId={activeRoomId}
                        currentUserId={session?.user?._id || ''}
                        onRoomClick={handleRoomClick}
                    />
                )}
            </div>

            {/* 우측 메인: 채팅 대화창 영역
                - PC(md 이상): 항상 표시
                - 모바일: showListOnMobile이 false일 때만 표시 (목록 숨길 때 나타남)
                - ⚠️ min-h-0: flex 자식이 부모 높이를 넘지 않도록 강제! 이게 없으면 내부 스크롤이 깨짐 */}
            <div className={`
                flex-1 min-h-0 overflow-hidden
                ${!showListOnMobile ? 'flex' : 'hidden'} md:flex
                flex-col
            `}>
                {activeRoom ? (
                    <ChatWindow
                        room={activeRoom}
                        onBack={handleBackToList}
                        onLeaveRoom={handleLeaveRoom}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-muted/50">
                        <div className="text-center text-muted-foreground">
                            <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p className="text-lg font-medium text-muted-foreground mb-1">선택된 대화가 없습니다.</p>
                            <p className="text-sm">왼쪽에서 채팅방을 선택해 주세요.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 🔧 Next.js 빌드 오류 수정: useSearchParams()는 <Suspense>로 감싸야 정적 빌드 시 오류가 나지 않아!
// Suspense가 없으면 서버 사이드 렌더링 단계에서 해당 훅을 처리 못해서 빌드가 터짐.
export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                <div className="w-6 h-6 border-2 border-border border-t-muted-foreground rounded-full animate-spin" />
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
