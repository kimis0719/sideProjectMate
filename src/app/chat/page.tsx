'use client';

import { useState } from 'react';
import ChatRoomList, { MockChatRoom } from '@/components/chat/ChatRoomList';
import ChatWindow from '@/components/chat/ChatWindow';

// 🧪 UI 테스트를 위한 가짜(Mock) 데이터 셋이야. (MongoDB ObjectId 형식으로 변경!)
const MOCK_ROOMS: MockChatRoom[] = [
    { _id: '65f0a1b2c3d4e5f6a1b2c3d1', category: 'INQUIRY', title: '사이드프로젝트 관련 문의사항 남깁니다.', lastMessage: '안녕하세요, 혹시 포트폴리오 필수인가요?', updatedAt: new Date().toISOString() },
    { _id: '65f0a1b2c3d4e5f6a1b2c3d2', category: 'RECRUIT', title: '프론트엔드 지원자 프론찌님 인터뷰', lastMessage: '네, 내일 오후 3시 좋을 것 같습니다!', updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { _id: '65f0a1b2c3d4e5f6a1b2c3d3', category: 'TEAM', title: '🔥 [SPM] 어벤져스 팀 공식 채팅방', lastMessage: '회의록 노션에 정리해서 올렸습니다~ 확인 부탁드려요!', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { _id: '65f0a1b2c3d4e5f6a1b2c3d4', category: 'DM', title: '프론찌 (프론트엔드)', lastMessage: '다음에 또 같이 프로젝트 하면 좋겠네요 ㅎㅎ', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { _id: '65f0a1b2c3d4e5f6a1b2c3d5', category: 'SYSTEM', title: '가이드 봇', lastMessage: '환영합니다! 프로젝트 설정을 완료해 보세요.', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

export default function ChatPage() {
    // 현재 선택된 채팅방의 상태 관리를 위한 훅이야.
    const [activeRoomId, setActiveRoomId] = useState<string>(MOCK_ROOMS[0]._id);

    // 📱 [모바일 반응형] 채팅방 목록을 보여줄지 여부를 관리하는 상태야.
    // PC에서는 항상 목록과 창을 함께 보여주고,
    // 모바일에서는 목록 또는 창 중 하나만 보여주는 방식으로 동작해!
    const [showListOnMobile, setShowListOnMobile] = useState<boolean>(true);

    const handleRoomClick = (id: string) => {
        setActiveRoomId(id);
        // 모바일에서 채팅방 클릭 시 목록을 숨기고 채팅창만 보여줌
        setShowListOnMobile(false);
    };

    const handleBackToList = () => {
        // 뒤로가기 버튼 클릭 시 목록을 다시 보여줌
        setShowListOnMobile(true);
    };

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
                <ChatRoomList
                    rooms={MOCK_ROOMS}
                    activeRoomId={activeRoomId}
                    onRoomClick={handleRoomClick}
                />
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
                {MOCK_ROOMS.find(r => r._id === activeRoomId) ? (
                    <ChatWindow
                        room={MOCK_ROOMS.find(r => r._id === activeRoomId)!}
                        onBack={handleBackToList}
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
