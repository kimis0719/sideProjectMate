'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getCategoryColor } from '@/constants/chat';
import { IChatRoomClient, IChatMessageClient } from '@/types/chat';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useModalStore } from '@/store/modalStore';

interface ChatWindowProps {
    room: IChatRoomClient;
    onBack?: () => void;
    onLeaveRoom?: (roomId: string) => void;
}

/**
 * 💬 채팅 대화창 컴포넌트야.
 * Step 3.3 요구사항에 맞춰서 활성화된 채팅방 카테고리에 따라 상단(Header)의 테마를 변경하고 있어!
 */
export default function ChatWindow({ room, onBack, onLeaveRoom }: ChatWindowProps) {
    const categoryColor = getCategoryColor(room.category);
    const { openConfirm } = useModalStore();
    const router = useRouter();

    const { data: session } = useSession();
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        if (session?.user?._id) {
            setCurrentUserId(session.user._id);
        }
    }, [session]);

    // 🔌 Step 5.2 / Step 9.1: 해당 채팅방에 입장하면서 소켓 연결
    // userId를 직접 주입해서 실제 userId 사용!
    const { isConnected, emit, subscribe } = useChatSocket({ roomId: room._id, userId: currentUserId });

    // 💬 Step 6.2: 메시지 상태 및 입력 관리
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<IChatMessageClient[]>([]);

    // 📜 Step 8.1: 무한 스크롤(Pagination)을 위한 상태 관리
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasNextPage, setHasNextPage] = useState<boolean>(true);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    // 스크롤 유지를 위한 플래그 (과거 대화 로드 시엔 맨 아래로 튀지 않도록)
    const [isLoadMoreAction, setIsLoadMoreAction] = useState<boolean>(false);

    // ⬇️ Step 7.1: 자동 스크롤을 위한 Ref
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // 메시지 목록 맨 아래 sentinel div — scrollIntoView로 정확히 하단 노출
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // 🔧 버그 1 수정: "실제 새 메시지가 온 경우"에만 스크롤 내리도록 shouldAutoScroll Ref 추가
    const shouldAutoScroll = useRef<boolean>(false);

    // ⬇️ Step 7.1: messages state가 바뀌었을 때 스크롤 로직 실행
    useEffect(() => {
        if (shouldAutoScroll.current) {
            // sentinel div를 뷰포트 안으로 스크롤 (입력창 겹침 없이 정확하게!)
            messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
            shouldAutoScroll.current = false;
        }
        // isLoadMoreAction이 true일 때 (8.1 데이터 로드) 스크롤 유지도 이쪽에서 진행
        setIsLoadMoreAction(false);
    }, [messages]);

    // 🚪 Step 9.4: 채팅방 헤더 메뉴(점세개) 열기/닫기 상태
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // 👥 Step 8: 참여자 목록 패널 열기/닫기 상태
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

    // 🚪 Step 9.4: 채팅방 나가기 핸들러
    const handleLeaveRoom = async () => {
        setIsMenuOpen(false); // 메뉴 먼저 닫기
        // GlobalModal로 확인 다이얼로그 표시 (브라우저 기본 confirm 대신 커스텀 모달 사용!)
        const confirmed = await openConfirm(
            '채팅방 나가기',
            '이 채팅방을 나가시겠어요?\n나가면 목록에서 더 이상 보이지 않습니다.',
            { confirmText: '나가기', cancelText: '취소', isDestructive: true }
        );
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/chat/rooms/${room._id}`, { method: 'DELETE' });
            if (res.ok) {
                // 부모 컴포넌트에 나간 방 ID 알려서 목록에서 제거
                onLeaveRoom?.(room._id);
            }
        } catch {
            // 나가기 실패 시 조용히 실패 (재시도는 사용자가 다시 버튼을 누르면 됨)
        }
    };

    // 📡 Step 6.3: 대화 내역 불러오기 API 호출 함수 (초기 및 재연결 시 재사용)
    const fetchInitialMessages = async () => {
        if (!currentUserId) return; // ID가 세팅된 후 호출
        try {
            const res = await fetch(`/api/chat/messages/${room._id}?userId=${currentUserId}&limit=20`);
            const { success, data, pagination } = await res.json();
            if (success) {
                // 🔧 추가 버그 수정: 초기 로드 시에도 스크롤 맨 아래로!
                shouldAutoScroll.current = true;
                setMessages(data);
                if (pagination) {
                    setNextCursor(pagination.nextCursor);
                    setHasNextPage(pagination.hasNextPage);
                }
            }
        } catch (error) {
            // 메시지 로드 실패 시 UI는 빈 대화창을 보여줌 (재시도는 재마운트 시 자동 실행)
        }
    };

    // 최초 렌더링 시 대화 내역 로드
    useEffect(() => {
        fetchInitialMessages();
    }, [room._id, currentUserId]);

    // 🔧 버그 3 수정: 오프라인 중 전송못한 메시지를 쌓아두는 임시 큐
    const pendingMessages = useRef<Array<{ content: string }>>([]);

    // 인터넷이 다시 연결됐을 때 대기 메시지들을 순서대로 전송
    const flushPendingMessages = async () => {
        if (pendingMessages.current.length === 0 || !currentUserId) return;

        const queue = [...pendingMessages.current];
        pendingMessages.current = []; // 큐 초기화

        for (const pending of queue) {
            try {
                const res = await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId: room._id, content: pending.content, senderId: currentUserId }),
                });
                if (res.ok) {
                    const { data } = await res.json();
                    // 정상 저장된 메시지를 소켓으로 브로드캐스트
                    emit('send_message', data);
                }
            } catch (e) {
                // 여전히 불안정하면 다시 큐에 집어넣기
                pendingMessages.current.push(pending);
            }
        }
        // 메시지 재조회 (화면 최신화)
        fetchInitialMessages();
    };

    // 🔌 Step 8.2: 브라우저 내장 네트워크 감지 이벤트 사용 (소켓 유레벨 대신!)
    // Socket.io는 DevTools Offline 모드를 즉각 못 잡아냄
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof window !== 'undefined' ? navigator.onLine : true
    );
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // 다시 온라인! 누락 메시지 재조회 및 대기 메시지 순서 전송
            fetchInitialMessages();
            flushPendingMessages();
            emit('mark-messages-read', { roomId: room._id, userId: currentUserId });
        };
        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [room._id, currentUserId]);

    // 📜 Step 8.1: 무한 스크롤 - 스크롤 최상단 도달 시 과거 메시지 로드
    const loadMoreMessages = async () => {
        if (isLoadingMore || !hasNextPage || !nextCursor || !currentUserId) return;

        setIsLoadingMore(true);
        setIsLoadMoreAction(true); // 맨 아래로 튀는 현상 방지

        // API 찌르기 전에 현재 스크롤의 '높이'를 기억해둠 (나중에 스크롤 위치 유지할 때 씀)
        const container = scrollContainerRef.current;
        const previousScrollHeight = container ? container.scrollHeight : 0;

        try {
            const res = await fetch(`/api/chat/messages/${room._id}?userId=${currentUserId}&limit=20&cursor=${nextCursor}`);
            const { success, data, pagination } = await res.json();

            if (success) {
                // 기존 메시지 "앞에" 과거 메시지들을 쏙 붙여넣음!
                setMessages(prev => [...data, ...prev]);

                if (pagination) {
                    setNextCursor(pagination.nextCursor);
                    setHasNextPage(pagination.hasNextPage);
                }

                // 리렌더링 직후(DOM 업데이트 후) 스크롤 위치 보정
                // 과거 메시지가 위에 추가되면 스크롤바가 꼭대기에 그대로 있어버리므로,
                // 새로 늘어난 높이만큼 스크롤을 억지로 조금 내려서 "보고 있던 메시지" 위치를 유지시킴!
                setTimeout(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - previousScrollHeight;
                    }
                }, 0);
            }
        } catch (error) {
            // 과거 메시지 로드 실패 - 다음 스크롤 시 자동 재시도
        } finally {
            setIsLoadingMore(false);
        }
    };

    // 📜 Step 8.1: 스크롤 이벤트 핸들러
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        // 스크롤이 맨 위(0)에 도달하면 과거 메시지 로드 트리거 발동!
        if (scrollTop === 0) {
            loadMoreMessages();
        }
    };

    // 📡 Step 6.2: 새 메시지 수신 (receive_message) 리스너 등록
    useEffect(() => {
        const unsubscribeMsg = subscribe('receive_message', (incomingMessage) => {
            if (incomingMessage.roomId === room._id) {
                shouldAutoScroll.current = true; // 새 메시지를 받는 경우에만 스크롤 허용!
                setMessages((prev) => [...prev, incomingMessage]);

                // 📢 [Step 7.2] 방에 켜져 있는 상태에서 상대방 메시지가 오면 즉시 "읽었음" 처리!
                const isMine = incomingMessage.sender === currentUserId || incomingMessage.sender?._id === currentUserId;
                if (!isMine) {
                    emit('mark-messages-read', { roomId: room._id, userId: currentUserId });
                    fetch(`/api/chat/messages/${room._id}?userId=${currentUserId}`);
                }
            }
        });

        // 📢 [Step 7.2] 상대방이 내 메시지를 읽었다는 브로드캐스트를 받으면 UI 업데이트 (스크롤 안 내림!)
        const unsubscribeRead = subscribe('messages-read-receipt', ({ roomId, readByUserId }) => {
            if (roomId === room._id) {
                // shouldAutoScroll.current를 true로 만들지 않으면 스크롤 안 내려감!
                setMessages(prev => prev.map(msg => {
                    // sender가 populate된 객체일 수도, 순수 문자열 ID일 수도 있어서 타입 가드로 ID를 안전하게 추출!
                    const getSenderId = (sender: any): string =>
                        typeof sender === 'string' ? sender : sender?._id ?? '';
                    const isMine = getSenderId(msg.sender) === currentUserId;
                    if (isMine && msg.readBy && !msg.readBy.includes(readByUserId)) {
                        return { ...msg, readBy: [...msg.readBy, readByUserId] };
                    }
                    return msg;
                }));
            }
        });

        return () => {
            if (unsubscribeMsg) unsubscribeMsg();
            if (unsubscribeRead) unsubscribeRead();
        };
        // 🔑 currentUserId를 의존성 배열에 꼭 넣어야 해!
        // 없으면 클로저가 초기값('')을 캡처해버려서 isMine 판별이 영원히 false가 됨
    }, [subscribe, room._id, currentUserId]);

    // 🚀 Step 6.2: 메시지 전송 로직 (SEND_MESSAGE)
    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        const content = messageInput.trim();
        const temporaryId = Date.now().toString(); // 낙관적 업데이트용 임시 키

        const newMessage = {
            _id: temporaryId,
            roomId: room._id,
            sender: currentUserId,
            content,
            createdAt: new Date().toISOString(),
            type: 'TEXT'
        };

        // 1. 화면에 즉시 표시 (Optimistic UI - 낙관적 업데이트)
        // 새 메시지를 추가하기 전 auto-scroll 플래그 ON → 맨 아래로 내려감!
        shouldAutoScroll.current = true;
        setMessages((prev) => [...prev, newMessage]);

        // 2. 입력창 초기화
        setMessageInput('');

        // 🔧 버그 3 수정: isOnline 기준으로 오프라인이면 임시 큐에 저장하고 나중에 보냄
        if (!isOnline) {
            pendingMessages.current.push({ content });
            return; // 오프라인이면 API/소켓 시도 없이 리턴
        }

        try {
            // 3. DB에 진짜로 저장 (영속성 확보)
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: room._id, content, senderId: currentUserId }),
            });

            if (res.ok) {
                const { data } = await res.json();

                // 4. DB 저장이 성공하면 내가 보낸 원본 메시지 정보 업데이트
                setMessages(prev => prev.map(msg => msg._id === temporaryId ? data : msg));

                // 5. 서버에 브로드캐스트 요청 (Socket.io)
                // DB의 _id가 담긴 완전한 data를 날려보내야 상대방도 Key 충돌을 겪지 않음
                // participantIds 포함 → 서버가 헤더 뱃지용 message-received 이벤트를 개인 Room으로 전달
                emit('send_message', { ...data, participantIds: room.participants.map(p => p._id) });
            }
        } catch (error) {
            // 전송 실패 시 오프라인 큐에 보관 (재연결 시 자동 재전송)
            pendingMessages.current.push({ content });
        }
    };

    // 엔터키 입력 처리
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-background relative">
            {/*
              🌟 상단 헤더 영역 (Step 3.3 핵심 구현 부분)
              - top border 박스로 컬러 라인을 명확하게 줬어!
              - 배경색에도 살짝 투명도를 넣어서 대화방 성격을 은은하게 인지하도록 만들었지.
            */}
            <div
                className="flex items-center justify-between p-4 shadow-sm z-10 border-t-4 flex-shrink-0"
                style={{
                    borderTopColor: categoryColor,
                    // 배경에 아주 연하게(약 3% 불투명도) 카테고리 색상을 깔아서 분위기를 맞춤
                    backgroundColor: `color-mix(in srgb, ${categoryColor} 3%, var(--background))`
                }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {/* 📱 [Step 8.3] 모바일에서만 보이는 뒤로가기 버튼 (PC에서는 hidden) */}
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-white/20 transition-colors text-white"
                                title="목록으로"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        {/* 📛 헤더에도 배지를 배치해서 현재 어떤 성격의 대화인지 확실히 각인! */}
                        <span
                            className="text-xs font-bold px-2 py-0.5 rounded-md"
                            style={{
                                backgroundColor: categoryColor,
                                color: 'white' // 여긴 눈에 띄게 흰 글씨로!
                            }}
                        >
                            {room.category}
                        </span>
                        {/* STEP 3에서 getRoomDisplayName() 유틸로 교체 예정 */}
                        <h2 className="text-lg font-bold text-white">{room.projectName || room.metadata?.name || room.category}</h2>
                    </div>
                    {/* 👥 Step 8: 참여자 수 부제목 */}
                    <p className="text-xs text-white/60 pl-1">
                        {room.participants.length === 2 ? '1:1 채팅' : `그룹 채팅 (${room.participants.length}명)`}
                    </p>
                </div>

                {/* 우측 도구 모음 */}
                <div className="flex items-center gap-3 text-white/70">
                    <button className="hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>

                    {/* 👥 Step 8: 참여자 목록 버튼 */}
                    <div className="relative">
                        <button
                            onClick={() => setIsParticipantsOpen(prev => !prev)}
                            className="hover:text-white transition-colors"
                            title="참여자 목록"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        {isParticipantsOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsParticipantsOpen(false)} />
                                <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[200px]">
                                    <div className="px-4 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-muted-foreground">참여자 {room.participants.length}명</p>
                                    </div>
                                    <ul className="py-1">
                                        {room.participants.map(p => (
                                            <li key={p._id} className="flex items-center gap-2.5 px-4 py-2">
                                                {p.avatarUrl ? (
                                                    <img src={p.avatarUrl} className="w-7 h-7 rounded-full object-cover" alt={p.nName} />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                                                        {p.nName?.charAt(0)?.toUpperCase() ?? '?'}
                                                    </div>
                                                )}
                                                <span className="text-sm text-foreground">{p.nName ?? '알 수 없음'}</span>
                                                {p._id === currentUserId && (
                                                    <span className="text-xs text-muted-foreground ml-1">(나)</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 🚪 Step 9.4: 점세개 메뉴 버튼 (채팅방 나가기 옵션 포함) */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>

                        {/* 드롭다운 메뉴 */}
                        {isMenuOpen && (
                            <>
                                {/* 바깥 클릭 시 메뉴 닫기 */}
                                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                                    <button
                                        onClick={handleLeaveRoom}
                                        className="w-full px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 transition-colors font-medium"
                                    >
                                        채팅방 나가기
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 🔌 Step 8.2: 오프라인(연결 끊김) 경고 배너 - 브라우저 isOnline 기준으로 체크 */}
            {!isOnline && (
                <div className="bg-red-500 text-white text-xs font-bold text-center py-1.5 shadow-sm z-20">
                    인터넷 연결이 불안정하여 오프라인 모드로 전환되었습니다. 대기 중...
                </div>
            )}

            {/* 메인 채팅 내역 영역 (무한 스크롤[Step 8.1] 적용) */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 scroll-smooth dark:[color-scheme:dark]"
            >
                {/* 📜 Step 8.1: 무한스크롤 로딩 인디케이터 */}
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <span className="text-xs text-muted-foreground">이전 대화 불러오는 중...</span>
                    </div>
                )}

                {!hasNextPage && messages.length > 0 && (
                    <div className="flex justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            대화가 시작되었습니다.
                        </span>
                    </div>
                )}

                {/* 💬 저장/수신된 메시지 목록 맵핑 렌더링 */}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <p className="text-sm">아직 아무런 대화가 없어요!</p>
                        <p className="text-xs mt-1">첫 인사를 건네보세요 👋</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        // sender가 populate된 객체일 수도, 순수 문자열 ID일 수도 있어서 타입 가드로 ID를 안전하게 추출!
                        const getSenderId = (sender: any): string =>
                            typeof sender === 'string' ? sender : sender?._id ?? '';
                        const senderId = getSenderId(msg.sender);
                        const isMine = senderId === currentUserId;
                        // participants에서 발신자 정보 조회
                        const senderInfo = room.participants.find(p => p._id === senderId);
                        const senderName = senderInfo?.nName ?? (isMine ? '나' : '알 수 없음');
                        const senderAvatar = senderInfo?.avatarUrl;

                        return (
                            <div key={idx} className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                                {/* 프로필 아바타 */}
                                {senderAvatar ? (
                                    <img src={senderAvatar} className="w-8 h-8 rounded-full shrink-0 object-cover" alt={senderName} />
                                ) : (
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isMine ? 'bg-slate-700 text-white' : 'bg-muted text-foreground'}`}>
                                        {senderName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-muted-foreground mx-1">{senderName}</span>

                                    <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                        <div
                                            className={`p-3 rounded-2xl shadow-sm border max-w-md ${isMine
                                                ? 'bg-slate-800 text-white rounded-tr-sm border-slate-700'
                                                : 'bg-card text-card-foreground rounded-tl-sm border-border'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        </div>

                                        {/* 📢 [Step 7.2] 읽음 처리 인디케이터 렌더링 영역 */}
                                        <div className="flex flex-col items-center justify-end mb-1">
                                            {/* (임시 1:1 가정) 방 참가자는 2명. 나를 제외하고 아무도 안 읽었으면 배열 길이는 1 */}
                                            {isMine && (!msg.readBy || msg.readBy.length < 2) && (
                                                <span className="text-[10px] text-yellow-500 font-bold mb-0.5">1</span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground mx-1 min-w-fit" suppressHydrationWarning>
                                                {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {/* 스크롤 sentinel — 새 메시지 도착 시 이 div로 scrollIntoView */}
                <div ref={messagesEndRef} />
            </div>

            {/* 채팅 입력창 영역 */}
            <div className="p-4 bg-background border-t border-border flex-shrink-0">
                <div className="flex items-center gap-2 bg-muted border border-border rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-border transition-shadow">
                    <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-foreground px-2"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className={`p-1.5 rounded-full transition-colors flex shrink-0 items-center justify-center h-8 w-8 
                            ${messageInput.trim() ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-400'}`}
                    >
                        <svg className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
