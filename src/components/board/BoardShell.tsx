'use client';

import React from 'react';
import { useBoardStore } from '@/store/boardStore';
import NoteItem from '@/components/board/NoteItem';

type Props = {
  pid: number; // Project ID
};

const BoardShell: React.FC<Props> = ({ pid }) => {
  const {
    notes,
    zoom,
    addNote,
    selectedNoteId,
    removeNote,
    selectNote,
    setOpenPaletteNoteId,
    initBoard,
  } = useBoardStore((s) => ({
    notes: s.notes,
    zoom: s.zoom,
    addNote: s.addNote,
    selectedNoteId: s.selectedNoteId,
    removeNote: s.removeNote,
    selectNote: s.selectNote,
    setOpenPaletteNoteId: s.setOpenPaletteNoteId,
    initBoard: s.initBoard,
  }));
  const notesCount = notes.length;

  // 컴포넌트 마운트 시 서버에서 노트 데이터 불러오기
  React.useEffect(() => {
    if (pid) {
      initBoard(pid);
    }
  }, [pid, initBoard]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }
        if (selectedNoteId && !selectedNoteId.startsWith('temp-')) {
          removeNote(selectedNoteId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, removeNote]);

  const handleBackgroundClick = () => {
    selectNote(null);
    setOpenPaletteNoteId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Project Board: {pid}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Notes: {notesCount}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addNote();
            }}
            className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            새 노트 추가
          </button>
        </div>
      </header>

      <main
        className="relative flex-1 overflow-hidden"
        aria-label="화이트보드"
        onClick={handleBackgroundClick}
      >
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] pointer-events-none" />
        <div className="absolute inset-0 touch-none overscroll-contain">
          {notes.map((n) => (
            <NoteItem key={n.id} id={n.id} x={n.x} y={n.y} text={n.text} color={n.color} />
          ))}
        </div>
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              노트를 불러오는 중...
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BoardShell;
