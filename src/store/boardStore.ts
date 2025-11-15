'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { INote } from '@/lib/models/kanban/NoteModel';
import type { IBoard } from '@/lib/models/kanban/BoardModel';

export type Note = Omit<INote, '_id' | 'createdAt' | 'updatedAt'> & { id: string };
export type Board = Omit<IBoard, '_id' | 'createdAt' | 'updatedAt'> & { id: string };

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
const SEED_POS = { x: 120, y: 120 };
const OFFSET_STEP = 24;
const OFFSET_CYCLE = 8;

type BoardState = {
  boardId: string | null;
  notes: Note[];
  zoom: number;
  pan: { x: number; y: number };
  selectedNoteId: string | null;
  openPaletteNoteId: string | null;
  spawnIndex: number;
  nextColorIndex: number;

  initBoard: (pid: number) => Promise<void>;
  addNote: () => Promise<void>;
  moveNote: (id: string, x: number, y: number) => void;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void;
  removeNote: (id: string) => Promise<void>;
  selectNote: (id: string | null) => void;
  setOpenPaletteNoteId: (id: string | null) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
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
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedNoteId: null,
      openPaletteNoteId: null,
      spawnIndex: 0,
      nextColorIndex: 0,

      initBoard: async (pid) => {
        set({ notes: [], boardId: null }); // 초기화
        try {
          // 1. pid로 보드 정보 가져오기
          const boardRes = await fetch(`/api/kanban/boards?pid=${pid}`);
          if (!boardRes.ok) throw new Error('Failed to fetch board');
          const boardDoc = await boardRes.json();
          const board = transformDoc(boardDoc);
          set({ boardId: board.id });

          // 2. 가져온 boardId로 노트 목록 가져오기
          const notesRes = await fetch(`/api/kanban/notes?boardId=${board.id}`);
          if (!notesRes.ok) throw new Error('Failed to fetch notes');
          const noteDocs = await notesRes.json();
          const notes = noteDocs.map(transformDoc);

          set({ notes });
        } catch (error) {
          console.error(error);
          set({ notes: [], boardId: null });
        }
      },

      addNote: async () => {
        const { spawnIndex, nextColorIndex, notes, boardId } = get();
        if (!boardId) return;

        const optimisticNote: Omit<Note, 'id'> & { id: string | null } = {
          id: `temp-${crypto.randomUUID()}`,
          x: SEED_POS.x + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP,
          y: SEED_POS.y + (spawnIndex % OFFSET_CYCLE) * OFFSET_STEP,
          text: '새 노트',
          color: COLOR_PALETTE[nextColorIndex % COLOR_PALETTE.length],
          boardId: boardId as any,
        };

        set((state) => ({
          notes: [...state.notes, optimisticNote as Note],
          spawnIndex: state.spawnIndex + 1,
          nextColorIndex: state.nextColorIndex + 1,
          selectedNoteId: optimisticNote.id,
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
            selectedNoteId: savedNote.id,
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
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        }));

        try {
          const response = await fetch(`/api/kanban/notes/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete note');
        } catch (error) {
          console.error(error);
          set({ notes: originalNotes });
        }
      },

      moveNote: (id, x, y) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      })),

      updateNote: (id, patch) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      })),

      selectNote: (id) => set((state) => ({
        selectedNoteId: id,
        openPaletteNoteId: state.selectedNoteId !== id ? null : state.openPaletteNoteId,
      })),

      setOpenPaletteNoteId: (id) => set({ openPaletteNoteId: id }),
      setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(3, z)) }),
      setPan: (x, y) => set({ pan: { x, y } }),
    }),
    { name: 'BoardStore' }
  )
);
