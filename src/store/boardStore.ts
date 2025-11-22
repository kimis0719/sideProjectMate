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
  selectedNoteIds: string[]; // 다중 선택을 위해 배열로 변경
  openPaletteNoteId: string | null;
  spawnIndex: number;
  nextColorIndex: number;

  initBoard: (pid: number) => Promise<void>;
  addNote: () => Promise<void>;
  moveNote: (id: string, x: number, y: number) => void;
  moveNotes: (ids: string[], dx: number, dy: number) => void; // 다중 이동 액션 추가
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void;
  updateNotes: (updates: { id: string; changes: Partial<Omit<Note, 'id'>> }[]) => Promise<void>; // 일괄 수정 액션 추가
  removeNote: (id: string) => Promise<void>;
  selectNote: (id: string | null, multi?: boolean) => void; // multi 옵션 추가
  selectNotes: (ids: string[]) => void; // 다중 선택 액션 추가
  setOpenPaletteNoteId: (id: string | null) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  fitToContent: (containerWidth: number, containerHeight: number) => void;
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
      selectedNoteIds: [], // 초기값 빈 배열
      openPaletteNoteId: null,
      spawnIndex: 0,
      nextColorIndex: 0,

      initBoard: async (pid) => {
        set({ notes: [], boardId: null, selectedNoteIds: [] }); // 초기화
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
          selectedNoteIds: [optimisticNote.id!], // 새 노트만 선택
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
            selectedNoteIds: [savedNote.id], // 저장 후에도 선택 유지
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
          selectedNoteIds: state.selectedNoteIds.filter((sid) => sid !== id), // 삭제된 노트 선택 해제
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

      // 다중 노트 이동: 선택된 노트들을 dx, dy만큼 이동시킵니다.
      moveNotes: (ids, dx, dy) => set((state) => ({
        notes: state.notes.map((n) =>
          ids.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
        ),
      })),

      updateNote: (id, patch) => set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      })),

      // 일괄 수정 액션
      updateNotes: async (updates) => {
        // 1. Optimistic Update (UI 즉시 반영)
        set((state) => {
          const newNotes = state.notes.map((n) => {
            const update = updates.find((u) => u.id === n.id);
            return update ? { ...n, ...update.changes } : n;
          });
          return { notes: newNotes };
        });

        // 2. Server Request
        try {
          const response = await fetch('/api/kanban/notes/batch', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates }),
          });
          if (!response.ok) throw new Error('Batch update failed');
        } catch (error) {
          console.error(error);
          // 실패 시 롤백 로직이 필요할 수 있음 (여기서는 생략)
        }
      },

      // 노트 선택: multi가 true면 토글, false면 단일 선택
      selectNote: (id, multi = false) => set((state) => {
        if (id === null) {
          return { selectedNoteIds: [], openPaletteNoteId: null };
        }

        if (multi) {
          // 이미 선택된 경우 해제, 아니면 추가
          const isSelected = state.selectedNoteIds.includes(id);
          const newSelectedIds = isSelected
            ? state.selectedNoteIds.filter((sid) => sid !== id)
            : [...state.selectedNoteIds, id];
          return { selectedNoteIds: newSelectedIds, openPaletteNoteId: null };
        } else {
          // 단일 선택: 해당 노트만 선택
          return { selectedNoteIds: [id], openPaletteNoteId: null };
        }
      }),

      // 다중 선택 (영역 선택용): 주어진 ids로 선택 목록을 교체
      selectNotes: (ids) => set({ selectedNoteIds: ids, openPaletteNoteId: null }),

      setOpenPaletteNoteId: (id) => set({ openPaletteNoteId: id }),
      setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(z, 2)) }), // 10% ~ 200% 제한
      setPan: (x, y) => set({ pan: { x, y } }),

      fitToContent: (containerWidth: number, containerHeight: number) => {
        const { notes } = get();
        if (notes.length === 0) {
          // 노트가 없으면 (0,0) 및 줌 100%로 리셋
          set({ pan: { x: 0, y: 0 }, zoom: 1 });
          return;
        }

        // 노트 크기 (NoteItem.tsx 참조)
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;
        const PADDING = 50; // 여백

        // Bounding Box 계산
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        notes.forEach((n) => {
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x + NOTE_WIDTH > maxX) maxX = n.x + NOTE_WIDTH;
          if (n.y + NOTE_HEIGHT > maxY) maxY = n.y + NOTE_HEIGHT;
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // 화면 중앙점
        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;

        // 적절한 줌 레벨 계산 (여백 포함)
        const zoomX = (containerWidth - PADDING * 2) / contentWidth;
        const zoomY = (containerHeight - PADDING * 2) / contentHeight;
        let newZoom = Math.min(zoomX, zoomY);

        // 줌 레벨 제한 (10% ~ 150%) - 너무 크게 확대되는 것 방지
        newZoom = Math.max(0.1, Math.min(newZoom, 1.5));

        // Pan 계산: (화면중앙 - 콘텐츠중앙 * 줌)
        // 화면의 중앙 좌표: containerWidth / 2, containerHeight / 2
        // 콘텐츠의 중앙이 화면 중앙에 오도록 하려면:
        // panX = (containerWidth / 2) - (contentCenterX * newZoom)
        const newPanX = containerWidth / 2 - contentCenterX * newZoom;
        const newPanY = containerHeight / 2 - contentCenterY * newZoom;

        set({ zoom: newZoom, pan: { x: newPanX, y: newPanY } });
      },
    }),
    { name: 'board-store' }
  )
);
