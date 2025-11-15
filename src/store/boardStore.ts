'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type Note = {
  id: string;
  x: number;
  y: number;
  text: string;
  color?: string;
};

// 팔레트(순환 적용)
const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
// 생성 오프셋 규칙
const SEED_POS = { x: 120, y: 120 };
const OFFSET_STEP = 24;
const OFFSET_CYCLE = 8; // 8번마다 한 바퀴

type BoardState = {
  notes: Note[];
  zoom: number;
  pan: { x: number; y: number };

  // 내부 카운터(순환 인덱스)
  spawnIndex: number;
  nextColorIndex: number;

  // actions
  /*
  * Partial<Note> : Note의 모든 속성을 "있어도 되고 없어도 되는(optional)" 형태로 바꿈
  * 즉, { id?: string; x?: number; y?: number; text?: string; color?: string } 처럼 됨
  * undefined 가 와도 됨, 일부만 채워도 됨
  */
  addNote: (partial?: Partial<Note>) => void;
  addNoteAt: (x: number, y: number, partial?: Partial<Note>) => void;
  moveNote: (id: string, x: number, y: number) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
};

export const useBoardStore = create<BoardState>()(
  devtools(
    persist(
      (set, get) => ({
        notes: [],
        zoom: 1,
        pan: { x: 0, y: 0 },

        // 내부 카운터 초기값
        spawnIndex: 0,
        nextColorIndex: 0,

        // 연속 생성 시 겹침을 줄이기 위한 오프셋 + 색상 순환
        addNote: (partial = {}) =>
          set((state) => {
            const idx = state.spawnIndex;
            const offset = (idx % OFFSET_CYCLE) * OFFSET_STEP;

            const colorIdx = state.nextColorIndex % COLOR_PALETTE.length;
            const color = partial.color ?? COLOR_PALETTE[colorIdx];

            const x = partial.x ?? SEED_POS.x + offset;
            const y = partial.y ?? SEED_POS.y + offset;

            const id =
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);

            return {
              notes: state.notes.concat({
                id,
                x,
                y,
                text: partial.text ?? '새 노트',
                color,
              }),
              spawnIndex: state.spawnIndex + 1,
              nextColorIndex: state.nextColorIndex + 1,
            };
          }),

        // 지정 좌표에 생성(향후 보드 클릭 위치 생성 등에 사용)
        addNoteAt: (x, y, partial = {}) =>
          set((state) => {
            const colorIdx = state.nextColorIndex % COLOR_PALETTE.length;
            const color = partial.color ?? COLOR_PALETTE[colorIdx];

            const id =
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);

            return {
              notes: state.notes.concat({
                id,
                x,
                y,
                text: partial.text ?? '새 노트',
                color,
              }),
              // 좌표 지정 생성도 순환 인덱스를 한 칸 전진시킴
              spawnIndex: state.spawnIndex + 1,
              nextColorIndex: state.nextColorIndex + 1,
            };
          }),

        moveNote: (id, x, y) =>
          set((state) => ({
            notes: state.notes.map((n) => (n.id === id ? { ...n, x, y } : n)),
          })),

        updateNote: (id, patch) =>
          set((state) => ({
            notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
          })),

        removeNote: (id) =>
          set((state) => ({
            notes: state.notes.filter((n) => n.id !== id),
          })),

        setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(3, z)) }),
        setPan: (x, y) => set({ pan: { x, y } }),
      }),
      { name: 'board-store' }
    ),
    { name: 'BoardStore' }
  )
);
