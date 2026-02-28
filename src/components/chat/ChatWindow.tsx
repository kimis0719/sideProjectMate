'use client';

import { useState, useEffect, useRef } from 'react';
import { getCategoryColor } from '@/constants/chat';
import { MockChatRoom } from './ChatRoomList';
import { useChatSocket } from '@/hooks/useChatSocket';

interface ChatWindowProps {
    room: MockChatRoom;
}

/**
 * 💬 채팅 대화창 컴포넌트야.
 * Step 3.3 요구사항에 맞춰서 활성화된 채팅방 카테고리에 따라 상단(Header)의 테마를 변경하고 있어!
 */
export default function ChatWindow({ room }: ChatWindowProps) {
    const categoryColor = getCategoryColor(room.category);

    // 🔌 Step 5.2: 해당 채팅방에 입장하면서 소켓 연결하기
    const { isConnected, emit, subscribe } = useChatSocket(room._id);

    // 💬 Step 6.2: 메시지 상태 및 입력 관리
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<any[]>([]);

    // ⬇️ Step 7.1: 자동 스크롤을 위한 Ref
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ⬇️ Step 7.1: 메시지가 추가될 때마다 해당 컨테이너의 스크롤만 맨 아래로 이동
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // 🧪 테스트용 가짜 유저 ID 생성기 (브라우저 탭/창마다 다른 사람인 척 하기 위함)
    const [mockUserId, setMockUserId] = useState<string>('65f0a1b2c3d4e5f6a1b2c3d9');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            let stored = sessionStorage.getItem('spm_mock_userId');
            if (!stored) {
                // MongoDB ObjectId 규격인 24자리 16진수 랜덤 생성
                stored = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                sessionStorage.setItem('spm_mock_userId', stored);
            }
            setMockUserId(stored);
        }
    }, []);

    // 📡 Step 6.3: (초기) 대화 내역 불러오기 API 호출
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/chat/messages/${room._id}`);
                const { success, data } = await res.json();
                if (success) {
                    setMessages(data);
                }
            } catch (error) {
                console.error('Failed to load history:', error);
            }
        };
        fetchMessages();
    }, [room._id]);

    // 📡 Step 6.2: 새 메시지 수신 (receive_message) 리스너 등록
    useEffect(() => {
        const unsubscribeMsg = subscribe('receive_message', (incomingMessage) => {
            // 방 ID가 현재 활성화된 방과 일치할 때만 추가
            if (incomingMessage.roomId === room._id) {
                setMessages((prev) => [...prev, incomingMessage]);

                // 📢 [Step 7.2 추가] 방에 켜져 있는 상태에서 상대방 메시지가 오면 즉시 "읽었음" 처리!
                const isMine = incomingMessage.sender === mockUserId || incomingMessage.sender?._id === mockUserId;
                if (!isMine) {
                    // 1. 상대방 화면의 숫자 1을 지우기 위해 소켓 발송
                    emit('mark-messages-read', { roomId: room._id, userId: mockUserId });

                    // 2. DB에도 "이 메시지 내가 읽었어"라고 영구 반영하기 위해 백그라운드로 조회 API 찌르기
                    fetch(`/api/chat/messages/${room._id}?userId=${mockUserId}`);
                }
            }
        });

        // 📢 [Step 7.2] 상대방이 내 메시지를 읽었다는 브로드캐스트를 받으면 UI 업데이트
        const unsubscribeRead = subscribe('messages-read-receipt', ({ roomId, readByUserId }) => {
            if (roomId === room._id) {
                // 내 방에 띄워진 메시지 중 '나'가 보낸 메시지들의 readBy 배열에 상대방 ID를 쓱 추가해 줌
                setMessages(prev => prev.map(msg => {
                    // 내가 보낸 메시지고, 아직 상대방이 안 읽은 상태 (배열에 상대방 아이디가 없다면)
                    const isMine = msg.sender === mockUserId || msg.sender?._id === mockUserId;
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
    }, [subscribe, room._id]);

    // 🚀 Step 6.2: 메시지 전송 로직 (SEND_MESSAGE)
    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        const content = messageInput.trim();
        const temporaryId = Date.now().toString(); // 낙관적 업데이트용 임시 키

        const newMessage = {
            _id: temporaryId,
            roomId: room._id,
            // 💡 탭마다 다르게 생성된 임시 ID 부여
            sender: mockUserId,
            content,
            createdAt: new Date().toISOString(),
            type: 'TEXT'
        };

        // 1. 화면에 즉시 표시 (Optimistic UI - 낙관적 업데이트)
        setMessages((prev) => [...prev, newMessage]);

        // 2. 입력창 초기화
        setMessageInput('');

        try {
            // 3. DB에 진짜로 저장 (영속성 확보)
            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: room._id, content, senderId: mockUserId }),
            });

            if (res.ok) {
                const { data } = await res.json();

                // 4. DB 저장이 성공하면 내가 보낸 원본 메시지 정보 업데이트 
                setMessages(prev => prev.map(msg => msg._id === temporaryId ? data : msg));

                // 5. 서버에 브로드캐스트 요청 (Socket.io)
                // DB의 _id가 담긴 완전한 data를 날려보내야 상대방도 Key 충돌을 겪지 않음
                emit('send_message', data);
            } else {
                console.error('Failed to save message to DB');
                // 에러 처리: 모달이나 토스트 알림 등을 띄우거나, optimistic UI를 롤백해주는 로직 필요.
            }
        } catch (error) {
            console.error('Save error:', error);
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
        <div className="flex-1 flex flex-col bg-slate-50/50 relative">
            {/* 
              🌟 상단 헤더 영역 (Step 3.3 핵심 구현 부분)
              - top border 박스로 컬러 라인을 명확하게 줬어!
              - 배경색에도 살짝 투명도를 넣어서 대화방 성격을 은은하게 인지하도록 만들었지.
            */}
            <div
                className="flex items-center justify-between p-4 bg-white shadow-sm z-10 border-t-4"
                style={{
                    borderTopColor: categoryColor,
                    // 배경에 아주 연하게(약 3% 불투명도) 카테고리 색상을 깔아서 분위기를 맞춤
                    backgroundColor: `color-mix(in srgb, ${categoryColor} 3%, white)`
                }}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
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
                        <h2 className="text-lg font-bold text-slate-800">{room.title}</h2>
                    </div>
                </div>

                {/* 우측 도구 모음 (추후 구현 예정) */}
                <div className="flex items-center gap-3 text-slate-400">
                    <button className="hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </button>
                    <button className="hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {/* 디버깅용 실시간 연결 상태 표시기 (우측 상단 점) */}
                    <div
                        className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-400'}`}
                        title={isConnected ? '실시간 통신 연결됨' : '연결 끊김'}
                    />
                </div>
            </div>

            {/* 메인 채팅 내역 영역 (추후 무한 스크롤(Step 8.1) 및 DB 연동 적용) */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
            >
                <div className="flex justify-center my-4">
                    <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        대화가 시작되었습니다.
                    </span>
                </div>

                {/* 💬 저장/수신된 메시지 목록 맵핑 렌더링 */}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                        <p className="text-sm">아직 아무런 대화가 없어요!</p>
                        <p className="text-xs mt-1">첫 인사를 건네보세요 👋</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.sender === mockUserId || msg.sender?._id === mockUserId;

                        return (
                            <div key={idx} className={`flex items-start gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full shrink-0 ${isMine ? 'bg-blue-200' : 'bg-slate-200'}`} />
                                <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-slate-500 mx-1">{isMine ? '나' : '상대방'}</span>

                                    <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                        <div
                                            className={`p-3 rounded-2xl shadow-sm border max-w-md ${isMine
                                                ? 'bg-slate-800 text-white rounded-tr-sm border-slate-700'
                                                : 'bg-white text-slate-700 rounded-tl-sm border-slate-100'
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
                                            <span className="text-[10px] text-slate-400 mx-1 min-w-fit" suppressHydrationWarning>
                                                {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 채팅 입력창 영역 */}
            <div className="p-4 bg-white border-t border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-slate-300 transition-shadow">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-slate-700 px-2"
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
