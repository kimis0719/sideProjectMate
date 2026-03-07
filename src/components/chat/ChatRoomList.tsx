'use client';

import { useState } from 'react';
import { getCategoryColor, ChatCategory } from '@/constants/chat';
import { IChatRoomClient } from '@/types/chat';
import { getRoomDisplayName } from '@/lib/utils/chat/chatUtils';

interface ChatRoomListProps {
    rooms: IChatRoomClient[];
    activeRoomId?: string;
    currentUserId: string;
    onRoomClick: (roomId: string) => void;
}

/**
 * 🎨 채팅방 리스트를 보여주는 컴포넌트야.
 * Step 3.2: 각 아이템 왼쪽에 카테고리별 색상 인디케이터(세로 바) 추가
 * Step 4.1: 상단 필터 탭 기능을 추가해서 카테고리별로 대화방을 골라볼 수 있게 했어!
 */
export default function ChatRoomList({ rooms, activeRoomId, currentUserId, onRoomClick }: ChatRoomListProps) {
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
        <div className="flex flex-col flex-1 min-h-0">
            {/* 🏷️ Step 4.1: 카테고리 필터링 탭 영역 */}
            <div className="px-4 py-2 border-b border-border flex gap-1 overflow-x-auto scrollbar-hide shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-3 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-slate-800 text-white'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 필터링 결과가 없을 때의 예외 처리 UI */}
            {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-4 text-center">
                    <p>해당하는 대화가 없습니다.</p>
                </div>
            ) : (
                <ul className="divide-y divide-border flex-1 overflow-y-auto bg-background dark:[color-scheme:dark]">
                    {filteredRooms.map((room) => {
                        const categoryColor = getCategoryColor(room.category);
                        const isActive = room._id === activeRoomId;

                        // 💡 Step 10 (STEP 3): getRoomDisplayName() 유틸로 표시명 결정
                        const displayName = getRoomDisplayName(room, currentUserId);
                        const unreadCount = room.myUnreadCount ?? 0;
                        const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);

                        return (
                            <li
                                key={room._id}
                                onClick={() => onRoomClick(room._id)}
                                // 🖱️ 호버 효과와 현재 활성화된 방 스타일을 다르게 줘서 UX를 높였어.
                                className={`
                                    relative cursor-pointer transition-colors p-4
                                    hover:bg-muted
                                    ${isActive ? 'bg-primary/10' : 'bg-background'}
                                `}
                            >
                                {/* 🌈 카테고리 컬러 인디케이터 (왼쪽 세로 바) */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1.5"
                                    style={{ backgroundColor: categoryColor }}
                                />

                                <div className="pl-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-foreground text-sm truncate pr-2">
                                            {displayName}
                                        </h3>
                                        {/* 카테고리 배지 (우측 상단) */}
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

                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                        <p className={`truncate pr-2 flex-1 ${room.category === 'SYSTEM' || room.lastMessage?.startsWith('[시스템]') ? 'italic' : ''}`}>
                                            {room.lastMessage || '대화를 시작해보세요'}
                                        </p>
                                        {/* 🔴 Step 10 (STEP 3): 읽지 않은 메시지 배지 */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight">
                                                    {unreadLabel}
                                                </span>
                                            )}
                                            <span className="whitespace-nowrap" suppressHydrationWarning>
                                                {new Date(room.updatedAt).toLocaleTimeString('ko-KR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
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
