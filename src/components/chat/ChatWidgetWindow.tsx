'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useChatWidgetStore } from '@/store/chatWidgetStore';
import { useChatSocket } from '@/hooks/useChatSocket';
import { getCategoryColor } from '@/constants/chat';
import { getRoomDisplayName } from '@/lib/utils/chat/chatUtils';
import { IChatRoomClient, IChatMessageClient } from '@/types/chat';

interface ChatWidgetWindowProps {
  room: IChatRoomClient;
}

export default function ChatWidgetWindow({ room }: ChatWidgetWindowProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { backToList, close } = useChatWidgetStore();

  const [currentUserId, setCurrentUserId] = useState('');
  const [messages, setMessages] = useState<IChatMessageClient[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(false);

  useEffect(() => {
    if (session?.user?._id) setCurrentUserId(session.user._id);
  }, [session]);

  // 소켓 연결
  const { emit, subscribe } = useChatSocket({ roomId: room._id, userId: currentUserId });

  // 초기 메시지 로드
  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/chat/messages/${room._id}?userId=${currentUserId}&limit=20`)
      .then((res) => res.json())
      .then(({ success, data, pagination }) => {
        if (success) {
          shouldAutoScroll.current = true;
          setMessages(data);
          if (pagination) {
            setNextCursor(pagination.nextCursor);
            setHasNextPage(pagination.hasNextPage);
          }
        }
      })
      .catch(() => {});
  }, [room._id, currentUserId]);

  // 스크롤 처리
  useEffect(() => {
    if (shouldAutoScroll.current) {
      const container = scrollContainerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
      shouldAutoScroll.current = false;
    }
  }, [messages]);

  // 새 메시지 수신 + 읽음 처리
  useEffect(() => {
    const unsubMsg = subscribe('receive_message', (incoming: IChatMessageClient) => {
      if (incoming.roomId === room._id) {
        shouldAutoScroll.current = true;
        setMessages((prev) => [...prev, incoming]);

        const senderId =
          typeof incoming.sender === 'string' ? incoming.sender : incoming.sender?._id;
        if (senderId !== currentUserId) {
          emit('mark-messages-read', { roomId: room._id, userId: currentUserId });
        }
      }
    });

    const unsubRead = subscribe(
      'messages-read-receipt',
      ({ roomId: rid, readByUserId }: { roomId: string; readByUserId: string }) => {
        if (rid === room._id) {
          setMessages((prev) =>
            prev.map((msg) => {
              const sid = typeof msg.sender === 'string' ? msg.sender : (msg.sender?._id ?? '');
              if (sid === currentUserId && msg.readBy && !msg.readBy.includes(readByUserId)) {
                return { ...msg, readBy: [...msg.readBy, readByUserId] };
              }
              return msg;
            })
          );
        }
      }
    );

    return () => {
      unsubMsg?.();
      unsubRead?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, room._id, currentUserId]);

  // 과거 메시지 로드 (스크롤 최상단)
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasNextPage || !nextCursor || !currentUserId) return;
    setIsLoadingMore(true);

    const container = scrollContainerRef.current;
    const prevHeight = container ? container.scrollHeight : 0;

    try {
      const res = await fetch(
        `/api/chat/messages/${room._id}?userId=${currentUserId}&limit=20&cursor=${nextCursor}`
      );
      const { success, data, pagination } = await res.json();
      if (success) {
        setMessages((prev) => [...data, ...prev]);
        if (pagination) {
          setNextCursor(pagination.nextCursor);
          setHasNextPage(pagination.hasNextPage);
        }
        setTimeout(() => {
          if (container) container.scrollTop = container.scrollHeight - prevHeight;
        }, 0);
      }
    } catch {
      // 재시도는 다음 스크롤 시
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) loadMoreMessages();
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    const content = messageInput.trim();
    const tempId = Date.now().toString();

    shouldAutoScroll.current = true;
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        roomId: room._id,
        sender: currentUserId,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessageInput('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room._id, content, senderId: currentUserId }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));
        emit('send_message', { ...data, participantIds: room.participants.map((p) => p._id) });
      }
    } catch {
      // 전송 실패 — 낙관적 UI 유지
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExpand = () => {
    close();
    router.push(`/chat?roomId=${room._id}`);
  };

  const displayName = getRoomDisplayName(room, currentUserId);
  const categoryColor = getCategoryColor(room.category);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-container-low border-b border-outline-variant/10 shrink-0">
        <button
          onClick={backToList}
          className="p-1 text-on-surface-variant hover:text-on-surface rounded-md hover:bg-surface-container-high transition-colors"
          aria-label="목록으로"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* 아바타 + 이름 */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-on-surface text-sm truncate flex-1">{displayName}</span>

        <button
          onClick={handleExpand}
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

      {/* 메시지 영역 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-3"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-1">
            <span className="text-[10px] text-on-surface-variant">이전 대화 불러오는 중...</span>
          </div>
        )}
        {!hasNextPage && messages.length > 0 && (
          <div className="flex justify-center my-2">
            <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold tracking-wider text-on-surface-variant/70">
              대화가 시작되었습니다
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/50">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-xs">첫 인사를 건네보세요</p>
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = typeof msg.sender === 'string' ? msg.sender : (msg.sender?._id ?? '');
            const isMine = senderId === currentUserId;
            const senderInfo = room.participants.find((p) => p._id === senderId);
            const senderName = senderInfo?.nName ?? (isMine ? '나' : '알 수 없음');

            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : ''} max-w-[85%] ${isMine ? 'ml-auto' : ''}`}
              >
                {/* 아바타 (상대방만) */}
                {!isMine && (
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <span className="text-[10px] text-on-surface-variant mx-0.5">{senderName}</span>
                  )}
                  <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`px-3 py-2 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-primary-container text-white rounded-2xl rounded-tr-none shadow-md'
                          : 'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <div className="flex flex-col items-center justify-end">
                      {isMine &&
                        (() => {
                          const unread = room.participants.length - (msg.readBy?.length ?? 0);
                          return unread > 0 ? (
                            <span className="text-[9px] text-tertiary font-bold mb-0.5">
                              {unread}
                            </span>
                          ) : null;
                        })()}
                      <span
                        className="text-[9px] text-on-surface-variant/60 min-w-fit"
                        suppressHydrationWarning
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="px-3 py-2 bg-surface-container-lowest border-t border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 pr-3 rounded-2xl focus-within:ring-2 ring-primary-container/30 transition-all">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-on-surface py-1.5 px-2"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
              messageInput.trim()
                ? 'bg-primary-container text-white hover:scale-105 active:scale-95'
                : 'bg-surface-container-high text-on-surface-variant/40'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5M5 12l7-7 7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
