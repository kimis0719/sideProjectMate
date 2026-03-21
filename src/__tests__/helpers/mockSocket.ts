import { vi } from 'vitest';

type EventHandler = (...args: any[]) => void;

/**
 * Socket.io 클라이언트 Mock 객체 생성
 *
 * on/off/emit/disconnect를 가진 가짜 소켓을 반환합니다.
 * emit 호출을 추적하고, on으로 등록된 핸들러를 수동으로 호출할 수 있습니다.
 *
 * 사용 예:
 *   const { mockSocket, emitFromServer } = createMockSocket();
 *   // 클라이언트가 서버에 보내는 이벤트 검증
 *   expect(mockSocket.emit).toHaveBeenCalledWith('join-board', 'board-1');
 *   // 서버에서 클라이언트로 이벤트 시뮬레이션
 *   emitFromServer('note-created', { id: '1', text: 'new' });
 */
export const createMockSocket = () => {
  const listeners = new Map<string, EventHandler[]>();

  const mockSocket = {
    emit: vi.fn(),
    on: vi.fn((event: string, handler: EventHandler) => {
      const handlers = listeners.get(event) || [];
      handlers.push(handler);
      listeners.set(event, handlers);
    }),
    off: vi.fn((event: string, handler?: EventHandler) => {
      if (!handler) {
        listeners.delete(event);
      } else {
        const handlers = listeners.get(event) || [];
        listeners.set(event, handlers.filter((h) => h !== handler));
      }
    }),
    disconnect: vi.fn(),
    connected: true,
    id: 'mock-socket-id',
  };

  /**
   * 서버에서 클라이언트로 이벤트를 보내는 것을 시뮬레이션합니다.
   * on()으로 등록된 핸들러를 직접 호출합니다.
   */
  const emitFromServer = (event: string, ...args: any[]) => {
    const handlers = listeners.get(event) || [];
    handlers.forEach((handler) => handler(...args));
  };

  /** 등록된 모든 이벤트 리스너를 초기화합니다. */
  const clearListeners = () => {
    listeners.clear();
  };

  return { mockSocket, emitFromServer, clearListeners };
};

/**
 * @/lib/socket 모듈을 Mock하는 설정 함수
 *
 * vi.mock은 호이스팅되므로, 테스트 파일 최상단에서 직접 vi.mock을 사용하세요.
 * 이 함수는 mockSocket 객체를 반환하기 위한 팩토리로 사용합니다.
 *
 * 사용 예 (테스트 파일 최상단):
 *   const { mockSocket, emitFromServer } = createMockSocket();
 *   vi.mock('@/lib/socket', () => ({
 *     getSocket: () => mockSocket,
 *     socketClient: { connect: () => mockSocket, disconnect: vi.fn(), socket: mockSocket },
 *   }));
 */
