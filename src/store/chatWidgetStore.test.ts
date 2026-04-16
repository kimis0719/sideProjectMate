import { describe, it, expect, beforeEach } from 'vitest';
import { useChatWidgetStore } from './chatWidgetStore';
import { IChatRoomClient } from '@/types/chat';

// 테스트용 룸 팩토리
const makeRoom = (id: string): IChatRoomClient => ({
  _id: id,
  category: 'DM',
  participants: [{ _id: 'user-1' }, { _id: 'user-2' }],
  updatedAt: new Date().toISOString(),
});

const resetStore = () => {
  useChatWidgetStore.setState({ isOpen: false, activeRoomId: null, activeRoom: null });
};

describe('chatWidgetStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── 초기 상태 ──────────────────────────────────────────────────────
  describe('초기 상태', () => {
    it('isOpen은 false이다', () => {
      expect(useChatWidgetStore.getState().isOpen).toBe(false);
    });

    it('activeRoomId는 null이다', () => {
      expect(useChatWidgetStore.getState().activeRoomId).toBeNull();
    });

    it('activeRoom은 null이다', () => {
      expect(useChatWidgetStore.getState().activeRoom).toBeNull();
    });
  });

  // ── toggle ─────────────────────────────────────────────────────────
  describe('toggle', () => {
    it('닫힌 상태에서 toggle하면 열린다', () => {
      useChatWidgetStore.getState().toggle();
      expect(useChatWidgetStore.getState().isOpen).toBe(true);
    });

    it('열린 상태에서 toggle하면 닫히고 activeRoomId와 activeRoom이 초기화된다', () => {
      const room = makeRoom('room-1');
      useChatWidgetStore.setState({ isOpen: true, activeRoomId: 'room-1', activeRoom: room });
      useChatWidgetStore.getState().toggle();
      const state = useChatWidgetStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.activeRoomId).toBeNull();
      expect(state.activeRoom).toBeNull();
    });

    it('열린 상태에서 toggle하면 activeRoomId 없이도 닫힌다', () => {
      useChatWidgetStore.setState({ isOpen: true, activeRoomId: null, activeRoom: null });
      useChatWidgetStore.getState().toggle();
      expect(useChatWidgetStore.getState().isOpen).toBe(false);
    });
  });

  // ── close ──────────────────────────────────────────────────────────
  describe('close', () => {
    it('위젯을 닫고 activeRoomId와 activeRoom을 초기화한다', () => {
      const room = makeRoom('room-1');
      useChatWidgetStore.setState({ isOpen: true, activeRoomId: 'room-1', activeRoom: room });
      useChatWidgetStore.getState().close();
      const state = useChatWidgetStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.activeRoomId).toBeNull();
      expect(state.activeRoom).toBeNull();
    });

    it('이미 닫힌 상태에서 close해도 에러 없이 동작한다', () => {
      useChatWidgetStore.getState().close();
      expect(useChatWidgetStore.getState().isOpen).toBe(false);
    });
  });

  // ── openRoom ───────────────────────────────────────────────────────
  describe('openRoom', () => {
    it('activeRoomId와 activeRoom을 설정한다', () => {
      const room = makeRoom('room-abc');
      useChatWidgetStore.getState().openRoom(room);
      const state = useChatWidgetStore.getState();
      expect(state.activeRoomId).toBe('room-abc');
      expect(state.activeRoom).toBe(room);
    });

    it('다른 룸으로 전환할 수 있다', () => {
      useChatWidgetStore.getState().openRoom(makeRoom('room-1'));
      const room2 = makeRoom('room-2');
      useChatWidgetStore.getState().openRoom(room2);
      const state = useChatWidgetStore.getState();
      expect(state.activeRoomId).toBe('room-2');
      expect(state.activeRoom).toBe(room2);
    });
  });

  // ── backToList ─────────────────────────────────────────────────────
  describe('backToList', () => {
    it('activeRoomId와 activeRoom을 null로 초기화한다', () => {
      const room = makeRoom('room-1');
      useChatWidgetStore.setState({ isOpen: true, activeRoomId: 'room-1', activeRoom: room });
      useChatWidgetStore.getState().backToList();
      const state = useChatWidgetStore.getState();
      expect(state.activeRoomId).toBeNull();
      expect(state.activeRoom).toBeNull();
      expect(state.isOpen).toBe(true); // 위젯은 열린 상태 유지
    });
  });

  // ── 플로우 시나리오 ────────────────────────────────────────────────
  describe('위젯 사용 플로우', () => {
    it('열기 → 룸 선택 → 뒤로 → 닫기 전체 흐름', () => {
      const room = makeRoom('room-1');

      // 1. 위젯 열기
      useChatWidgetStore.getState().toggle();
      expect(useChatWidgetStore.getState().isOpen).toBe(true);
      expect(useChatWidgetStore.getState().activeRoomId).toBeNull();

      // 2. 룸 선택
      useChatWidgetStore.getState().openRoom(room);
      expect(useChatWidgetStore.getState().activeRoomId).toBe('room-1');
      expect(useChatWidgetStore.getState().activeRoom).toBe(room);

      // 3. 뒤로 (룸 리스트로)
      useChatWidgetStore.getState().backToList();
      expect(useChatWidgetStore.getState().activeRoomId).toBeNull();
      expect(useChatWidgetStore.getState().activeRoom).toBeNull();
      expect(useChatWidgetStore.getState().isOpen).toBe(true);

      // 4. 위젯 닫기
      useChatWidgetStore.getState().close();
      expect(useChatWidgetStore.getState().isOpen).toBe(false);
    });

    it('룸 선택 상태에서 toggle하면 닫히고 룸도 초기화된다', () => {
      const room = makeRoom('room-1');
      useChatWidgetStore.setState({ isOpen: true, activeRoomId: 'room-1', activeRoom: room });
      useChatWidgetStore.getState().toggle();
      const state = useChatWidgetStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.activeRoomId).toBeNull();
      expect(state.activeRoom).toBeNull();
    });
  });
});
