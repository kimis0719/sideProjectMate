'use client';

import { useState } from 'react';
import { getCategoryColor, ChatCategory } from '@/constants/chat';

// 💡 임시 인터페이스: 백엔드 API 연동 전에 UI를 작성하기 위한 Mock 데이터 타입이야.
export interface MockChatRoom {
    _id: string;
    category: ChatCategory;
    title: string;
    lastMessage?: string;
    updatedAt: string;
}

interface ChatRoomListProps {
    rooms: MockChatRoom[];
    activeRoomId?: string;
    onRoomClick: (roomId: string) => void;
}

/**
 * 🎨 채팅방 리스트를 보여주는 컴포넌트야.
 * Step 3.2: 각 아이템 왼쪽에 카테고리별 색상 인디케이터(세로 바) 추가
 * Step 4.1: 상단 필터 탭 기능을 추가해서 카테고리별로 대화방을 골라볼 수 있게 했어!
 */
export default function ChatRoomList({ rooms, activeRoomId, onRoomClick }: ChatRoomListProps) {
    // 💡 Step 4.1: 현재 선택된 탭 상태를 관리. 'ALL'이면 전체 보기!
    const [activeTab, setActiveTab] = useState<ChatCategory | 'ALL'>('ALL');

    // 💡 Step 4.1: 모든 탭 목록 정의 (전체 + 각 카테고리 영문/한글 매핑)
    const TABS: { id: ChatCategory | 'ALL'; label: string }[] = [
        { id: 'ALL', label: '전체' },
        { id: 'INQUIRY', label: '문의' },
        { id: 'RECRUIT', label: '지원' },
        { id: 'TEAM', label: '팀' },
        { id: 'DM', label: '개인' },
    ];

    // 💡 Step 4.1: 탭에 맞게 방 목록 필터링
    const filteredRooms = activeTab === 'ALL'
        ? rooms
        : rooms.filter(room => room.category === activeTab);

    return (
        <div className="flex flex-col h-full">
            {/* 🏷️ Step 4.1: 카테고리 필터링 탭 영역 */}
            <div className="px-4 py-2 border-b border-slate-100 flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-3 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 필터링 결과가 없을 때의 예외 처리 UI */}
            {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 p-4 text-center">
                    <p>해당하는 대화가 없습니다.</p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                    {filteredRooms.map((room) => {
                        const categoryColor = getCategoryColor(room.category);
                        const isActive = room._id === activeRoomId;

                        return (
                            <li
                                key={room._id}
                                onClick={() => onRoomClick(room._id)}
                                // 🖱️ 호버 효과와 현재 활성화된 방 스타일을 다르게 줘서 UX를 높였어.
                                className={`
                                    relative cursor-pointer transition-colors p-4
                                    hover:bg-slate-50
                                    ${isActive ? 'bg-slate-50' : 'bg-white'}
                                `}
                            >
                                {/* 🌈 카테고리 컬러 인디케이터 (왼쪽 세로 바) */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1.5"
                                    style={{ backgroundColor: categoryColor }}
                                />

                                <div className="pl-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-slate-800 text-sm truncate pr-2">
                                            {room.title}
                                        </h3>
                                        {/* 🏷️ 카테고리 배지 (우측 상단) */}
                                        <span
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                                            style={{
                                                // 배경은 연하게, 글씨는 진하게 처리해서 가독성을 높여주는 센스!
                                                backgroundColor: `${categoryColor}20`, // Hex 테일윈드에서 20(Hex opacity)을 추가해서 투명도 12% 정도 적용
                                                color: categoryColor,
                                            }}
                                        >
                                            {room.category}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                                        <p className="truncate pr-4 flex-1">
                                            {room.lastMessage || '새로운 채팅방이 생성되었습니다.'}
                                        </p>
                                        <span className="whitespace-nowrap shrink-0" suppressHydrationWarning>
                                            {new Date(room.updatedAt).toLocaleTimeString('ko-KR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
