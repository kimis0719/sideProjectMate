'use client';

import React from 'react';
import { useBoardStore, Note, Section } from '@/store/boardStore';

// 인박스 아이템 판별
const isInboxItem = (item: { x: number | null; y: number | null }) =>
  item.x === null && item.y === null;

// 시간 포맷 (상대 시간)
const formatRelativeTime = (date?: Date | string) => {
  if (!date) return '';
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

// 노트 컬러 → 좌측 바 컬러
const NOTE_BAR_COLORS: Record<string, string> = {
  '#fef9c3': '#FACC15', // yellow
  '#dcfce7': '#22C55E', // green
  '#fce7f3': '#F43F5E', // pink/rose
  '#dbeafe': '#3B82F6', // blue
  '#f3e8ff': '#A855F7', // purple
  '#FEF3C7': '#F59E0B', // amber
  // 기존 팔레트 호환
  '#FFFB8F': '#FACC15',
  '#B7F0AD': '#22C55E',
  '#FFD6E7': '#F43F5E',
  '#C7E9FF': '#3B82F6',
  '#E9D5FF': '#A855F7',
};

const getBarColor = (noteColor?: string) => NOTE_BAR_COLORS[noteColor || ''] || '#94A3B8';

// 섹션 border 컬러 매핑
const SECTION_BORDER_MAP: Record<string, string> = {
  '#93C5FD': 'border-blue-200 bg-blue-50/30',
  '#C4B5FD': 'border-purple-200 bg-purple-50/30',
  '#86EFAC': 'border-green-200 bg-green-50/30',
  '#FCA5A5': 'border-red-200 bg-red-50/30',
  '#FDBA74': 'border-orange-200 bg-orange-50/30',
  '#E5E7EB': 'border-zinc-200 bg-zinc-50/30',
};

const getSectionStyle = (color?: string) =>
  SECTION_BORDER_MAP[color || '#E5E7EB'] || 'border-zinc-200 bg-zinc-50/30';

// 섹션 타이틀 컬러 (진한 톤)
const TITLE_COLORS: Record<string, string> = {
  '#93C5FD': '#1D4ED8',
  '#C4B5FD': '#6D28D9',
  '#86EFAC': '#15803D',
  '#FCA5A5': '#B91C1C',
  '#FDBA74': '#C2410C',
  '#E5E7EB': '#374151',
};

const getSectionTitleColor = (color?: string) => TITLE_COLORS[color || '#E5E7EB'] || '#374151';

// --- 인박스 카드 ---
function InboxCard({ note }: { note: Note }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/inbox-note', JSON.stringify({ id: note.id, type: 'note' }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="relative bg-white rounded-lg p-3 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05),0_4px_6px_-2px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing hover:-translate-y-0.5 transition-transform"
    >
      {/* 좌측 컬러 바 */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: getBarColor(note.color) }}
      />
      {/* 제목 */}
      <div className="pl-3 text-xs text-zinc-700 font-medium leading-snug line-clamp-2">
        {note.text || '(빈 노트)'}
      </div>
      {/* 하단: 시간 + 드래그 인디케이터 */}
      <div className="flex items-center justify-between mt-2 pl-3">
        <span className="text-[9px] text-zinc-400">
          {formatRelativeTime((note as unknown as { createdAt?: Date }).createdAt)}
        </span>
        <span className="text-zinc-300 text-sm">⠿</span>
      </div>
    </div>
  );
}

// --- 메인 컴포넌트 ---
export default function InboxPanel() {
  const { notes, sections, inboxOpen, setInboxOpen, isDraggingNote } = useBoardStore((s) => ({
    notes: s.notes,
    sections: s.sections,
    inboxOpen: s.inboxOpen,
    setInboxOpen: s.setInboxOpen,
    isDraggingNote: s.isDraggingNote,
  }));

  const handleClose = () => setInboxOpen(false);

  // 인박스 노트/섹션 필터
  const inboxNotes = notes.filter((n) => isInboxItem(n));
  const inboxSections = sections.filter(
    (s) => isInboxItem(s) && (s.status || 'active') === 'active'
  );
  const inboxCount = inboxNotes.length + inboxSections.length;

  // 섹션별 노트 그룹핑
  const sectionNoteMap = new Map<string, Note[]>();
  const orphanNotes: Note[] = [];

  inboxNotes.forEach((note) => {
    if (note.sectionId) {
      const arr = sectionNoteMap.get(note.sectionId) || [];
      arr.push(note);
      sectionNoteMap.set(note.sectionId, arr);
    } else {
      orphanNotes.push(note);
    }
  });

  // --- 닫힌 상태 ---
  return (
    <div
      data-inbox-panel
      className={`fixed right-0 top-[128px] bottom-0 border-l z-30 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        isDraggingNote
          ? 'bg-blue-50 border-blue-300'
          : inboxOpen
            ? 'bg-white border-zinc-200'
            : 'bg-white border-zinc-200 cursor-pointer hover:bg-zinc-50'
      }`}
      style={{
        width: inboxOpen ? 280 : 56,
        boxShadow: isDraggingNote
          ? '-2px 0 12px rgba(59,130,246,0.15)'
          : '-2px 0 8px rgba(0,0,0,0.02)',
      }}
      onClick={!inboxOpen ? () => setInboxOpen(true) : undefined}
      onPointerDown={inboxOpen ? (e) => e.stopPropagation() : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        const canvasData = e.dataTransfer.getData('application/canvas-note');
        if (canvasData) {
          e.preventDefault();
          const { id: noteId } = JSON.parse(canvasData);
          const { updateNote, updateNotes } = useBoardStore.getState();
          updateNote(noteId, { x: null as unknown as number, y: null as unknown as number });
          updateNotes([{ id: noteId, changes: { x: null, y: null } as unknown as Partial<Note> }]);
        }
      }}
    >
      {/* 헤더 */}
      {/* === 닫힌 상태 콘텐츠 === */}
      {!inboxOpen && (
        <div className="flex flex-col items-center pt-4 gap-3 min-w-[56px]">
          <div className="relative flex flex-col items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            {inboxCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {inboxCount}
              </span>
            )}
          </div>
          <span
            className="text-[13px] font-black text-zinc-400 tracking-widest uppercase"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            INBOX
          </span>
          {isDraggingNote && (
            <div className="flex-1 flex items-center justify-center">
              <span
                className="text-[11px] font-bold text-blue-500 animate-pulse"
                style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
              >
                인박스로 이동
              </span>
            </div>
          )}
          <div className="mt-auto mb-4 text-zinc-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        </div>
      )}

      {/* === 펼친 상태 콘텐츠 === */}
      {inboxOpen && (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <span className="text-sm font-bold text-zinc-800">INBOX</span>
              <span className="text-xs text-zinc-400">{inboxCount} Items</span>
            </div>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {inboxCount === 0 && (
              <div className="text-center text-zinc-400 text-xs py-8">인박스가 비어있습니다</div>
            )}

            {/* 섹션 그룹 */}
            {inboxSections.map((section) => {
              const sectionNotes = sectionNoteMap.get(section.id) || [];
              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      'application/inbox-section',
                      JSON.stringify({ id: section.id })
                    );
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`p-3 rounded-xl border-2 border-dashed cursor-grab active:cursor-grabbing ${getSectionStyle(section.color)}`}
                >
                  {/* 섹션 헤더 */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: getSectionTitleColor(section.color) }}
                    >
                      {section.title}
                      <span className="ml-1 text-zinc-400 font-normal">
                        ({sectionNotes.length})
                      </span>
                    </span>
                  </div>
                  {/* 섹션 내 노트 */}
                  <div className="space-y-2">
                    {sectionNotes.map((note) => (
                      <InboxCard key={note.id} note={note} />
                    ))}
                    {sectionNotes.length === 0 && (
                      <div className="text-[10px] text-zinc-300 text-center py-2">노트 없음</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 고아 노트 (sectionId === null) */}
            {orphanNotes.length > 0 && (
              <div>
                {inboxSections.length > 0 && (
                  <div className="text-[10px] text-zinc-400 font-medium mb-2 px-1">미소속 노트</div>
                )}
                <div className="space-y-2">
                  {orphanNotes.map((note) => (
                    <InboxCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
