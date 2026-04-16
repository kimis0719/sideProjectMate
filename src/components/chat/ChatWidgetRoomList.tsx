'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChatWidgetStore } from '@/store/chatWidgetStore';
import { getCategoryColor } from '@/constants/chat';
import { getRoomDisplayName } from '@/lib/utils/chat/chatUtils';
import { IChatRoomClient } from '@/types/chat';

export default function ChatWidgetRoomList() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openRoom, close } = useChatWidgetStore();

  const [rooms, setRooms] = useState<IChatRoomClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserId = session?.user?._id || '';

  // 룸 목록 로드
  useEffect(() => {
    if (!currentUserId) return;
    setIsLoading(true);
    fetch('/api/chat/rooms')
      .then((res) => res.json())
      .then(({ success, data }) => {
        if (success && data) setRooms(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [currentUserId]);

  // 검색 필터 (채팅방 이름 + 참여자 닉네임)
  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const displayName = getRoomDisplayName(room, currentUserId);
    const matchName = displayName.toLowerCase().includes(q);
    const matchParticipant = room.participants?.some(
      (p) => p.nName && p.nName.toLowerCase().includes(q)
    );
    return matchName || matchParticipant;
  });

  const handleExpandClick = () => {
    close();
    router.push('/chat');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-outline-variant/10 shrink-0">
        <span className="font-semibold text-on-surface text-sm">메시지</span>
        <button
          onClick={handleExpandClick}
          className="p-1 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container-high transition-colors"
          aria-label="풀페이지 채팅으로 이동"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17L17 7M17 7H7M17 7v10"
            />
          </svg>
        </button>
      </div>

      {/* 검색 */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container/30 focus:border-primary/30 transition-all placeholder:text-on-surface-variant/40"
            placeholder="채팅방, 참여자 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 룸 리스트 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
            <svg
              className="w-8 h-8 mb-2 text-on-surface-variant/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">{searchQuery ? '검색 결과가 없습니다.' : '대화가 없습니다.'}</p>
          </div>
        ) : (
          <div className="px-2 py-1 space-y-0.5">
            {filteredRooms.map((room) => {
              const displayName = getRoomDisplayName(room, currentUserId);
              const unreadCount = room.myUnreadCount ?? 0;
              const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount);
              const categoryColor = getCategoryColor(room.category);
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={room._id}
                  onClick={() => openRoom(room)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-surface-container-low transition-colors"
                >
                  {/* 아바타 */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
                    style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                  >
                    {initial}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-semibold text-on-surface text-sm truncate">
                        {displayName}
                      </h4>
                      <span
                        className="text-[10px] text-on-surface-variant/60 whitespace-nowrap ml-2"
                        suppressHydrationWarning
                      >
                        {formatTime(room.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p
                        className={`text-xs truncate flex-1 pr-2 ${unreadCount > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant/70'}`}
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
    </div>
  );
}

/** 시간 포맷: 오늘이면 HH:mm, 어제면 '어제', 그 외 MM/DD */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays <= 1 && date.getDate() === now.getDate() - 1) {
    return '어제';
  }
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}
