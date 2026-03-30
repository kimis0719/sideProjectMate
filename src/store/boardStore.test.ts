import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Socket Mock 설정 (vi.hoisted로 호이스팅 문제 해결) ────────────────
const { mockSocket, emitFromServer } = vi.hoisted(() => {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  const mockSocket = {
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const handlers = listeners.get(event) || [];
      handlers.push(handler);
      listeners.set(event, handlers);
    }),
    off: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    disconnect: vi.fn(),
    connected: true,
    id: 'mock-socket-id',
  };
  const emitFromServer = (event: string, ...args: unknown[]) => {
    (listeners.get(event) || []).forEach((h) => h(...args));
  };
  return { mockSocket, emitFromServer };
});

vi.mock('@/lib/socket', () => ({
  getSocket: () => mockSocket,
  socketClient: {
    connect: () => mockSocket,
    disconnect: vi.fn(),
    socket: mockSocket,
  },
}));

import { useBoardStore, type Note, type Section } from './boardStore';

// ── 테스트 유틸 ──────────────────────────────────────────────────────
const resetStore = () => {
  useBoardStore.setState({
    boardId: null,
    pid: null,
    notes: [],
    sections: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedNoteIds: [],
    openPaletteNoteId: null,
    spawnIndex: 0,
    nextColorIndex: 0,
    members: [],
    alignmentGuides: [],
    lockedNotes: {},
    lockedSections: {},
    currentUserId: null,
    peerSelections: {},
    activeUsers: [],
    isSnapEnabled: false,
    isSelectionMode: false,
    isRemoteUpdate: false,
  });
  // temporal 히스토리 초기화
  try {
    useBoardStore.temporal.getState().clear();
  } catch {
    /* ignore */
  }
};

const mockFetchSuccess = (data: unknown, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve({ success: true, data }),
  });
};

const mockFetchFailure = (status = 500) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, message: '서버 에러' }),
  });
};

const createNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-001',
  text: '테스트 노트',
  x: 100,
  y: 100,
  width: 200,
  height: 140,
  color: '#FFFB8F',
  boardId: 'board-001',
  sectionId: null,
  tags: [],
  ...overrides,
});

const createSection = (overrides: Partial<Section> = {}): Section => ({
  id: 'section-001',
  title: '섹션 1',
  x: 0,
  y: 0,
  width: 500,
  height: 400,
  boardId: 'board-001',
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
describe('boardStore', () => {
  // ═══════════════════════════════════════════════════════════════════════════════

  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
    mockSocket.emit.mockClear();
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('초기 상태', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('boardId는 null이다', () => {
      expect(useBoardStore.getState().boardId).toBeNull();
    });

    it('notes는 빈 배열이다', () => {
      expect(useBoardStore.getState().notes).toEqual([]);
    });

    it('sections는 빈 배열이다', () => {
      expect(useBoardStore.getState().sections).toEqual([]);
    });

    it('zoom 기본값은 1이다', () => {
      expect(useBoardStore.getState().zoom).toBe(1);
    });

    it('selectedNoteIds는 빈 배열이다', () => {
      expect(useBoardStore.getState().selectedNoteIds).toEqual([]);
    });

    it('isSnapEnabled는 false이다', () => {
      expect(useBoardStore.getState().isSnapEnabled).toBe(false);
    });

    it('isSelectionMode는 false이다', () => {
      expect(useBoardStore.getState().isSelectionMode).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('initBoard', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('API 호출로 board, notes, sections를 초기화한다', async () => {
      const boardData = { _id: 'board-001', title: 'Test Board', owner: 'user-001' };
      const notesData = [
        {
          _id: 'note-001',
          text: '노트 1',
          x: 10,
          y: 10,
          width: 200,
          height: 140,
          color: '#FFFB8F',
          boardId: 'board-001',
          tags: [],
        },
      ];
      const sectionsData = [
        {
          _id: 'section-001',
          title: '섹션 1',
          x: 0,
          y: 0,
          width: 500,
          height: 400,
          boardId: 'board-001',
        },
      ];

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: boardData }) }) // boards
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: notesData }) }) // notes
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: sectionsData }),
        }) // sections
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, members: [] }),
        }); // members

      await useBoardStore.getState().initBoard(1);

      const state = useBoardStore.getState();
      expect(state.boardId).toBe('board-001');
      expect(state.notes).toHaveLength(1);
      expect(state.sections).toHaveLength(1);
      expect(state.pid).toBe(1);
    });

    it('board 조회 실패 시 상태를 초기화한다', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false });

      await useBoardStore.getState().initBoard(1);

      const state = useBoardStore.getState();
      expect(state.boardId).toBeNull();
      expect(state.notes).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('노트 CRUD', () => {
    // ───────────────────────────────────────────────────────────────────────────

    describe('addNote', () => {
      beforeEach(() => {
        useBoardStore.setState({ boardId: 'board-001' });
      });

      it('Optimistic Update로 임시 노트가 즉시 추가된다', async () => {
        let resolveFetch: (value: unknown) => void;
        global.fetch = vi.fn().mockReturnValue(
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
        );

        const promise = useBoardStore.getState().addNote();

        const state = useBoardStore.getState();
        expect(state.notes).toHaveLength(1);
        expect(state.notes[0].id).toMatch(/^temp-/);
        expect(state.notes[0].text).toBe('새 노트');

        resolveFetch!({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                _id: 'saved-note-001',
                text: '새 노트',
                x: 120,
                y: 120,
                width: 200,
                height: 140,
                color: '#FFFB8F',
                boardId: 'board-001',
                tags: [],
              },
            }),
        });
        await promise;
      });

      it('서버 응답 후 임시 ID가 실제 ID로 교체된다', async () => {
        const savedNote = {
          _id: 'saved-note-001',
          text: '새 노트',
          x: 120,
          y: 120,
          width: 200,
          height: 140,
          color: '#FFFB8F',
          boardId: 'board-001',
          tags: [],
        };
        mockFetchSuccess(savedNote);

        await useBoardStore.getState().addNote();

        expect(useBoardStore.getState().notes[0].id).toBe('saved-note-001');
      });

      it('서버 응답 후 소켓으로 create-note 이벤트를 emit한다', async () => {
        mockFetchSuccess({
          _id: 'saved-001',
          text: '새 노트',
          x: 120,
          y: 120,
          width: 200,
          height: 140,
          color: '#FFFB8F',
          boardId: 'board-001',
          tags: [],
        });

        await useBoardStore.getState().addNote();

        expect(mockSocket.emit).toHaveBeenCalledWith(
          'create-note',
          expect.objectContaining({ boardId: 'board-001' })
        );
      });

      it('boardId가 없으면 노트를 추가하지 않는다', async () => {
        useBoardStore.setState({ boardId: null });

        await useBoardStore.getState().addNote();

        expect(useBoardStore.getState().notes).toHaveLength(0);
      });

      it('API 실패 시 임시 노트가 롤백된다', async () => {
        mockFetchFailure();

        await useBoardStore.getState().addNote();

        expect(useBoardStore.getState().notes).toHaveLength(0);
      });

      it('spawnIndex가 증가한다', async () => {
        mockFetchSuccess({
          _id: 'saved-001',
          text: '새 노트',
          x: 120,
          y: 120,
          width: 200,
          height: 140,
          color: '#FFFB8F',
          boardId: 'board-001',
          tags: [],
        });

        await useBoardStore.getState().addNote();

        expect(useBoardStore.getState().spawnIndex).toBe(1);
      });

      it('nextColorIndex가 증가한다', async () => {
        mockFetchSuccess({
          _id: 'saved-001',
          text: '새 노트',
          x: 120,
          y: 120,
          width: 200,
          height: 140,
          color: '#FFFB8F',
          boardId: 'board-001',
          tags: [],
        });

        await useBoardStore.getState().addNote();

        expect(useBoardStore.getState().nextColorIndex).toBe(1);
      });
    });

    describe('removeNote', () => {
      beforeEach(() => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001' }), createNote({ id: 'note-002' })],
          selectedNoteIds: ['note-001'],
        });
      });

      it('Optimistic Update로 즉시 제거된다', async () => {
        let resolveFetch: (value: unknown) => void;
        global.fetch = vi.fn().mockReturnValue(
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
        );

        const promise = useBoardStore.getState().removeNote('note-001');

        expect(useBoardStore.getState().notes).toHaveLength(1);
        expect(useBoardStore.getState().notes[0].id).toBe('note-002');

        resolveFetch!({ ok: true, json: () => Promise.resolve({}) });
        await promise;
      });

      it('삭제 후 selectedNoteIds에서 제거된다', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

        await useBoardStore.getState().removeNote('note-001');

        expect(useBoardStore.getState().selectedNoteIds).not.toContain('note-001');
      });

      it('성공 시 소켓으로 delete-note 이벤트를 emit한다', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

        await useBoardStore.getState().removeNote('note-001');

        expect(mockSocket.emit).toHaveBeenCalledWith('delete-note', {
          boardId: 'board-001',
          noteId: 'note-001',
        });
      });

      it('API 실패 시 원래 목록으로 롤백된다', async () => {
        mockFetchFailure();

        await useBoardStore.getState().removeNote('note-001');

        expect(useBoardStore.getState().notes).toHaveLength(2);
      });
    });

    describe('removeNotes (배치 삭제)', () => {
      beforeEach(() => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [
            createNote({ id: 'note-001' }),
            createNote({ id: 'note-002' }),
            createNote({ id: 'note-003' }),
          ],
          selectedNoteIds: ['note-001', 'note-002'],
        });
      });

      it('여러 노트를 한 번에 제거한다', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

        await useBoardStore.getState().removeNotes(['note-001', 'note-002']);

        expect(useBoardStore.getState().notes).toHaveLength(1);
        expect(useBoardStore.getState().notes[0].id).toBe('note-003');
      });

      it('API 실패 시 롤백된다', async () => {
        mockFetchFailure();

        await useBoardStore.getState().removeNotes(['note-001', 'note-002']);

        expect(useBoardStore.getState().notes).toHaveLength(3);
      });
    });

    describe('moveNote', () => {
      it('노트 위치를 업데이트한다', () => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001', x: 100, y: 100 })],
          sections: [],
        });

        useBoardStore.getState().moveNote('note-001', 200, 300);

        const note = useBoardStore.getState().notes[0];
        expect(note.x).toBe(200);
        expect(note.y).toBe(300);
      });

      it('소켓으로 update-note 이벤트를 emit한다', () => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001' })],
          sections: [],
        });

        useBoardStore.getState().moveNote('note-001', 200, 300);

        expect(mockSocket.emit).toHaveBeenCalledWith(
          'update-note',
          expect.objectContaining({ boardId: 'board-001' })
        );
      });

      it('노트 중심이 섹션 내부이면 sectionId가 설정된다', () => {
        const section = createSection({ id: 'sec-001', x: 0, y: 0, width: 500, height: 500 });
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001', width: 200, height: 140 })],
          sections: [section],
        });

        // 노트 중심 = (50 + 100, 50 + 70) = (150, 120) → 섹션 내부
        useBoardStore.getState().moveNote('note-001', 50, 50);

        expect(useBoardStore.getState().notes[0].sectionId).toBe('sec-001');
      });
    });

    describe('moveNotes (다중 이동)', () => {
      it('여러 노트를 delta만큼 이동한다', () => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [
            createNote({ id: 'note-001', x: 100, y: 100 }),
            createNote({ id: 'note-002', x: 200, y: 200 }),
          ],
        });

        useBoardStore.getState().moveNotes(['note-001', 'note-002'], 50, -30);

        const notes = useBoardStore.getState().notes;
        expect(notes[0].x).toBe(150);
        expect(notes[0].y).toBe(70);
        expect(notes[1].x).toBe(250);
        expect(notes[1].y).toBe(170);
      });
    });

    describe('updateNote', () => {
      it('노트 필드를 부분 업데이트한다', () => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001', text: '원래 텍스트' })],
        });

        useBoardStore.getState().updateNote('note-001', { text: '변경된 텍스트' });

        expect(useBoardStore.getState().notes[0].text).toBe('변경된 텍스트');
      });

      it('소켓으로 update-note 이벤트를 emit한다', () => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001' })],
        });

        useBoardStore.getState().updateNote('note-001', { color: '#FFD6E7' });

        expect(mockSocket.emit).toHaveBeenCalledWith(
          'update-note',
          expect.objectContaining({ boardId: 'board-001' })
        );
      });

      it('존재하지 않는 노트는 무시한다', () => {
        useBoardStore.setState({
          boardId: 'board-001',
          notes: [createNote({ id: 'note-001' })],
        });

        useBoardStore.getState().updateNote('non-existent', { text: 'test' });

        expect(useBoardStore.getState().notes).toHaveLength(1);
        expect(useBoardStore.getState().notes[0].text).toBe('테스트 노트');
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('선택 (Selection)', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useBoardStore.setState({
        boardId: 'board-001',
        currentUserId: 'user-001',
        notes: [createNote({ id: 'note-001' }), createNote({ id: 'note-002' })],
      });
    });

    it('selectNote로 단일 선택한다', () => {
      useBoardStore.getState().selectNote('note-001');
      expect(useBoardStore.getState().selectedNoteIds).toEqual(['note-001']);
    });

    it('selectNote(null)로 선택을 해제한다', () => {
      useBoardStore.setState({ selectedNoteIds: ['note-001'] });
      useBoardStore.getState().selectNote(null);
      expect(useBoardStore.getState().selectedNoteIds).toEqual([]);
    });

    it('multi=true로 다중 선택한다', () => {
      useBoardStore.setState({ selectedNoteIds: ['note-001'] });
      useBoardStore.getState().selectNote('note-002', true);
      expect(useBoardStore.getState().selectedNoteIds).toEqual(['note-001', 'note-002']);
    });

    it('multi=true로 이미 선택된 노트를 토글 해제한다', () => {
      useBoardStore.setState({ selectedNoteIds: ['note-001', 'note-002'] });
      useBoardStore.getState().selectNote('note-001', true);
      expect(useBoardStore.getState().selectedNoteIds).toEqual(['note-002']);
    });

    it('selectNotes로 여러 노트를 한 번에 선택한다', () => {
      useBoardStore.getState().selectNotes(['note-001', 'note-002']);
      expect(useBoardStore.getState().selectedNoteIds).toEqual(['note-001', 'note-002']);
    });

    it('선택 시 소켓으로 select-note 이벤트를 emit한다', () => {
      useBoardStore.getState().selectNote('note-001');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'select-note',
        expect.objectContaining({ boardId: 'board-001', noteIds: ['note-001'] })
      );
    });

    it('선택 해제 시 소켓으로 deselect-note 이벤트를 emit한다', () => {
      useBoardStore.setState({ selectedNoteIds: ['note-001'] });
      useBoardStore.getState().selectNote(null);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'deselect-note',
        expect.objectContaining({ boardId: 'board-001', userId: 'user-001' })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('섹션 CRUD', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useBoardStore.setState({ boardId: 'board-001' });
    });

    it('addSection으로 섹션을 추가한다', () => {
      const section = createSection({ id: 'sec-001' });
      useBoardStore.getState().addSection(section);
      expect(useBoardStore.getState().sections).toHaveLength(1);
      expect(useBoardStore.getState().sections[0].id).toBe('sec-001');
    });

    it('addSection 후 소켓으로 create-section 이벤트를 emit한다', () => {
      useBoardStore.getState().addSection(createSection());
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'create-section',
        expect.objectContaining({ boardId: 'board-001' })
      );
    });

    it('updateSection으로 섹션을 부분 업데이트한다', () => {
      useBoardStore.setState({ sections: [createSection({ id: 'sec-001', title: '원래 제목' })] });
      useBoardStore.getState().updateSection('sec-001', { title: '변경된 제목' });
      expect(useBoardStore.getState().sections[0].title).toBe('변경된 제목');
    });

    it('removeSection으로 섹션을 제거한다', () => {
      useBoardStore.setState({
        sections: [createSection({ id: 'sec-001' }), createSection({ id: 'sec-002' })],
      });
      useBoardStore.getState().removeSection('sec-001');
      expect(useBoardStore.getState().sections).toHaveLength(1);
      expect(useBoardStore.getState().sections[0].id).toBe('sec-002');
    });

    it('removeSection 후 소켓으로 delete-section 이벤트를 emit한다', () => {
      useBoardStore.setState({ sections: [createSection({ id: 'sec-001' })] });
      useBoardStore.getState().removeSection('sec-001');
      expect(mockSocket.emit).toHaveBeenCalledWith('delete-section', {
        boardId: 'board-001',
        sectionId: 'sec-001',
      });
    });

    it('moveSection으로 섹션과 내부 노트를 함께 이동한다', () => {
      const section = createSection({ id: 'sec-001', x: 100, y: 100, width: 500, height: 400 });
      const noteInSection = createNote({ id: 'note-001', x: 150, y: 150, sectionId: 'sec-001' });
      const noteOutside = createNote({ id: 'note-002', x: 800, y: 800, sectionId: null });

      useBoardStore.setState({ sections: [section], notes: [noteInSection, noteOutside] });
      useBoardStore.getState().moveSection('sec-001', 200, 200);

      const state = useBoardStore.getState();
      // 섹션이 (100,100) → (200,200)로 이동 = dx:100, dy:100
      expect(state.sections[0].x).toBe(200);
      expect(state.sections[0].y).toBe(200);
      // 섹션 내 노트도 같은 delta만큼 이동
      expect(state.notes[0].x).toBe(250);
      expect(state.notes[0].y).toBe(250);
      // 섹션 밖 노트는 영향 없음
      expect(state.notes[1].x).toBe(800);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('잠금 (Lock)', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useBoardStore.setState({ boardId: 'board-001' });
    });

    it('lockNote가 소켓으로 request-lock 이벤트를 emit한다', () => {
      useBoardStore.getState().lockNote('note-001', 'user-001');
      expect(mockSocket.emit).toHaveBeenCalledWith('request-lock', {
        boardId: 'board-001',
        id: 'note-001',
        type: 'note',
        userId: 'user-001',
      });
    });

    it('unlockNote가 소켓으로 release-lock 이벤트를 emit한다', () => {
      useBoardStore.getState().unlockNote('note-001');
      expect(mockSocket.emit).toHaveBeenCalledWith('release-lock', {
        boardId: 'board-001',
        id: 'note-001',
        type: 'note',
      });
    });

    it('lockSection이 소켓으로 request-lock 이벤트를 emit한다', () => {
      useBoardStore.getState().lockSection('sec-001', 'user-001');
      expect(mockSocket.emit).toHaveBeenCalledWith('request-lock', {
        boardId: 'board-001',
        id: 'sec-001',
        type: 'section',
        userId: 'user-001',
      });
    });

    it('unlockSection이 소켓으로 release-lock 이벤트를 emit한다', () => {
      useBoardStore.getState().unlockSection('sec-001');
      expect(mockSocket.emit).toHaveBeenCalledWith('release-lock', {
        boardId: 'board-001',
        id: 'sec-001',
        type: 'section',
      });
    });

    it('setNoteLock으로 잠금 정보를 설정한다', () => {
      useBoardStore
        .getState()
        .setNoteLock('note-001', { userId: 'user-002', socketId: 'sock-002' });
      expect(useBoardStore.getState().lockedNotes['note-001']).toEqual({
        userId: 'user-002',
        socketId: 'sock-002',
      });
    });

    it('setNoteLock(null)으로 잠금을 해제한다', () => {
      useBoardStore.setState({
        lockedNotes: { 'note-001': { userId: 'user-002', socketId: 'sock-002' } },
      });
      useBoardStore.getState().setNoteLock('note-001', null);
      expect(useBoardStore.getState().lockedNotes['note-001']).toBeUndefined();
    });

    it('boardId가 없으면 lock 이벤트를 emit하지 않는다', () => {
      useBoardStore.setState({ boardId: null });
      useBoardStore.getState().lockNote('note-001', 'user-001');
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('뷰 컨트롤', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('setZoom으로 줌 레벨을 변경한다', () => {
      useBoardStore.getState().setZoom(1.5);
      expect(useBoardStore.getState().zoom).toBe(1.5);
    });

    it('setPan으로 팬 위치를 변경한다', () => {
      useBoardStore.getState().setPan(100, -200);
      expect(useBoardStore.getState().pan).toEqual({ x: 100, y: -200 });
    });

    it('toggleSnap으로 스냅 모드를 토글한다', () => {
      expect(useBoardStore.getState().isSnapEnabled).toBe(false);
      useBoardStore.getState().toggleSnap();
      expect(useBoardStore.getState().isSnapEnabled).toBe(true);
      useBoardStore.getState().toggleSnap();
      expect(useBoardStore.getState().isSnapEnabled).toBe(false);
    });

    it('toggleSelectionMode로 선택 모드를 토글한다', () => {
      expect(useBoardStore.getState().isSelectionMode).toBe(false);
      useBoardStore.getState().toggleSelectionMode();
      expect(useBoardStore.getState().isSelectionMode).toBe(true);
    });

    it('setOpenPaletteNoteId로 팔레트 대상 노트를 설정한다', () => {
      useBoardStore.getState().setOpenPaletteNoteId('note-001');
      expect(useBoardStore.getState().openPaletteNoteId).toBe('note-001');
    });

    it('setActiveUsers로 활성 유저 목록을 설정한다', () => {
      const users = [{ _id: 'u1', nName: 'Alice' }];
      useBoardStore.getState().setActiveUsers(users);
      expect(useBoardStore.getState().activeUsers).toEqual(users);
    });

    it('fitToContent — 노트/섹션이 없으면 zoom=1, pan=(0,0)으로 리셋한다', () => {
      useBoardStore.setState({ zoom: 2, pan: { x: 100, y: 200 } });
      useBoardStore.getState().fitToContent(1000, 800);
      expect(useBoardStore.getState().zoom).toBe(1);
      expect(useBoardStore.getState().pan).toEqual({ x: 0, y: 0 });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Remote Actions (소켓 수신)', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('applyRemoteNoteCreation으로 원격 노트를 추가한다', () => {
      const note = createNote({ id: 'remote-001' });
      useBoardStore.getState().applyRemoteNoteCreation(note);
      expect(useBoardStore.getState().notes).toHaveLength(1);
      expect(useBoardStore.getState().notes[0].id).toBe('remote-001');
    });

    it('이미 존재하는 노트의 creation은 무시한다', () => {
      useBoardStore.setState({ notes: [createNote({ id: 'existing-001' })] });
      useBoardStore
        .getState()
        .applyRemoteNoteCreation(createNote({ id: 'existing-001', text: '중복' }));
      expect(useBoardStore.getState().notes).toHaveLength(1);
    });

    it('applyRemoteNoteUpdate로 원격 노트를 업데이트한다', () => {
      useBoardStore.setState({ notes: [createNote({ id: 'note-001', text: '원래 텍스트' })] });
      useBoardStore
        .getState()
        .applyRemoteNoteUpdate(createNote({ id: 'note-001', text: '원격 수정' }));
      expect(useBoardStore.getState().notes[0].text).toBe('원격 수정');
    });

    it('applyRemoteNoteDeletion으로 원격 노트를 삭제한다', () => {
      useBoardStore.setState({
        notes: [createNote({ id: 'note-001' }), createNote({ id: 'note-002' })],
      });
      useBoardStore.getState().applyRemoteNoteDeletion('note-001');
      expect(useBoardStore.getState().notes).toHaveLength(1);
      expect(useBoardStore.getState().notes[0].id).toBe('note-002');
    });

    it('applyRemoteSectionCreation으로 원격 섹션을 추가한다', () => {
      useBoardStore.getState().applyRemoteSectionCreation(createSection({ id: 'remote-sec-001' }));
      expect(useBoardStore.getState().sections).toHaveLength(1);
    });

    it('applyRemoteSectionUpdate로 원격 섹션을 업데이트한다', () => {
      useBoardStore.setState({ sections: [createSection({ id: 'sec-001', title: '원래' })] });
      useBoardStore
        .getState()
        .applyRemoteSectionUpdate(createSection({ id: 'sec-001', title: '변경' }));
      expect(useBoardStore.getState().sections[0].title).toBe('변경');
    });

    it('applyRemoteSectionDeletion으로 원격 섹션을 삭제한다', () => {
      useBoardStore.setState({ sections: [createSection({ id: 'sec-001' })] });
      useBoardStore.getState().applyRemoteSectionDeletion('sec-001');
      expect(useBoardStore.getState().sections).toHaveLength(0);
    });

    it('applyRemoteBoardSync로 전체 보드를 동기화한다', () => {
      const syncData = {
        notes: [createNote({ id: 'synced-001' })],
        sections: [createSection({ id: 'synced-sec-001' })],
      };
      useBoardStore.getState().applyRemoteBoardSync(syncData);
      expect(useBoardStore.getState().notes).toHaveLength(1);
      expect(useBoardStore.getState().sections).toHaveLength(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Undo/Redo', () => {
    // ───────────────────────────────────────────────────────────────────────────

    it('undo로 이전 상태로 되돌린다', () => {
      useBoardStore.setState({ boardId: 'board-001', notes: [] });
      // 히스토리 초기화
      useBoardStore.temporal.getState().clear();

      // 변경 1: 노트 추가 (히스토리에 기록)
      useBoardStore.setState({ notes: [createNote({ id: 'note-001', text: '첫 노트' })] });

      // 변경 2: 노트 텍스트 수정
      useBoardStore.setState({
        notes: [createNote({ id: 'note-001', text: '수정된 텍스트' })],
      });

      // Undo — 변경 2를 되돌림
      useBoardStore.getState().undo();

      expect(useBoardStore.getState().notes[0].text).toBe('첫 노트');
    });

    it('redo로 undo를 취소한다', () => {
      useBoardStore.setState({ boardId: 'board-001', notes: [] });
      useBoardStore.temporal.getState().clear();

      useBoardStore.setState({ notes: [createNote({ id: 'note-001', text: '첫 노트' })] });
      useBoardStore.setState({ notes: [createNote({ id: 'note-001', text: '수정됨' })] });

      useBoardStore.getState().undo();
      expect(useBoardStore.getState().notes[0].text).toBe('첫 노트');

      useBoardStore.getState().redo();
      expect(useBoardStore.getState().notes[0].text).toBe('수정됨');
    });

    it('undo 시 변경된 노트를 소켓으로 전송한다', () => {
      useBoardStore.setState({ boardId: 'board-001', notes: [] });
      useBoardStore.temporal.getState().clear();

      useBoardStore.setState({ notes: [createNote({ id: 'note-001' })] });
      useBoardStore.setState({ notes: [createNote({ id: 'note-001', text: '수정' })] });

      mockSocket.emit.mockClear();
      useBoardStore.getState().undo();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'update-note',
        expect.objectContaining({ boardId: 'board-001' })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('initSocket 이벤트 핸들러', () => {
    // ───────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      useBoardStore.setState({ boardId: 'board-001' });
    });

    it('join-board 이벤트를 emit한다', () => {
      useBoardStore.getState().initSocket();
      expect(mockSocket.emit).toHaveBeenCalledWith('join-board', 'board-001');
    });

    it('userInfo가 있으면 user-activity 이벤트를 emit한다', () => {
      const userInfo = { _id: 'u1', nName: 'Alice' };
      useBoardStore.getState().initSocket(userInfo);
      expect(mockSocket.emit).toHaveBeenCalledWith('user-activity', {
        boardId: 'board-001',
        user: userInfo,
      });
    });

    it('note-created 소켓 이벤트 핸들러를 등록한다', () => {
      useBoardStore.getState().initSocket();
      expect(mockSocket.on).toHaveBeenCalledWith('note-created', expect.any(Function));
    });

    it('note-updated 소켓 이벤트 핸들러를 등록한다', () => {
      useBoardStore.getState().initSocket();
      expect(mockSocket.on).toHaveBeenCalledWith('note-updated', expect.any(Function));
    });

    it('note-deleted 소켓 이벤트 핸들러를 등록한다', () => {
      useBoardStore.getState().initSocket();
      expect(mockSocket.on).toHaveBeenCalledWith('note-deleted', expect.any(Function));
    });

    it('note-locked 소켓 이벤트 수신 시 lockedNotes를 업데이트한다', () => {
      useBoardStore.getState().initSocket();
      emitFromServer('note-locked', { id: 'note-001', userId: 'user-002', socketId: 'sock-002' });
      expect(useBoardStore.getState().lockedNotes['note-001']).toEqual({
        userId: 'user-002',
        socketId: 'sock-002',
      });
    });

    it('note-unlocked 소켓 이벤트 수신 시 lockedNotes에서 제거한다', () => {
      useBoardStore.setState({
        lockedNotes: { 'note-001': { userId: 'user-002', socketId: 'sock-002' } },
      });
      useBoardStore.getState().initSocket();
      emitFromServer('note-unlocked', { id: 'note-001' });
      expect(useBoardStore.getState().lockedNotes['note-001']).toBeUndefined();
    });

    it('board-users-update 소켓 이벤트 수신 시 activeUsers를 업데이트한다', () => {
      useBoardStore.getState().initSocket();
      emitFromServer('board-users-update', [{ _id: 'u1', nName: 'Alice' }]);
      expect(useBoardStore.getState().activeUsers).toEqual([{ _id: 'u1', nName: 'Alice' }]);
    });

    it('boardId가 없으면 initSocket이 아무 동작도 하지 않는다', () => {
      useBoardStore.setState({ boardId: null });
      useBoardStore.getState().initSocket();
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
