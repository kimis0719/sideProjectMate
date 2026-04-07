'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getCategoryColor } from '@/constants/chat';
import { IChatRoomClient, IChatMessageClient } from '@/types/chat';
import Image from 'next/image';
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
  const { isConnected, emit, subscribe } = useChatSocket({
    roomId: room._id,
    userId: currentUserId,
  });

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

  // 채팅 컨테이너 내부에서만 스크롤 (브라우저 전체 스크롤 방지)
  const scrollToElement = (
    el: HTMLElement | null,
    behavior: ScrollBehavior = 'smooth',
    block: 'center' | 'end' = 'center'
  ) => {
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    if (block === 'end') {
      container.scrollTop = container.scrollHeight;
    } else {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetTop = elRect.top - containerRect.top + container.scrollTop;
      const targetScroll = offsetTop - container.clientHeight / 2 + elRect.height / 2;
      container.scrollTo({ top: targetScroll, behavior });
    }
  };

  // ⬇️ Step 7.1: messages state가 바뀌었을 때 스크롤 로직 실행
  useEffect(() => {
    if (shouldAutoScroll.current) {
      // sentinel div를 뷰포트 안으로 스크롤 (입력창 겹침 없이 정확하게!)
      scrollToElement(messagesEndRef.current, 'instant', 'end');
      shouldAutoScroll.current = false;
    }
    // isLoadMoreAction이 true일 때 (8.1 데이터 로드) 스크롤 유지도 이쪽에서 진행
    setIsLoadMoreAction(false);
  }, [messages]);

  // 🚪 Step 9.4: 채팅방 헤더 메뉴(점세개) 열기/닫기 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 👥 Step 8: 참여자 목록 패널 열기/닫기 상태
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // 🔍 메시지 검색 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // API에서 가져온 검색 결과 메시지 목록
  const [searchResults, setSearchResults] = useState<IChatMessageClient[]>([]);
  // 검색 결과 표시 모드 여부
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  // 현재 포커스된 검색 결과 인덱스
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // 각 메시지 div에 대한 ref 배열 (검색 결과 스크롤용)
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 클릭한 검색 결과 메시지의 _id — messages 갱신 후 해당 위치로 스크롤
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);

  // messages가 바뀌었을 때 targetMessageId가 있으면 그 위치로 스크롤
  useEffect(() => {
    if (!targetMessageId) return;
    const idx = messages.findIndex((m) => m._id === targetMessageId);
    if (idx !== -1) {
      setTimeout(() => {
        scrollToElement(messageRefs.current[idx]);
      }, 80);
      setTargetMessageId(null);
    }
  }, [messages, targetMessageId]);

  // 검색 결과 클릭: 해당 메시지 앵커로 대화 로드 후 검색 모드 해제
  const handleSearchResultClick = async (msg: IChatMessageClient) => {
    const msgId = msg._id;
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchQuery('');
    setTargetMessageId(msgId);

    try {
      const res = await fetch(
        `/api/chat/messages/${room._id}?anchor=${msgId}&userId=${currentUserId}&limit=20`
      );
      const { success, data, pagination } = await res.json();
      if (success) {
        shouldAutoScroll.current = false; // 맨 아래로 튀지 않도록
        setMessages(data as IChatMessageClient[]);
        if (pagination) {
          setNextCursor(pagination.nextCursor);
          setHasNextPage(pagination.hasNextPage);
        }
      }
    } catch {
      // 실패 시 기존 messages 유지, targetMessageId만 클리어
      setTargetMessageId(null);
    }
  };

  // 검색창 열릴 때 input 포커스, 닫힐 때 상태 초기화
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchMode(false);
    }
  }, [isSearchOpen]);

  // Enter 키로 서버에서 전체 메시지 검색
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }
    setIsSearchLoading(true);
    try {
      const res = await fetch(
        `/api/chat/messages/${room._id}?q=${encodeURIComponent(searchQuery)}&userId=${currentUserId}`
      );
      const { success, data } = await res.json();
      if (success) {
        setSearchResults(data as IChatMessageClient[]);
        setIsSearchMode(true);
        setCurrentMatchIdx(0);
        // 첫 번째 결과로 스크롤
        setTimeout(() => scrollToElement(messageRefs.current[0]), 100);
      }
    } catch {
      // 검색 실패 시 조용히 유지
    } finally {
      setIsSearchLoading(false);
    }
  };

  const totalResults = isSearchMode ? searchResults.length : 0;

  const goToPrevMatch = () => {
    if (totalResults === 0) return;
    const next = (currentMatchIdx - 1 + totalResults) % totalResults;
    setCurrentMatchIdx(next);
    scrollToElement(messageRefs.current[next]);
  };

  const goToNextMatch = () => {
    if (totalResults === 0) return;
    const next = (currentMatchIdx + 1) % totalResults;
    setCurrentMatchIdx(next);
    scrollToElement(messageRefs.current[next]);
  };

  // 검색 키보드: Enter = 검색실행(결과 있으면 다음), Shift+Enter = 이전, Esc = 닫기
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isSearchMode) {
        // 이미 결과가 있으면 결과 간 이동
        e.shiftKey ? goToPrevMatch() : goToNextMatch();
      } else {
        handleSearchSubmit();
      }
    }
  };

  // 검색어에서 매칭 부분을 하이라이트한 React 노드 반환
  const highlightText = (content: string, query: string, isCurrent: boolean) => {
    if (!query.trim()) return <>{content}</>;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = content.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className={`rounded px-0.5 font-semibold ${isCurrent ? 'bg-yellow-400 text-black' : 'bg-yellow-200 text-black'}`}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- room._id/currentUserId 변경 시에만 재로드; fetchInitialMessages를 deps에 추가하면 매 렌더마다 재호출됨
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
          body: JSON.stringify({
            roomId: room._id,
            content: pending.content,
            senderId: currentUserId,
          }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchInitialMessages/flushPendingMessages/emit을 deps에 넣으면 소켓 재연결 무한루프 위험
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
      const res = await fetch(
        `/api/chat/messages/${room._id}?userId=${currentUserId}&limit=20&cursor=${nextCursor}`
      );
      const { success, data, pagination } = await res.json();

      if (success) {
        // 기존 메시지 "앞에" 과거 메시지들을 쏙 붙여넣음!
        setMessages((prev) => [...data, ...prev]);

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
        const isMine =
          incomingMessage.sender === currentUserId || incomingMessage.sender?._id === currentUserId;
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
        setMessages((prev) =>
          prev.map((msg) => {
            // sender가 populate된 객체일 수도, 순수 문자열 ID일 수도 있어서 타입 가드로 ID를 안전하게 추출!
            const getSenderId = (sender: string | { _id?: string }): string =>
              typeof sender === 'string' ? sender : (sender?._id ?? '');
            const isMine = getSenderId(msg.sender) === currentUserId;
            if (isMine && msg.readBy && !msg.readBy.includes(readByUserId)) {
              return { ...msg, readBy: [...msg.readBy, readByUserId] };
            }
            return msg;
          })
        );
      }
    });

    return () => {
      if (unsubscribeMsg) unsubscribeMsg();
      if (unsubscribeRead) unsubscribeRead();
    };
    // 🔑 currentUserId를 의존성 배열에 꼭 넣어야 해!
    // 없으면 클로저가 초기값('')을 캡처해버려서 isMine 판별이 영원히 false가 됨
    // eslint-disable-next-line react-hooks/exhaustive-deps -- emit은 useChatSocket에서 안정적 참조; deps에 추가하면 소켓 재구독 루프 위험
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
      type: 'TEXT',
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
        setMessages((prev) => prev.map((msg) => (msg._id === temporaryId ? data : msg)));

        // 5. 서버에 브로드캐스트 요청 (Socket.io)
        // DB의 _id가 담긴 완전한 data를 날려보내야 상대방도 Key 충돌을 겪지 않음
        // participantIds 포함 → 서버가 헤더 뱃지용 message-received 이벤트를 개인 Room으로 전달
        emit('send_message', { ...data, participantIds: room.participants.map((p) => p._id) });
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
    <div className="flex-1 min-h-0 flex flex-col bg-surface relative">
      {/* 상단 헤더 — glass 효과 */}
      <header className="h-16 px-6 flex items-center justify-between backdrop-blur-xl bg-surface-container-lowest/80 z-10 flex-shrink-0 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          {/* 모바일 뒤로가기 */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-surface-container-high transition-colors"
              title="목록으로"
            >
              <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
            </button>
          )}
          {/* 아바타 */}
          {room.participants.length > 0 &&
            (() => {
              const other =
                room.participants.find((p) => p._id !== currentUserId) || room.participants[0];
              return other?.avatarUrl ? (
                <Image
                  src={other.avatarUrl}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                  alt={other.nName || ''}
                  unoptimized
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  {(other?.nName || room.category).charAt(0).toUpperCase()}
                </div>
              );
            })()}
          <div>
            <h3 className="font-semibold text-on-surface leading-tight">
              {room.projectName || room.metadata?.name || room.category}
            </h3>
            <span className="text-xs text-on-surface-variant">
              {room.participants.length === 2
                ? '1:1 채팅'
                : `그룹 채팅 (${room.participants.length}명)`}
            </span>
          </div>
        </div>

        {/* 우측 도구 모음 */}
        <div className="flex items-center gap-1 text-on-surface-variant">
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`p-2 rounded-lg hover:bg-surface-container-high transition-colors ${isSearchOpen ? 'text-primary bg-primary/5' : ''}`}
            title="메시지 검색"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          {/* 참여자 목록 */}
          <div className="relative">
            <button
              onClick={() => setIsParticipantsOpen((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
              title="참여자 목록"
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
            </button>
            {isParticipantsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsParticipantsOpen(false)} />
                <div className="absolute right-0 top-12 z-20 bg-surface-container-lowest border border-outline-variant/15 rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.12)] overflow-hidden min-w-[220px]">
                  <div className="px-4 py-3 border-b border-outline-variant/10">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      참여자 {room.participants.length}명
                    </p>
                  </div>
                  <ul className="py-1">
                    {room.participants.map((p) => (
                      <li
                        key={p._id}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container-low transition-colors"
                      >
                        {p.avatarUrl ? (
                          <Image
                            src={p.avatarUrl}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full object-cover"
                            alt={p.nName || ''}
                            unoptimized
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
                            {p.nName?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <span className="text-sm text-on-surface">{p.nName ?? '알 수 없음'}</span>
                        {p._id === currentUserId && (
                          <span className="text-xs text-on-surface-variant ml-1">(나)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* 메뉴 (나가기) */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-20 bg-surface-container-lowest border border-outline-variant/15 rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.12)] py-1 min-w-[160px]">
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full px-4 py-2.5 text-sm text-left text-error hover:bg-error/5 transition-colors font-medium flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    채팅방 나가기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 메시지 검색바 */}
      {isSearchOpen && (
        <div className="flex flex-col bg-surface-container-low border-b border-outline-variant/10 flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-2.5">
            {isSearchLoading ? (
              <div className="w-4 h-4 border-2 border-outline-variant border-t-primary rounded-full animate-spin shrink-0" />
            ) : (
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
                search
              </span>
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (isSearchMode) {
                  setIsSearchMode(false);
                  setSearchResults([]);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="검색어 입력 후 Enter..."
              className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
            />
            {isSearchMode && (
              <>
                <span className="text-xs text-on-surface-variant shrink-0 tabular-nums">
                  {totalResults > 0 ? `${currentMatchIdx + 1} / ${totalResults}` : '결과 없음'}
                </span>
                <button
                  onClick={goToPrevMatch}
                  disabled={totalResults === 0}
                  className="p-1 hover:text-on-surface transition-colors disabled:opacity-30"
                  title="이전 결과 (Shift+Enter)"
                >
                  <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                </button>
                <button
                  onClick={goToNextMatch}
                  disabled={totalResults === 0}
                  className="p-1 hover:text-on-surface transition-colors disabled:opacity-30"
                  title="다음 결과 (Enter)"
                >
                  <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                </button>
              </>
            )}
            {!isSearchMode && searchQuery.trim() && (
              <button
                onClick={handleSearchSubmit}
                className="text-xs px-2.5 py-1 rounded-lg bg-primary-container text-white hover:bg-primary-container/90 transition-colors shrink-0"
              >
                검색
              </button>
            )}
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 hover:text-on-surface text-on-surface-variant transition-colors shrink-0"
              title="닫기 (Esc)"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          {isSearchMode && (
            <div className="px-4 pb-2 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                {totalResults > 0
                  ? `"${searchQuery}" 검색 결과 ${totalResults}개`
                  : `"${searchQuery}"에 대한 결과가 없습니다.`}
              </span>
              <button
                onClick={() => {
                  setIsSearchMode(false);
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                결과 닫기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 오프라인 경고 배너 */}
      {!isOnline && (
        <div className="bg-error text-on-error text-xs font-bold text-center py-1.5 shadow-sm z-20">
          인터넷 연결이 불안정하여 오프라인 모드로 전환되었습니다. 대기 중...
        </div>
      )}

      {/* 메인 채팅 내역 영역 */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
      >
        {!isSearchMode && isLoadingMore && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-on-surface-variant">이전 대화 불러오는 중...</span>
          </div>
        )}
        {!isSearchMode && !hasNextPage && messages.length > 0 && (
          <div className="flex justify-center my-4">
            <span className="px-4 py-1.5 bg-surface-container-high rounded-full text-[11px] font-bold tracking-widest text-on-surface-variant/70 font-label">
              대화가 시작되었습니다
            </span>
          </div>
        )}

        {/* 💬 메시지 목록: 검색 모드면 searchResults, 아니면 messages 사용 */}
        {(() => {
          const displayMessages = isSearchMode ? searchResults : messages;

          if (displayMessages.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/50">
                {isSearchMode ? (
                  <p className="text-sm">검색 결과가 없습니다.</p>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl mb-2">chat</span>
                    <p className="text-sm">아직 아무런 대화가 없어요!</p>
                    <p className="text-xs mt-1">첫 인사를 건네보세요</p>
                  </>
                )}
              </div>
            );
          }

          return displayMessages.map((msg, idx) => {
            const getSenderId = (sender: string | { _id?: string }): string =>
              typeof sender === 'string' ? sender : (sender?._id ?? '');
            const senderId = getSenderId(msg.sender);
            const isMine = senderId === currentUserId;
            const senderInfo = room.participants.find((p) => p._id === senderId);
            const senderName = senderInfo?.nName ?? (isMine ? '나' : '알 수 없음');
            const senderAvatar = senderInfo?.avatarUrl;

            // 검색 모드: 모든 결과가 매칭, 현재 포커스 인덱스만 구분
            const isCurrentMatch = isSearchMode && idx === currentMatchIdx;

            return (
              <div
                key={msg._id ?? idx}
                ref={(el) => {
                  messageRefs.current[idx] = el;
                }}
                onClick={isSearchMode ? () => handleSearchResultClick(msg) : undefined}
                className={`flex items-start gap-3 scroll-mt-4 ${isMine ? 'flex-row-reverse' : ''} max-w-[80%] md:max-w-[80%] ${isMine ? 'ml-auto' : ''} ${isSearchMode ? 'cursor-pointer rounded-xl p-1 hover:bg-surface-container-low/60 transition-colors' : ''}`}
              >
                {/* 아바타 (상대방만, 내 메시지는 숨김) */}
                {!isMine &&
                  (senderAvatar ? (
                    <Image
                      src={senderAvatar}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full shrink-0 object-cover mt-1"
                      alt={senderName}
                      unoptimized
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-surface-container-high text-on-surface-variant mt-1">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  ))}
                <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                  {!isMine && (
                    <span className="text-[11px] text-on-surface-variant mx-1">{senderName}</span>
                  )}

                  <div className={`flex items-end gap-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`p-4 text-sm leading-relaxed transition-all ${
                        isMine
                          ? 'bg-primary-container text-white rounded-2xl rounded-tr-none shadow-md'
                          : 'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-none shadow-sm'
                      } ${isCurrentMatch ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
                    >
                      <p className="whitespace-pre-wrap">
                        {highlightText(msg.content, searchQuery, isCurrentMatch)}
                      </p>
                    </div>

                    {!isSearchMode && (
                      <div className="flex flex-col items-center justify-end mb-1">
                        {isMine &&
                          (() => {
                            const unread = room.participants.length - (msg.readBy?.length ?? 0);
                            return unread > 0 ? (
                              <span className="text-[10px] text-tertiary font-bold mb-0.5">
                                {unread}
                              </span>
                            ) : null;
                          })()}
                        <span
                          className="text-[10px] text-on-surface-variant/60 mx-1 min-w-fit"
                          suppressHydrationWarning
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                    {isSearchMode && (
                      <span
                        className="text-[10px] text-on-surface-variant/60 mx-1 min-w-fit"
                        suppressHydrationWarning
                      >
                        {new Date(msg.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(msg.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}
        {/* 스크롤 sentinel — 새 메시지 도착 시 이 div 위치로 스크롤 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 채팅 입력창 영역 */}
      <footer className="p-4 md:p-6 bg-surface-container-lowest flex-shrink-0">
        <div className="flex items-center gap-3 bg-surface-container-low p-2 pr-4 rounded-2xl focus-within:ring-2 ring-primary-container/30 transition-all">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-on-surface py-2 px-2"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              messageInput.trim()
                ? 'bg-primary-container text-white hover:scale-105 active:scale-95'
                : 'bg-surface-container-high text-on-surface-variant/40'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
