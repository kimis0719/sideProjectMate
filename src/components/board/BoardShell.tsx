'use client';

import React from 'react';
import { useBoardStore } from '@/store/boardStore';
import NoteItem from '@/components/board/NoteItem';

type Props = {
  boardId?: string;
};

const BoardShell: React.FC<Props> = ({ boardId }) => {
  const notes = useBoardStore((s) => s.notes);
  const notesCount = notes.length;
  const zoom = useBoardStore((s) => s.zoom);
  const addNote = useBoardStore((s) => s.addNote);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {boardId ? `Board: ${boardId}` : 'Board'}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Notes: {notesCount}</span>
          <button
            onClick={() => addNote()}
            className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            새 노트 추가
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden" aria-label="화이트보드">
        {/* 배경 점자 그리드 */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />

        {/* 콘텐츠 레이어(노트 렌더링) */}
        <div className="absolute inset-0 touch-none overscroll-contain">
          {notes.map((n) => (
            <NoteItem key={n.id} id={n.id} x={n.x} y={n.y} text={n.text} color={n.color} />
          ))}
        </div>

        {/* 안내 문구(노트가 없을 때만 표시) */}
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              빈 보드입니다. "새 노트 추가"로 시작하세요.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BoardShell;
