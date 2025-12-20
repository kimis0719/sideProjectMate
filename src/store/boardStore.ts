import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { INote } from '@/lib/models/kanban/NoteModel';
import type { IBoard } from '@/lib/models/kanban/BoardModel';
import type { ISection } from '@/lib/models/kanban/SectionModel';
import { socketClient } from '@/lib/socket';

export type Note = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number; // width 추가
  height: number; // height 추가
  color: string;
  boardId: string;
  sectionId?: string | null;
  tags: string[];
  dueDate?: Date;
  assigneeId?: string;
  creatorId?: string; // Optional initially as legacy notes might not have it, but new ones will
  updaterId?: string;
};

export type Board = {
  id: string;
  title: string;
  owner: string;
};

export type Section = {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  boardId: string;
  color?: string;
  zIndex?: number;
};

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
const SEED_POS = { x: 120, y: 120 };
const OFFSET_STEP = 24;
const OFFSET_CYCLE = 8;

type BoardState = {
  boardId: string | null;
  notes: Note[];
  sections: Section[];
  zoom: number;
  pan: { x: number; y: number };
  selectedNoteIds: string[];
  openPaletteNoteId: string | null;
  spawnIndex: number;
  nextColorIndex: number;
  members: Array<{ _id: string; nName: string; email: string; position?: string; role: string }>; // 프로젝트 멤버 리스트
  alignmentGuides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[];
  lockedNotes: Record<string, { userId: string; socketId: string }>; // noteId -> lock info
  lockedSections: Record<string, { userId: string; socketId: string }>; // sectionId -> lock info

  // Actions
  initBoard: (pid: number) => Promise<void>;
  fetchMembers: (boardId: string) => Promise<void>;
  initSocket: () => void;
  addNote: (containerWidth?: number, containerHeight?: number) => Promise<void>;
  moveNote: (id: string, x: number, y: number) => void;
  moveNotes: (ids: string[], dx: number, dy: number) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  updateNotes: (updates: { id: string; changes: Partial<Note> }[]) => void;
  removeNote: (id: string) => Promise<void>;
  removeNotes: (ids: string[]) => Promise<void>;
  selectNote: (id: string | null, multi?: boolean) => void;
  selectNotes: (ids: string[]) => void;
  setOpenPaletteNoteId: (id: string | null) => void;
  duplicateNote: (id: string) => void;
  duplicateNotes: (ids: string[]) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  fitToContent: (containerWidth: number, containerHeight?: number) => void;
  setAlignmentGuides: (guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[]) => void;

  // Locking Actions
  lockNote: (noteId: string, userId: string) => void;
  unlockNote: (noteId: string) => void;
  lockSection: (sectionId: string, userId: string) => void;
  unlockSection: (sectionId: string) => void;
  setNoteLock: (noteId: string, info: { userId: string; socketId: string } | null) => void;

  // Section Actions
  addSection: (section: Section) => void;
  updateSection: (id: string, patch: Partial<Section>) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, x: number, y: number) => void;
};

const transformDoc = (doc: any) => {
  const { _id, ...rest } = JSON.parse(JSON.stringify(doc));
  return { id: _id || doc.id, ...rest }; // _id가 없으면 id 사용 (소켓 데이터 호환)
};

export const useBoardStore = create<BoardState>()(
  devtools(
    (set, get) => ({
      notes: [],
      sections: [],
      members: [],
      boardId: null,
      scale: 1,
      pan: { x: 0, y: 0 },
      zoom: 1,
      selectedNoteIds: [],
      openPaletteNoteId: null,
      spawnIndex: 0,
      nextColorIndex: 0,
      alignmentGuides: [],
      lockedNotes: {},
      lockedSections: {},

      initBoard: async (pid) => {
        set({ notes: [], sections: [], boardId: null, selectedNoteIds: [], members: [] });
        try {
          // 1. Board ID 조회 (by PID)
          const boardRes = await fetch(`/api/kanban/boards?pid=${pid}`);
          if (!boardRes.ok) throw new Error('Failed to fetch board');
          const boardDoc = await boardRes.json();
          const board = transformDoc(boardDoc);
          set({ boardId: board.id });

          // 2. 노트 조회
          const notesRes = await fetch(`/api/kanban/notes?boardId=${board.id}`);
          if (notesRes.ok) {
            const notes = await notesRes.json();
            const parsedNotes = notes.map((n: any) => ({
              ...n,
              id: n._id,
              tags: n.tags || [],
              dueDate: n.dueDate ? new Date(n.dueDate) : undefined,
              assigneeId: n.assigneeId || undefined,
              creatorId: n.creatorId,
              updaterId: n.updaterId
            }));
            set({ notes: parsedNotes });
          }

          // 3. 섹션 조회
          const sectionsRes = await fetch(`/api/kanban/sections?boardId=${board.id}`);
          if (sectionsRes.ok) {
            const sectionDocs = await sectionsRes.json();
            if (sectionDocs.success) {
              const sections = sectionDocs.data.map(transformDoc);
              set({ sections });
            }
          }

          // 4. 소켓 및 멤버 초기화
          get().initSocket();
          get().fetchMembers(board.id);

        } catch (error) {
          console.error(error);
          set({ notes: [], sections: [], boardId: null });
        }
      },

      fetchMembers: async (boardId) => {
        try {
          const res = await fetch(`/api/kanban/boards/${boardId}/members`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              set({ members: data.members });
            }
          }
        } catch (error) {
          console.error('Failed to fetch members:', error);
        }
      },

      initSocket: () => {
        const { boardId } = get();
        if (!boardId) return;

        const socket = socketClient.connect();
        socket.emit('join-board', boardId);

        // ... (socket listeners)
        socket.off('note-created');
        socket.on('note-created', (note: any) => {
          // 본인이 생성한 건 이미 optimistic update로 들어와있었을 수 있음 (temp ID)
          // 하지만 다른 사람이 생성한 건 새로 받아야 함.
          // 간단히: ID 중복 체크 후 추가
          const { notes } = get();
          // Fix: check both id and _id to match consistently
          if (!notes.find((n) => n.id === (note.id || note._id))) {
            set((state) => ({
              notes: [...state.notes, transformDoc(note)]
            }));
          }
        });

        socket.off('note-updated');
        socket.on('note-updated', (note: any) => {
          set((state) => ({
            // Fix: check both id and _id
            notes: state.notes.map((n) => n.id === (note.id || note._id) ? { ...n, ...transformDoc(note) } : n)
          }));
        });

        socket.off('note-deleted');
        socket.on('note-deleted', (noteId: string) => {
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== noteId)
          }));
        });

        // Locking Sockets
        socket.off('note-locked');
        socket.on('note-locked', (data: { id: string; userId: string; socketId: string }) => {
          set(state => ({
            lockedNotes: { ...state.lockedNotes, [data.id]: { userId: data.userId, socketId: data.socketId } }
          }));
        });

        socket.off('note-unlocked');
        socket.on('note-unlocked', (data: { id: string }) => {
          set(state => {
            const newLocked = { ...state.lockedNotes };
            delete newLocked[data.id];
            return { lockedNotes: newLocked };
          });
        });

        socket.off('section-locked');
        socket.on('section-locked', (data: { id: string; userId: string; socketId: string }) => {
          set(state => ({
            lockedSections: { ...state.lockedSections, [data.id]: { userId: data.userId, socketId: data.socketId } }
          }));
        });

        socket.off('section-unlocked');
        socket.on('section-unlocked', (data: { id: string }) => {
          set(state => {
            const newLocked = { ...state.lockedSections };
            delete newLocked[data.id];
            return { lockedSections: newLocked };
          });
        });
        // Sections Sockets
        socket.off('section-created');
        socket.on('section-created', (section: any) => {
          const { sections } = get();
          // 섹션 ID 정규화하여 중복 확인
          const newSection = transformDoc(section);
          if (!sections.find(s => s.id === newSection.id)) {
            set(state => ({ sections: [...state.sections, newSection] }));
          }
        });

        socket.off('section-updated');
        socket.on('section-updated', (section: any) => {
          const updatedSection = transformDoc(section);
          set(state => ({
            sections: state.sections.map(s => s.id === updatedSection.id ? { ...s, ...updatedSection } : s)
          }));
        });

        socket.off('section-deleted');
        socket.on('section-deleted', (sectionId: string) => {
          set(state => ({
            sections: state.sections.filter(s => s.id !== sectionId)
          }));
        });
      },

      addNote: async (containerWidth?: number, containerHeight?: number) => {
        const { spawnIndex, nextColorIndex, notes, boardId, sections, pan, zoom } = get();
        if (!boardId) return;

        let x = SEED_POS.x + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
        let y = SEED_POS.y + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;

        if (containerWidth && containerHeight) {
          // 화면 중앙 좌표를 'World 좌표'로 변환
          // pan은 'World -> Screen' 이동량이므로, Screen -> World 변환 시 빼줘야 함.
          // 공식: WorldX = (ScreenX - panX) / zoom
          const centerX = containerWidth / 2;
          const centerY = containerHeight / 2;

          x = (centerX - pan.x) / zoom - (OFFSET_STEP * 2); // 약간의 오프셋
          y = (centerY - pan.y) / zoom - (OFFSET_STEP * 2);

          // 스폰 오프셋 추가
          x += (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
          y += (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
        }

        const NOTE_W = 200;
        const NOTE_H = 140;
        const centerX = x + NOTE_W / 2;
        const centerY = y + NOTE_H / 2;

        const containingSection = sections.find(
          (s) =>
            centerX >= s.x &&
            centerX <= s.x + s.width &&
            centerY >= s.y &&
            centerY <= s.y + s.height
        );

        const optimisticNote: Omit<Note, 'id'> & { id: string | null } = {
          id: `temp-${crypto.randomUUID()}`,
          x,
          y,
          width: NOTE_W,
          height: NOTE_H,
          text: '새 노트',
          color: COLOR_PALETTE[nextColorIndex % COLOR_PALETTE.length],
          boardId: boardId as any,
          sectionId: containingSection ? (containingSection.id as any) : null,
          tags: [],
        };

        set((state) => ({
          notes: [...state.notes, optimisticNote as Note],
          spawnIndex: state.spawnIndex + 1,
          nextColorIndex: state.nextColorIndex + 1,
          selectedNoteIds: [optimisticNote.id!],
        }));

        try {
          const response = await fetch('/api/kanban/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...optimisticNote, boardId }),
          });
          if (!response.ok) throw new Error('Failed to save note');
          const savedNoteDoc = await response.json();
          const savedNote = transformDoc(savedNoteDoc);

          set((state) => ({
            notes: state.notes.map((n) => (n.id === optimisticNote.id ? savedNote : n)),
            selectedNoteIds: [savedNote.id],
          }));

          const socket = socketClient.connect();
          socket.emit('create-note', { boardId, note: savedNote });

        } catch (error) {
          console.error(error);
          set({ notes });
        }
      },

      removeNote: async (id) => {
        const { boardId } = get();
        const originalNotes = get().notes;
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          selectedNoteIds: state.selectedNoteIds.filter((sid) => sid !== id),
        }));

        try {
          const response = await fetch(`/api/kanban/notes/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete note');

          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('delete-note', { boardId, noteId: id });
          }
        } catch (error) {
          console.error(error);
          set({ notes: originalNotes });
        }
      },

      removeNotes: async (ids) => {
        const { boardId } = get();
        const originalNotes = get().notes;
        set((state) => ({
          notes: state.notes.filter((n) => !ids.includes(n.id)),
          selectedNoteIds: state.selectedNoteIds.filter((sid) => !ids.includes(sid)),
        }));

        try {
          const response = await fetch('/api/kanban/notes/batch-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noteIds: ids, boardId }),
          });
          if (!response.ok) throw new Error('Failed to batch delete notes');

          if (boardId) {
            const socket = socketClient.connect();
            ids.forEach(id => {
              socket.emit('delete-note', { boardId, noteId: id });
            });
          }
        } catch (error) {
          console.error(error);
          set({ notes: originalNotes });
        }
      },

      duplicateNote: (id) => {
        const { notes, boardId } = get();
        const targetNote = notes.find((n) => n.id === id);
        if (targetNote) {
          const newId = `temp-${crypto.randomUUID()}`;
          // 오프셋 적용하여 위치 설정
          const newNote: Note = {
            ...targetNote,
            id: newId,
            x: targetNote.x + 20,
            y: targetNote.y + 20,
            boardId,
            tags: [...targetNote.tags],
            dueDate: targetNote.dueDate,
            assigneeId: targetNote.assigneeId
          };

          // 1. Optimistic Update
          set((state) => ({
            notes: [...state.notes, newNote],
            selectedNoteIds: [newId]
          }));

          // 2. Server Sync
          fetch('/api/kanban/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newNote.text,
              x: newNote.x,
              y: newNote.y,
              color: newNote.color,
              width: newNote.width,
              height: newNote.height,
              boardId: newNote.boardId,
              sectionId: newNote.sectionId,
              tags: newNote.tags,
              dueDate: newNote.dueDate,
              assigneeId: newNote.assigneeId,
            }),
          })
            .then(res => res.json())
            .then(savedNote => {
              if (savedNote && !savedNote.error) {
                set(state => ({
                  notes: state.notes.map(n => n.id === newId ? { ...savedNote, id: savedNote._id } : n),
                  selectedNoteIds: [savedNote._id]
                }));
              }
            })
            .catch(console.error);
        }
      },

      duplicateNotes: (ids) => {
        // 로직상 복잡하므로 여기서는 빈 함수로 두거나, 위에서 구현한 내용 채워넣음.
        // 간소화를 위해 addNote 반복 호출로 대체하거나 추후 구현.
        // 일단 단축키 핸들러 연동을 위해 선언은 필수.
        const { duplicateNote } = get();
        ids.forEach(id => duplicateNote(id));
      },

      moveNote: (id, x, y) => set((state) => {
        const { boardId } = get();
        const targetNote = state.notes.find((n) => n.id === id);
        if (!targetNote) return state;

        const NOTE_W = targetNote.width || 200;
        const NOTE_H = targetNote.height || 140;
        const centerX = x + NOTE_W / 2;
        const centerY = y + NOTE_H / 2;

        const containingSection = state.sections.find(
          (s) =>
            centerX >= s.x &&
            centerX <= s.x + s.width &&
            centerY >= s.y &&
            centerY <= s.y + s.height
        );

        const updatedNote = { ...targetNote, x, y, sectionId: containingSection ? containingSection.id : null };

        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('update-note', { boardId, note: updatedNote });
        }

        return {
          notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
        };
      }),

      moveNotes: (ids, dx, dy) => set((state) => {
        const { boardId } = get();

        // 1. 변경될 노트들의 정보를 미리 계산 (위치 업데이트)
        const updatedNotes = state.notes
          .filter((n) => ids.includes(n.id))
          .map((n) => ({
            ...n,
            x: n.x + dx,
            y: n.y + dy,
            // (옵션) 다건 이동 시에도 섹션 위치 재계산이 필요하다면 여기에 로직 추가
            // sectionId: ... (moveNote의 section 찾기 로직 참고)
          }));

        // 2. 소켓으로 '변경된 노트 목록' 전송 (Batch)
        if (boardId && updatedNotes.length > 0) {
          const socket = socketClient.connect();
          // TODO :: 'update-notes' (복수형) 이벤트를 새로 정의하여 배열을 보냅니다.
          // socket.emit('update-notes', { boardId, notes: updatedNotes });
          updatedNotes.forEach(updatedNote => {
            socket.emit('update-note', { boardId, note: updatedNote });
          })
        }

        return {
          notes: state.notes.map((n) =>
            ids.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
          )
        }
      }),

      updateNote: (id, patch) => {
        const { boardId } = get();
        set((state) => {
          const targetNote = state.notes.find((n) => n.id === id);
          if (!targetNote) return state;
          const updatedNote = { ...targetNote, ...patch };

          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('update-note', { boardId, note: updatedNote });
          }

          return {
            notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
          };
        });
      },

      updateNotes: async (updates) => {
        const { boardId } = get();
        set((state) => {
          const newNotes = [...state.notes];
          updates.forEach(({ id, changes }) => {
            const idx = newNotes.findIndex((n) => n.id === id);
            if (idx !== -1) {
              newNotes[idx] = { ...newNotes[idx], ...changes };

              if (boardId) {
                const socket = socketClient.connect();
                socket.emit('update-note', { boardId, note: newNotes[idx] });
              }
            }
          });
          return { notes: newNotes };
        });

        try {
          const response = await fetch('/api/kanban/notes/batch', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates }),
          });
          if (!response.ok) throw new Error('Failed to batch update notes');
        } catch (error) {
          console.error(error);
        }
      },

      selectNote: (id, multi) =>
        set((state) => {
          if (!id) return { selectedNoteIds: [] };
          if (multi) {
            return {
              selectedNoteIds: state.selectedNoteIds.includes(id)
                ? state.selectedNoteIds.filter((sid) => sid !== id)
                : [...state.selectedNoteIds, id],
            };
          }
          return { selectedNoteIds: [id] };
        }),

      selectNotes: (ids) => set({ selectedNoteIds: ids }),

      setOpenPaletteNoteId: (id) => set({ openPaletteNoteId: id }),
      setZoom: (z) => set({ zoom: z }),
      setPan: (x, y) => set({ pan: { x, y } }),

      fitToContent: (containerWidth, containerHeight) => {
        const { notes, sections } = get();
        if (notes.length === 0 && sections.length === 0) {
          set({ zoom: 1, pan: { x: 0, y: 0 } });
          return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        notes.forEach((n) => {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + 200);
          maxY = Math.max(maxY, n.y + 140);
        });

        sections.forEach((s) => {
          minX = Math.min(minX, s.x);
          minY = Math.min(minY, s.y);
          maxX = Math.max(maxX, s.x + s.width);
          maxY = Math.max(maxY, s.y + s.height);
        });

        const PADDING = 100;
        const contentW = maxX - minX + PADDING * 2;
        const contentH = maxY - minY + PADDING * 2;

        const scaleX = containerWidth / contentW;
        const scaleY = containerHeight / contentH;
        let newZoom = Math.min(scaleX, scaleY);
        newZoom = Math.min(Math.max(newZoom, 0.1), 1.5);

        const contentCenterX = (minX + maxX) / 2;
        const contentCenterY = (minY + maxY) / 2;

        const newPanX = -contentCenterX * newZoom + containerWidth / 2;
        const newPanY = -contentCenterY * newZoom + containerHeight / 2;

        set({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
      },

      // alignmentGuides: [],
      setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),

      addSection: (section) => {
        const { boardId } = get();
        set((state) => ({ sections: [...state.sections, section] }));

        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('create-section', { boardId, section });
        }
      },

      updateSection: (id, patch) => {
        const { boardId } = get();
        set((state) => {
          const targetSection = state.sections.find(s => s.id === id);
          if (!targetSection) return state;
          const updatedSection = { ...targetSection, ...patch };

          if (boardId) {
            const socket = socketClient.connect();
            socket.emit('update-section', { boardId, section: updatedSection });
          }

          return {
            sections: state.sections.map((s) => (s.id === id ? updatedSection : s)),
          };
        });
      },

      removeSection: (id) => {
        const { boardId } = get();
        set((state) => ({ sections: state.sections.filter((s) => s.id !== id) }));

        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('delete-section', { boardId, sectionId: id });
        }
      },

      moveSection: (id, x, y) => {
        const { boardId } = get();
        set((state) => {
          const section = state.sections.find((s) => s.id === id);
          if (!section) return state;

          const dx = x - section.x;
          const dy = y - section.y;

          // 1. 섹션 이동
          const newSections = state.sections.map((s) => (s.id === id ? { ...s, x, y } : s));

          // 2. 하위 노트 이동 (sectionId가 일치하는 노트들)
          const newNotes = state.notes.map((n) => {
            if (n.sectionId?.toString() === id) {
              return { ...n, x: n.x + dx, y: n.y + dy };
            }
            return n;
          });

          if (boardId) {
            const socket = socketClient.connect();
            newSections.forEach(section => {
              socket.emit('update-section', { boardId, section });
            })
            newNotes.forEach(note => {
              socket.emit('update-note', { boardId, note });
            })
          }

          return { sections: newSections, notes: newNotes };
        });
      },

      lockNote: (noteId, userId) => {
        const { boardId } = get();
        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('request-lock', { boardId, id: noteId, type: 'note', userId });
        }
      },

      unlockNote: (noteId) => {
        const { boardId } = get();
        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('release-lock', { boardId, id: noteId, type: 'note' });
        }
      },

      lockSection: (sectionId, userId) => {
        const { boardId } = get();
        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('request-lock', { boardId, id: sectionId, type: 'section', userId });
        }
      },

      unlockSection: (sectionId) => {
        const { boardId } = get();
        if (boardId) {
          const socket = socketClient.connect();
          socket.emit('release-lock', { boardId, id: sectionId, type: 'section' });
        }
      },

      setNoteLock: (noteId, info) => {
        set(state => {
          const newLocked = { ...state.lockedNotes };
          if (info) {
            newLocked[noteId] = info;
          } else {
            delete newLocked[noteId];
          }
          return { lockedNotes: newLocked };
        });
      }
    })
  )
);
