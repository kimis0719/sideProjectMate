import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { INote } from '@/lib/models/kanban/NoteModel';
import type { IBoard } from '@/lib/models/kanban/BoardModel';
import type { ISection } from '@/lib/models/kanban/SectionModel';

export type Note = Omit<INote, '_id' | 'createdAt' | 'updatedAt'> & { id: string };
export type Board = Omit<IBoard, '_id' | 'createdAt' | 'updatedAt'> & { id: string };
export type Section = Omit<ISection, '_id' | 'createdAt' | 'updatedAt'> & { id: string };

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
        } catch (error) {
          console.error(error);
          set({ notes: [], sections: [], boardId: null });
        }
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
        } catch (error) {
          console.error(error);
          set({ notes });
        }
      },

      removeNote: async (id) => {
        const originalNotes = get().notes;
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          selectedNoteIds: state.selectedNoteIds.filter((sid) => sid !== id),
        }));

        try {
          const response = await fetch(`/api/kanban/notes/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete note');
        } catch (error) {
          console.error(error);
          set({ notes: originalNotes });
        }
      },

      removeNotes: async (ids: string[]) => {
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
        } catch (error) {
          console.error(error);
          set({ notes: originalNotes });
        }
      },

      moveNote: (id, x, y) => set((state) => {
        // 섹션 포함 여부 확인
        const NOTE_W = 200;
        const NOTE_H = 140;
        const centerX = x + NOTE_W / 2;
        const centerY = y + NOTE_H / 2;

        const containingSection = state.sections.find(
          (s) =>
            centerX >= s.x &&
            centerX <= s.x + s.width &&
            centerY >= s.y &&
            centerY <= s.y + s.height
        );

        const newSectionId = containingSection ? containingSection.id : null;

        return {
          notes: state.notes.map((n) => (n.id === id ? { ...n, x, y, sectionId: newSectionId as any } : n)),
        };
      }),

      moveNotes: (ids, dx, dy) => set((state) => ({
        notes: state.notes.map((n) =>
          ids.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
        ),
      })),

      updateNote: (id, patch) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      })),

      updateNotes: async (updates) => {
        set((state) => {
          const newNotes = [...state.notes];
          updates.forEach(({ id, changes }) => {
            const idx = newNotes.findIndex((n) => n.id === id);
            if (idx !== -1) {
              newNotes[idx] = { ...newNotes[idx], ...changes };
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

      selectNote: (id, multi = false) => set((state) => {
        if (id === null) return { selectedNoteIds: [] };
        if (multi) {
          const isSelected = state.selectedNoteIds.includes(id);
          return {
            selectedNoteIds: isSelected
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
        const { notes } = get();
        const { sections } = get();
        if (notes.length === 0 || sections.length === 0) return;

        const PADDING = 50;
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        sections.forEach((s) => {
          minX = Math.min(minX, s.x);
          minY = Math.min(minY, s.y);
          maxX = Math.max(maxX, s.x + s.width);
          maxY = Math.max(maxY, s.y + s.height);
        });

        notes.forEach((n) => {
          minX = Math.min(minX, n.x);
          minY = Math.min(minY, n.y);
          maxX = Math.max(maxX, n.x + NOTE_WIDTH);
          maxY = Math.max(maxY, n.y + NOTE_HEIGHT);
        });

        const contentWidth = maxX - minX + PADDING * 2;
        const contentHeight = maxY - minY + PADDING * 2;

        const scaleX = containerWidth / contentWidth;
        const scaleY = containerHeight / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, 1);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const newPanX = containerWidth / 2 - centerX * newZoom;
        const newPanY = containerHeight / 2 - centerY * newZoom;

        set({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
      },

      alignmentGuides: [],
      setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),

      // --- Section Actions ---
      addSection: (section) => set((state) => ({
        sections: [...state.sections, section],
      })),

      updateSection: (id, patch) => set((state) => ({
        sections: state.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      })),

      removeSection: (id) => set((state) => ({
        sections: state.sections.filter((s) => s.id !== id),
      })),

      moveSection: (id, x, y) => set((state) => {
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

        return { sections: newSections, notes: newNotes };
      }),
    })
  )
);
