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
  initBoard: (pid: number) => Promise<void>;
  initSocket: () => void;
  addNote: (containerWidth?: number, containerHeight?: number) => Promise<void>;
  moveNote: (id: string, x: number, y: number) => void;
  moveNotes: (ids: string[], dx: number, dy: number) => void;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void;
  updateNotes: (updates: { id: string; changes: Partial<Omit<Note, 'id'>> }[]) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  removeNotes: (ids: string[]) => Promise<void>;
  selectNote: (id: string | null, multi?: boolean) => void;
  selectNotes: (ids: string[]) => void;
  setOpenPaletteNoteId: (id: string | null) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  fitToContent: (containerWidth: number, containerHeight: number) => void;
  alignmentGuides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[];
  setAlignmentGuides: (guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[]) => void;

  // Section Actions
  addSection: (section: Section) => void;
  updateSection: (id: string, patch: Partial<Omit<Section, 'id'>>) => void;
  removeSection: (id: string) => void;
  moveSection: (id: string, x: number, y: number) => void;
};

const transformDoc = (doc: any) => {
  const { _id, ...rest } = JSON.parse(JSON.stringify(doc));
  return { id: _id, ...rest };
};

export const useBoardStore = create<BoardState>()(
  devtools(
    (set, get) => ({
      boardId: null,
      notes: [],
      sections: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedNoteIds: [],
      openPaletteNoteId: null,
      spawnIndex: 0,
      nextColorIndex: 0,
      alignmentGuides: [],

      initBoard: async (pid) => {
        set({ notes: [], sections: [], boardId: null, selectedNoteIds: [] });
        try {
          const boardRes = await fetch(`/api/kanban/boards?pid=${pid}`);
          if (!boardRes.ok) throw new Error('Failed to fetch board');
          const boardDoc = await boardRes.json();
          const board = transformDoc(boardDoc);
          set({ boardId: board.id });

          const [notesRes, sectionsRes] = await Promise.all([
            fetch(`/api/kanban/notes?boardId=${board.id}`),
            fetch(`/api/kanban/sections?boardId=${board.id}`),
          ]);

          if (!notesRes.ok) throw new Error('Failed to fetch notes');
          const noteDocs = await notesRes.json();
          const notes = noteDocs.map(transformDoc);

          let sections: Section[] = [];
          if (sectionsRes.ok) {
            const sectionDocs = await sectionsRes.json();
            if (sectionDocs.success) {
              sections = sectionDocs.data.map(transformDoc);
            }
          }

          set({ notes, sections });
          get().initSocket();
        } catch (error) {
          console.error(error);
          set({ notes: [], sections: [], boardId: null });
        }
      },

      initSocket: () => {
        const { boardId } = get();
        if (!boardId) return;

        const socket = socketClient.connect();

        socket.emit('join-board', boardId.toString());

        socket.off('note-updated');
        socket.on('note-updated', (updatedNote: Note) => {
          set((state) => ({
            notes: state.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
          }));
        });

        socket.off('note-created');
        socket.on('note-created', (newNote: Note) => {
          set((state) => ({
            notes: [...state.notes, newNote],
          }));
        });

        socket.off('note-deleted');
        socket.on('note-deleted', (noteId: string) => {
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== noteId),
          }));
        });

        socket.off('section-updated');
        socket.on('section-updated', (updatedSection: Section) => {
          set((state) => ({
            sections: state.sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)),
          }));
        });

        socket.off('section-created');
        socket.on('section-created', (newSection: Section) => {
          set((state) => ({
            sections: [...state.sections, newSection],
          }));
        });

        socket.off('section-deleted');
        socket.on('section-deleted', (sectionId: string) => {
          set((state) => ({
            sections: state.sections.filter((s) => s.id !== sectionId),
          }));
        });
      },

      addNote: async (containerWidth?: number, containerHeight?: number) => {
        const { spawnIndex, nextColorIndex, notes, boardId, sections, pan, zoom } = get();
        if (!boardId) return;

        let x = SEED_POS.x + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
        let y = SEED_POS.y + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;

        if (containerWidth && containerHeight) {
          x = (pan.x) / zoom + (containerWidth / 2 - SEED_POS.x) + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
          y = (pan.y) / zoom + (containerHeight / 2 - SEED_POS.y) + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP;
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

      removeNotes: async (ids: string[]) => {
        const { boardId } = get();
        const originalNotes = get().notes;
        set((state) => ({
          notes: state.notes.filter((n) => !ids.includes(n.id)),
          selectedNoteIds: state.selectedNoteIds.filter((sid) => !ids.includes(sid)),
        }));

        try {
          const response = await fetch('/api/kanban/notes/batch', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
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
    })
  )
);
