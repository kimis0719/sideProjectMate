import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IChatRoomClient } from '@/types/chat';

interface ChatWidgetState {
  isOpen: boolean;
  activeRoomId: string | null;
  activeRoom: IChatRoomClient | null;
}

interface ChatWidgetActions {
  toggle: () => void;
  close: () => void;
  openRoom: (room: IChatRoomClient) => void;
  backToList: () => void;
}

export const useChatWidgetStore = create<ChatWidgetState & ChatWidgetActions>()(
  devtools(
    (set) => ({
      isOpen: false,
      activeRoomId: null,
      activeRoom: null,

      toggle: () =>
        set((state) => ({
          isOpen: !state.isOpen,
          // 닫힐 때 선택 룸 초기화
          activeRoomId: state.isOpen ? null : state.activeRoomId,
          activeRoom: state.isOpen ? null : state.activeRoom,
        })),

      close: () => set({ isOpen: false, activeRoomId: null, activeRoom: null }),

      openRoom: (room: IChatRoomClient) => set({ activeRoomId: room._id, activeRoom: room }),

      backToList: () => set({ activeRoomId: null, activeRoom: null }),
    }),
    { name: 'chatWidgetStore' }
  )
);
