'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import ChatRoomList, { MockChatRoom } from '@/components/chat/ChatRoomList';
import ChatWindow from '@/components/chat/ChatWindow';
import { getSocket } from '@/lib/socket';

// useSearchParams()를 사용하는 실제 페이지 컨텐츠 컴포넌트
// Next.js 규칙: useSearchParams()는 반드시 Suspense 경계 안에서만 사용 가능!
function ChatPageContent() {
    // 현재 선택된 채팅방 ID 상태
    const [activeRoomId, setActiveRoomId] = useState<string>('');

    // 📋 Step 9.2: 실제 DB에서 불러온 채팅방 목록을 저장하는 상태야.
    // 이전의 MOCK_ROOMS 하드코딩을 완전히 대체함!
    const [rooms, setRooms] = useState<MockChatRoom[]>([]);
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
                // API에서 온 데이터를 MockChatRoom 인터페이스 구조에 맞게 변환!
                // title → 상대방 닉네임(DM) 또는 방 metadata.name 활용
                const mapped: MockChatRoom[] = data.map((room: any) => ({
                    _id: room._id,
                    category: room.category,
                    title: room.metadata?.name || room.category,
                    lastMessage: room.lastMessage || '',
                    updatedAt: room.updatedAt,
                }));
                setRooms(mapped);
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

    // Step 9.5: 실시간 채팅방 목록 동기화
    // receive_message 소켓 이벤트를 받으면 lastMessage와 updatedAt을 실시간으로 갱신!
    useEffect(() => {
        const socket = getSocket();

        const handleReceiveMessage = (message: any) => {
            setRooms(prev => {
                const updated = prev.map(room => {
                    if (room._id === message.roomId) {
                        // 해당 방의 마지막 메시지 및 시간 갱신
                        return { ...room, lastMessage: message.content, updatedAt: message.createdAt };
                    }
                    return room;
                });
                // 갱신된 방을 목록 최상단으로 이동 (최신 메시지 기준 정렬)
                return [...updated].sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            });
        };

        // Step 9.5: 새 채팅방이 생성되면 목록에 즉시 추가 (상대방이 DM을 시작했을 때!)
        const handleNewRoom = (newRoom: any) => {
            setRooms(prev => {
                const exists = prev.some(r => r._id === newRoom._id);
                if (exists) return prev;
                const mapped: MockChatRoom = {
                    _id: newRoom._id,
                    category: newRoom.category,
                    title: newRoom.metadata?.name || newRoom.category,
                    lastMessage: newRoom.lastMessage || '',
                    updatedAt: newRoom.updatedAt,
                };
                return [mapped, ...prev];
            });
        };

        socket.on('receive_message', handleReceiveMessage);
        socket.on('new-room', handleNewRoom);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
            socket.off('new-room', handleNewRoom);
        };
    }, []);

    const handleRoomClick = (id: string) => {
        setActiveRoomId(id);
        // 모바일에서 채팅방 클릭 시 목록을 숨기고 채팅창만 보여줌
        setShowListOnMobile(false);
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
        <div className="flex h-[calc(100vh-64px)] bg-slate-100 overflow-hidden">
            {/* 좌측 사이드바: 채팅방 리스트 영역
                - PC(md 이상): 항상 표시 (block)
                - 모바일: showListOnMobile 상태에 따라 표시/숨김 */}
            <div className={`
                w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10
                ${showListOnMobile ? 'flex' : 'hidden'} md:flex
            `}>
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">메시지</h2>
                </div>

                {/* Step 9.2: 로딩 상태 처리 */}
                {isLoadingRooms ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-2">
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                        <p className="text-xs">채팅방 목록 불러오는 중...</p>
                    </div>
                ) : (
                    <ChatRoomList
                        rooms={rooms}
                        activeRoomId={activeRoomId}
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
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50">
                        <div className="text-center text-slate-400">
                            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            <p className="text-lg font-medium text-slate-600 mb-1">선택된 대화가 없습니다.</p>
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
                <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
