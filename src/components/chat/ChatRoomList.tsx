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

export default function ChatRoomList({
  rooms,
  activeRoomId,
  currentUserId,
  onRoomClick,
}: ChatRoomListProps) {
  const [activeTab, setActiveTab] = useState<ChatCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const TABS: { id: ChatCategory | 'ALL'; label: string }[] = [
    { id: 'ALL', label: '전체' },
    { id: 'INQUIRY', label: '문의' },
    { id: 'RECRUIT', label: '지원' },
    { id: 'TEAM', label: '팀' },
    { id: 'DM', label: '개인' },
  ];

  // 탭 + 검색 필터링 (채팅방 이름, 마지막 메시지, 참여자 닉네임으로 필터)
  // 전체 채팅 이력 검색은 ChatWindow 내부에서 서버 API로 지원
  const filteredRooms = rooms.filter((room) => {
    const matchTab = activeTab === 'ALL' || room.category === activeTab;
    if (!searchQuery) return matchTab;
    const q = searchQuery.toLowerCase();
    const displayName = getRoomDisplayName(room, currentUserId);
    const matchName = displayName.toLowerCase().includes(q);
    const matchMessage = room.lastMessage?.toLowerCase().includes(q);
    const matchParticipant = room.participants?.some(
      (p) => p.nName && p.nName.toLowerCase().includes(q)
    );
    return matchTab && (matchName || matchMessage || matchParticipant);
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 검색 */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
            search
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm text-on-surface shadow-sm focus:ring-2 focus:ring-primary-container/30 focus:border-primary/30 transition-all placeholder:text-on-surface-variant/40"
            placeholder="채팅방, 참여자, 메시지 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 카테고리 필터 칩 */}
      <div className="px-6 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 룸 리스트 */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-on-surface-variant p-6 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">
            chat_bubble_outline
          </span>
          <p className="text-sm">해당하는 대화가 없습니다.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar">
          {filteredRooms.map((room) => {
            const isActive = room._id === activeRoomId;
            const displayName = getRoomDisplayName(room, currentUserId);
            const unreadCount = room.myUnreadCount ?? 0;
            const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);
            const categoryColor = getCategoryColor(room.category);

            // 아바타: 첫 글자 이니셜
            const initial = displayName.charAt(0).toUpperCase();

            return (
              <div
                key={room._id}
                onClick={() => onRoomClick(room._id)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-l-4 ${
                  isActive
                    ? 'bg-surface-container-lowest shadow-sm'
                    : 'hover:bg-surface-container-lowest/50'
                }`}
                style={{ borderLeftColor: isActive ? categoryColor : 'transparent' }}
              >
                {/* 아바타 */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor,
                  }}
                >
                  {initial}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-on-surface text-sm truncate">
                      {displayName}
                    </h4>
                    <span
                      className="text-[10px] text-on-surface-variant/60 whitespace-nowrap ml-2"
                      suppressHydrationWarning
                    >
                      {new Date(room.updatedAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-xs truncate flex-1 pr-2 ${
                        unreadCount > 0
                          ? 'text-on-surface font-semibold'
                          : 'text-on-surface-variant/70'
                      } ${room.lastMessage?.startsWith('[시스템]') ? 'italic' : ''}`}
                    >
                      {room.lastMessage || '대화를 시작해보세요'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight shrink-0">
                        {unreadLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
