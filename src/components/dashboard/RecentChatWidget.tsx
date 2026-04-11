'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ChatRoom {
  _id: string;
  category: string;
  projectId?: string;
  participants: { _id: string; nName?: string; avatarUrl?: string }[];
}

interface ChatMessage {
  _id: string;
  sender: { _id: string; nName?: string; avatarUrl?: string } | string;
  content: string;
  createdAt: string;
}

interface RecentChatWidgetProps {
  projectId: string;
  pid: string;
  currentUserId: string;
}

export default function RecentChatWidget({ projectId, pid, currentUserId }: RecentChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchRecentChat = async () => {
      try {
        setIsLoading(true);

        // 1. 내 채팅방 목록에서 TEAM + projectId 매칭
        const roomsRes = await fetch('/api/chat/rooms');
        const roomsData = await roomsRes.json();
        if (!roomsData.success) {
          setIsEmpty(true);
          return;
        }

        const teamRoom = roomsData.data.find(
          (room: ChatRoom) => room.category === 'TEAM' && room.projectId === projectId
        );

        if (!teamRoom) {
          setIsEmpty(true);
          return;
        }

        setRoomId(teamRoom._id);

        // 2. 최근 메시지 3개 조회
        const msgRes = await fetch(`/api/chat/messages/${teamRoom._id}?limit=3`);
        const msgData = await msgRes.json();

        if (!msgData.success || !msgData.data || msgData.data.length === 0) {
          setIsEmpty(true);
          return;
        }

        setMessages(msgData.data);
      } catch (err) {
        console.error('[RecentChat] 에러:', err);
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentChat();
  }, [projectId]);

  const getSenderId = (sender: ChatMessage['sender']) =>
    typeof sender === 'string' ? sender : sender._id;
  const getSenderName = (sender: ChatMessage['sender']) =>
    typeof sender === 'string' ? '알 수 없음' : sender.nName || '알 수 없음';
  const getSenderAvatar = (sender: ChatMessage['sender']) =>
    typeof sender === 'string' ? null : sender.avatarUrl || null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full md:min-h-[320px]">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-28 bg-surface-container-low rounded animate-pulse" />
          <div className="h-4 w-20 bg-surface-container-low rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="w-7 h-7 bg-surface-container-low rounded-full animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-16 bg-surface-container-low rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-surface-container-low rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full md:min-h-[320px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold font-headline text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">forum</span>
          Recent Chat
        </h3>
        {roomId && (
          <Link
            href={`/chat?roomId=${roomId}`}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
          >
            채팅 열기
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        )}
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2">
            chat_bubble_outline
          </span>
          <p className="text-sm text-on-surface-variant/60">아직 팀 채팅 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          {messages.map((msg) => {
            const isMine = getSenderId(msg.sender) === currentUserId;
            const avatar = getSenderAvatar(msg.sender);

            return (
              <div
                key={msg._id}
                className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* 아바타 */}
                <div className="w-7 h-7 rounded-full bg-surface-container-low shrink-0 overflow-hidden flex items-center justify-center">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt=""
                      width={28}
                      height={28}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">
                      person
                    </span>
                  )}
                </div>

                {/* 메시지 버블 */}
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <p className="text-[10px] text-on-surface-variant/60 mb-0.5 px-1">
                      {getSenderName(msg.sender)}
                    </p>
                  )}
                  <div
                    className={`px-3 py-2 rounded-xl text-sm break-words ${
                      isMine
                        ? 'bg-primary-container text-on-primary-container rounded-tr-sm'
                        : 'bg-surface-container-low text-on-surface rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p
                    className={`text-[10px] text-on-surface-variant/40 mt-0.5 px-1 ${
                      isMine ? 'text-right' : 'text-left'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
