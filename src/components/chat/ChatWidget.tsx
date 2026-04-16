'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useChatWidgetStore } from '@/store/chatWidgetStore';
import ChatWidgetRoomList from '@/components/chat/ChatWidgetRoomList';
import ChatWidgetWindow from '@/components/chat/ChatWidgetWindow';

export default function ChatWidget() {
  const pathname = usePathname();
  const { isOpen, activeRoomId, activeRoom, close } = useChatWidgetStore();
  const widgetRef = useRef<HTMLDivElement>(null);

  // /chat 페이지 진입 시 위젯 자동 닫힘 (중복 소켓 방지)
  useEffect(() => {
    if (pathname?.startsWith('/chat')) {
      close();
    }
  }, [pathname, close]);

  // 바깥 클릭 시 닫힘
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        // 헤더 채팅 버튼 클릭은 toggle로 처리되므로 제외
        const target = e.target as HTMLElement;
        if (target.closest('[data-chat-toggle]')) return;
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // ESC 키로 닫힘
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // 브라우저 뒤로가기 시 위젯 닫힘
  const handlePopState = useCallback(() => {
    if (useChatWidgetStore.getState().isOpen) {
      close();
    }
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ chatWidget: true }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, handlePopState]);

  if (!isOpen) return null;

  return (
    <>
      {/* 위젯 컨테이너 */}
      <div
        ref={widgetRef}
        className={`
          z-50
          fixed top-16 left-0 w-screen
          sm:absolute sm:top-full sm:mt-2 sm:right-0 sm:left-auto sm:w-[380px]
          rounded-b-xl sm:rounded-xl
          bg-surface-container-lowest
          shadow-[0_20px_60px_rgba(26,28,28,0.12)]
          overflow-hidden
          flex flex-col
          animate-fade-in
          max-h-[calc(100vh-5rem)]
          ${activeRoomId ? 'h-[560px]' : 'h-[480px]'}
          transition-[height] duration-300 ease-in-out
        `}
        role="dialog"
        aria-label="채팅 위젯"
      >
        {activeRoomId && activeRoom ? (
          <ChatWidgetWindow room={activeRoom} />
        ) : (
          <ChatWidgetRoomList />
        )}
      </div>
    </>
  );
}
