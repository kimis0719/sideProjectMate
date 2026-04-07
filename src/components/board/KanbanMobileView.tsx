'use client';

import React from 'react';
import { useBoardStore, Note, Section } from '@/store/boardStore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useModal } from '@/hooks/useModal';
import { socketClient } from '@/lib/socket';
import { useToastStore } from '@/components/common/Toast';

// 인박스 판별
const isInboxItem = (item: { x: number | null; y: number | null }) =>
  item.x === null && item.y === null;

// 노트 컬러 → 좌측 바
const BAR_COLORS: Record<string, string> = {
  '#fef9c3': '#FACC15',
  '#dcfce7': '#22C55E',
  '#fce7f3': '#F43F5E',
  '#dbeafe': '#3B82F6',
  '#f3e8ff': '#A855F7',
  '#FEF3C7': '#F59E0B',
  '#FFFB8F': '#FACC15',
  '#B7F0AD': '#22C55E',
  '#FFD6E7': '#F43F5E',
  '#C7E9FF': '#3B82F6',
  '#E9D5FF': '#A855F7',
};
const getBarColor = (c?: string) => BAR_COLORS[c || ''] || '#94A3B8';

type Props = { pid: number };

// ─── 노트 카드 ───
function MobileNoteCard({
  note,
  isDone,
  onTap,
  onComplete,
}: {
  note: Note;
  isDone?: boolean;
  onTap: () => void;
  onComplete?: () => void;
}) {
  return (
    <div
      onClick={onTap}
      className={`relative bg-surface-container-lowest rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform ${isDone ? 'opacity-70' : ''}`}
    >
      {/* 좌측 컬러바 */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        style={{ backgroundColor: getBarColor(note.color) }}
      />
      <div className="flex items-start gap-3 pl-3">
        {/* 체크박스 */}
        {onComplete && !isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="mt-0.5 w-5 h-5 rounded-md border-2 border-outline-variant flex-shrink-0"
          />
        )}
        {isDone && (
          <div className="mt-0.5 w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
            ✓
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            className={`text-[15px] font-medium leading-snug ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}
          >
            {note.text || '(빈 노트)'}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {isDone && note.completedAt && (
              <span className="text-[11px] text-slate-400">
                {`${new Date(note.completedAt).getFullYear()}.${String(new Date(note.completedAt).getMonth() + 1).padStart(2, '0')}.${String(new Date(note.completedAt).getDate()).padStart(2, '0')} 완료`}
              </span>
            )}
            {note.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 섹션 아코디언 ───
function MobileSectionAccordion({
  section,
  notes,
  isDone,
  onNoteComplete,
  onNoteTap,
  onSectionComplete,
  onSectionRevert,
}: {
  section: Section;
  notes: Note[];
  isDone?: boolean;
  onNoteComplete?: (noteId: string) => void;
  onNoteTap: (noteId: string) => void;
  onSectionRevert?: () => void;
  onSectionComplete?: () => void;
}) {
  const [expanded, setExpanded] = React.useState(!isDone);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(section.title);
  const { updateSection, updateNotes: _un } = useBoardStore((s) => ({
    updateSection: s.updateSection,
    updateNotes: s.updateNotes,
  }));

  const saveTitle = () => {
    if (titleDraft.trim() && titleDraft !== section.title) {
      updateSection(section.id, { title: titleDraft.trim() });
    } else {
      setTitleDraft(section.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <div>
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 py-2.5 px-1">
        <button onClick={() => setExpanded(!expanded)} className="text-slate-500">
          {expanded ? '▾' : '▸'}
        </button>
        {onSectionComplete && !isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSectionComplete();
            }}
            className="w-5 h-5 rounded-md border-2 border-outline-variant flex-shrink-0"
          />
        )}
        {isDone && (
          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
            ✓
          </div>
        )}
        {!isDone && isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
            }}
            className="flex-1 text-[15px] font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <span
            className={`text-[15px] font-bold flex-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}
            onClick={() => {
              if (!isDone) setIsEditingTitle(true);
            }}
          >
            {section.title}
          </span>
        )}
        <span className="text-xs text-slate-400">({notes.length})</span>
        {isDone && onSectionRevert && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSectionRevert();
            }}
            className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md"
          >
            ↩️ 되돌리기
          </button>
        )}
      </div>

      {/* 노트 리스트 */}
      {expanded && (
        <div className="space-y-2 pl-2 pb-2">
          {notes.map((note) => (
            <MobileNoteCard
              key={note.id}
              note={note}
              isDone={isDone}
              onTap={() => onNoteTap(note.id)}
              onComplete={onNoteComplete ? () => onNoteComplete(note.id) : undefined}
            />
          ))}
          {notes.length === 0 && (
            <div className="text-[11px] text-slate-300 text-center py-3">노트 없음</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 바텀시트 ───
function NoteBottomSheet({
  note,
  onClose,
  isDone,
}: {
  note: Note | null;
  onClose: () => void;
  isDone?: boolean;
}) {
  const { revertNote, updateNote, updateNotes } = useBoardStore((s) => ({
    revertNote: s.revertNote,
    updateNote: s.updateNote,
    updateNotes: s.updateNotes,
  }));
  const [draft, setDraft] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (note) setDraft(note.text || '');
    setIsEditing(false);
  }, [note]);

  if (!note) return null;

  const saveEdit = () => {
    if (draft !== note.text) {
      updateNote(note.id, { text: draft });
      updateNotes([{ id: note.id, changes: { text: draft } }]);
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full bg-white rounded-t-2xl p-5 pb-8 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

        {/* 제목 영역 — 편집 가능 */}
        {!isDone && isEditing ? (
          <div className="mb-3">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveEdit}
              className="w-full text-lg font-bold text-slate-900 border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        ) : (
          <h3
            className={`text-lg font-bold mb-2 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}
            onClick={() => {
              if (!isDone) setIsEditing(true);
            }}
          >
            {note.text || '(빈 노트)'}
            {!isDone && <span className="text-xs text-slate-300 ml-2">탭하여 편집</span>}
          </h3>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {isDone && note.completedAt && (
          <div className="text-sm text-slate-400 mb-3">
            {`${new Date(note.completedAt).getFullYear()}.${String(new Date(note.completedAt).getMonth() + 1).padStart(2, '0')}.${String(new Date(note.completedAt).getDate()).padStart(2, '0')} 완료`}
          </div>
        )}
        {isDone && (
          <button
            onClick={() => {
              revertNote(note.id);
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm"
          >
            ↩️ 되돌리기
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 메인 모바일 뷰 ───
export default function KanbanMobileView({ pid }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const { confirm } = useModal();
  const {
    notes,
    sections,
    completedNotes,
    completedNotesLoaded,
    viewMode,
    setViewMode,
    boardId,
    initBoard,
    fetchCompletedNotes,
    completeNote,
    completeSection,
    addNote,
    addSection,
    setCurrentUserId,
    activeUsers,
    initSocket,
    revertSection,
  } = useBoardStore((s) => ({
    notes: s.notes,
    sections: s.sections,
    completedNotes: s.completedNotes,
    completedNotesLoaded: s.completedNotesLoaded,
    viewMode: s.viewMode,
    setViewMode: s.setViewMode,
    boardId: s.boardId,
    initBoard: s.initBoard,
    fetchCompletedNotes: s.fetchCompletedNotes,
    completeNote: s.completeNote,
    completeSection: s.completeSection,
    revertSection: s.revertSection,
    addNote: s.addNote,
    addSection: s.addSection,
    setCurrentUserId: s.setCurrentUserId,
    activeUsers: s.activeUsers,
    initSocket: s.initSocket,
  }));

  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // 초기화
  React.useEffect(() => {
    initBoard(pid);
  }, [pid, initBoard]);

  React.useEffect(() => {
    if (session?.user?.id) setCurrentUserId(session.user.id);
  }, [session, setCurrentUserId]);

  // 소켓 접속 (접속자 정보 수신) + cleanup
  React.useEffect(() => {
    if (boardId && session?.user) {
      initSocket({
        _id: session.user.id,
        nName: session.user.name || 'Unknown',
        avatarUrl: session.user.image || undefined,
      });
      return () => {
        socketClient.socket?.emit('leave-board', { boardId, userId: session.user.id });
      };
    }
  }, [boardId, session, initSocket]);

  const handleTabSwitch = (mode: 'active' | 'done') => {
    setViewMode(mode);
    if (mode === 'done' && !completedNotesLoaded && boardId) {
      fetchCompletedNotes(boardId);
    }
  };

  // 데이터 분류
  const activeNotes = viewMode === 'active' ? notes : completedNotes;
  const activeSections = sections.filter((s) =>
    viewMode === 'active' ? (s.status || 'active') === 'active' : (s.status || 'active') === 'done'
  );

  const inboxSections = activeSections.filter((s) => isInboxItem(s));
  const canvasSections = activeSections.filter((s) => !isInboxItem(s));

  const inboxNotes = activeNotes.filter((n) => isInboxItem(n));
  const canvasNotes = activeNotes.filter((n) => !isInboxItem(n));

  // 섹션별 노트 그룹핑
  const getNotesBySection = (sectionId: string) =>
    [...inboxNotes, ...canvasNotes].filter((n) => n.sectionId === sectionId);

  // 미소속 노트 (캔버스 + 인박스 중 sectionId 없는 것)
  const orphanCanvasNotes = canvasNotes.filter((n) => !n.sectionId);

  const inboxOrphanNotes = inboxNotes.filter((n) => !n.sectionId);
  const inboxCount = inboxNotes.length + inboxSections.length;

  // 섹션 일괄 완료
  const handleSectionComplete = async (sectionId: string, sectionTitle: string) => {
    const ok = await confirm(
      '섹션 일괄 완료',
      `"${sectionTitle}" 섹션의 노트를 모두 완료 처리하시겠습니까?`
    );
    if (ok) {
      setIsLoading(true);
      await completeSection(sectionId);
      setIsLoading(false);
    }
  };

  const handleSectionRevert = async (sectionId: string) => {
    setIsLoading(true);
    await revertSection(sectionId);
    setIsLoading(false);
  };

  // 노트 추가 (인박스로)
  const handleAddNote = async () => {
    if (!boardId) return;
    try {
      const res = await fetch('/api/kanban/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          text: '새 노트',
          x: null,
          y: null,
          color: '#fef9c3',
        }),
      });
      const data = await res.json();
      if (data.success) {
        useBoardStore.setState((state) => ({
          notes: [
            ...state.notes,
            { id: data.data._id, ...data.data, x: null, y: null, tags: data.data.tags || [] },
          ],
        }));
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // 섹션 추가 (인박스로)
  const handleAddSection = async () => {
    if (!boardId) return;
    try {
      const res = await fetch('/api/kanban/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          title: '새 섹션',
          x: null,
          y: null,
          width: 300,
          height: 300,
          color: '#93C5FD',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const sec = data.data;
        useBoardStore.getState().addSection({ id: sec._id, ...sec });
      }
    } catch (err) {
      console.error('Failed to create section:', err);
    }
  };

  const selectedNote = selectedNoteId
    ? [...activeNotes].find((n) => n.id === selectedNoteId) || null
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f9f9f8]">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-black/5">
        <button onClick={() => router.back()} className="text-[#2563eb] text-lg font-medium">
          ←
        </button>
        <span className="text-xl font-bold tracking-tight text-slate-900">Project Board</span>
        {/* 접속자 아바타 그룹 */}
        <div className="flex items-center -space-x-1.5">
          {[
            ...(session?.user
              ? [
                  {
                    _id: session.user.id,
                    nName: session.user.name || 'Me',
                    avatarUrl: session.user.image || undefined,
                  },
                ]
              : []),
            ...(activeUsers || []).filter((u) => u._id !== session?.user?.id),
          ]
            .slice(0, 3)
            .map((user, idx) => (
              <div
                key={`${user._id}-${idx}`}
                title={user.nName}
                className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm ${
                  user._id === session?.user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {user.nName?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
          {(activeUsers?.length || 0) > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-zinc-200 text-zinc-500 text-[10px] font-bold flex items-center justify-center shadow-sm">
              +{(activeUsers?.length || 0) - 3}
            </div>
          )}
        </div>
      </div>

      {/* 진행중 / 완료 탭 */}
      <div className="px-4 py-2 bg-white">
        <div className="flex bg-surface-container-low p-1 rounded-xl">
          <button
            onClick={() => handleTabSwitch('active')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'active'
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            <span>📌</span>
            <span>진행중</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                viewMode === 'active' ? 'bg-white/20' : 'bg-surface-container-high text-slate-500'
              }`}
            >
              {notes.length}
            </span>
          </button>
          <button
            onClick={() => handleTabSwitch('done')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              viewMode === 'done' ? 'bg-[#2563eb] text-white shadow-sm' : 'text-on-surface-variant'
            }`}
          >
            <span>✅</span>
            <span>완료</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                viewMode === 'done' ? 'bg-white/20' : 'bg-surface-container-high text-slate-500'
              }`}
            >
              {completedNotes.length}
            </span>
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${viewMode === 'done' ? 'bg-[#f1f5f1]' : ''}`}
      >
        {/* 인박스 섹션 */}
        {inboxCount > 0 && (
          <InboxAccordion
            inboxSections={inboxSections}
            inboxOrphanNotes={inboxOrphanNotes}
            getNotesBySection={getNotesBySection}
            isDone={viewMode === 'done'}
            onNoteTap={(id) => setSelectedNoteId(id)}
          />
        )}

        {/* 캔버스 섹션 아코디언 */}
        {canvasSections.map((section) => (
          <MobileSectionAccordion
            key={section.id}
            section={section}
            notes={getNotesBySection(section.id)}
            isDone={viewMode === 'done'}
            onNoteComplete={viewMode === 'active' ? (id) => completeNote(id) : undefined}
            onNoteTap={(id) => setSelectedNoteId(id)}
            onSectionComplete={
              viewMode === 'active'
                ? () => handleSectionComplete(section.id, section.title)
                : undefined
            }
            onSectionRevert={
              viewMode === 'done' ? () => handleSectionRevert(section.id) : undefined
            }
          />
        ))}

        {/* 미소속 노트 */}
        {orphanCanvasNotes.length > 0 && (
          <div className="space-y-2">
            {orphanCanvasNotes.map((note) => (
              <MobileNoteCard
                key={note.id}
                note={note}
                isDone={viewMode === 'done'}
                onTap={() => setSelectedNoteId(note.id)}
                onComplete={viewMode === 'active' ? () => completeNote(note.id) : undefined}
              />
            ))}
          </div>
        )}

        {activeNotes.length === 0 && activeSections.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-12">
            {viewMode === 'active' ? '노트나 섹션을 추가해보세요!' : '완료된 항목이 없습니다.'}
          </div>
        )}
      </div>

      {/* 플로팅 버튼 (진행중 탭) */}
      {viewMode === 'active' && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40">
          <button
            onClick={handleAddSection}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 rounded-xl px-5 py-3 shadow-lg text-sm font-medium"
          >
            📦 + 섹션
          </button>
          <button
            onClick={handleAddNote}
            className="flex items-center gap-2 bg-[#2563eb] text-white rounded-xl px-5 py-3 shadow-lg text-sm font-medium"
          >
            ✏️ + 노트
          </button>
        </div>
      )}

      {/* 완료 탭 — 읽기 전용 뱃지 */}
      {viewMode === 'done' && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="bg-slate-200 text-slate-400 rounded-xl px-5 py-3 shadow-lg text-sm font-medium opacity-50">
            🔒 읽기 전용
          </div>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="bg-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-700">처리 중...</span>
          </div>
        </div>
      )}

      {/* 바텀시트 */}
      <NoteBottomSheet
        note={selectedNote}
        onClose={() => setSelectedNoteId(null)}
        isDone={viewMode === 'done'}
      />
    </div>
  );
}

// ─── 인박스 아코디언 ───
// ─── 인박스 내 섹션 폴더 (편집 가능) ───
function InboxSectionFolder({
  section,
  isDone,
  children,
}: {
  section: Section;
  isDone?: boolean;
  children: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(section.title);
  const { updateSection } = useBoardStore((s) => ({ updateSection: s.updateSection }));

  const save = () => {
    if (draft.trim() && draft !== section.title) {
      updateSection(section.id, { title: draft.trim() });
    } else {
      setDraft(section.title);
    }
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-slate-500">📁</span>
        {!isDone && isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            className="flex-1 text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <span
            className="text-xs font-bold text-slate-700 flex-1"
            onClick={() => {
              if (!isDone) setIsEditing(true);
            }}
          >
            {section.title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function InboxAccordion({
  inboxSections,
  inboxOrphanNotes,
  getNotesBySection,
  isDone,
  onNoteComplete,
  onNoteTap,
  onSectionComplete,
}: {
  inboxSections: Section[];
  inboxOrphanNotes: Note[];
  getNotesBySection: (id: string) => Note[];
  isDone?: boolean;
  onNoteComplete?: (id: string) => void;
  onNoteTap: (id: string) => void;
  onSectionComplete?: (id: string, title: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const totalCount =
    inboxOrphanNotes.length +
    inboxSections.reduce((acc, s) => acc + getNotesBySection(s.id).length, 0);

  // 드래그 상태
  const [dragging, setDragging] = React.useState<{ id: string; type: 'note' | 'section' } | null>(
    null
  );
  const [ghostPos, setGhostPos] = React.useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = React.useState<string | null>(null); // sectionId or 'orphan'
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inboxRef = React.useRef<HTMLDivElement>(null);
  const { updateNote, updateNotes } = useBoardStore((s) => ({
    updateNote: s.updateNote,
    updateNotes: s.updateNotes,
  }));

  const startLongPress = (id: string, type: 'note' | 'section', e: React.TouchEvent) => {
    if (isDone) return;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      setDragging({ id, type });
      setGhostPos({ x: touch.clientX, y: touch.clientY });
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // non-passive touchmove 리스너 (preventDefault 허용)
  const draggingRef = React.useRef(dragging);
  draggingRef.current = dragging;

  React.useEffect(() => {
    const el = inboxRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      cancelLongPress();
      if (!draggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      setGhostPos({ x: touch.clientX, y: touch.clientY });

      const els = document.elementsFromPoint(touch.clientX, touch.clientY);
      let found = false;
      for (const target of els) {
        const secId = (target as HTMLElement).dataset?.inboxSectionDrop;
        if (secId) {
          setDropTarget(secId);
          found = true;
          break;
        }
      }
      if (!found) setDropTarget(null);
    };

    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  const handleTouchEnd = () => {
    cancelLongPress();
    if (!dragging) return;

    // 인박스 밖 드롭 체크
    if (inboxRef.current) {
      const rect = inboxRef.current.getBoundingClientRect();
      if (
        ghostPos.x < rect.left ||
        ghostPos.x > rect.right ||
        ghostPos.y < rect.top ||
        ghostPos.y > rect.bottom
      ) {
        useToastStore.getState().show('인박스 내 이동만 가능합니다', 'error');
        setDragging(null);
        setDropTarget(null);
        return;
      }
    }

    // 노트 → 섹션 종속 변경
    if (dragging.type === 'note') {
      const newSectionId = dropTarget === 'orphan' ? null : dropTarget;
      updateNote(dragging.id, { sectionId: newSectionId });
      updateNotes([{ id: dragging.id, changes: { sectionId: newSectionId } }]);
    }

    setDragging(null);
    setDropTarget(null);
  };

  // 드래그 중인 아이템 라벨
  const draggingLabel = React.useMemo(() => {
    if (!dragging) return '';
    if (dragging.type === 'section') {
      return inboxSections.find((s) => s.id === dragging.id)?.title || '섹션';
    }
    const allNotes = [
      ...inboxOrphanNotes,
      ...inboxSections.flatMap((s) => getNotesBySection(s.id)),
    ];
    const note = allNotes.find((n) => n.id === dragging.id);
    return note?.text?.slice(0, 20) || '노트';
  }, [dragging, inboxSections, inboxOrphanNotes, getNotesBySection]);

  return (
    <div
      ref={inboxRef}
      className="rounded-2xl bg-[#e2e4e2] overflow-hidden"
      onTouchEnd={handleTouchEnd}
    >
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-[#2563eb]">📥</span>
        <span className="text-sm font-bold text-slate-800">
          {isDone ? '완료된 인박스' : '인박스'}
        </span>
        <span className="text-xs text-slate-500">({totalCount})</span>
        <span className="ml-auto text-slate-400">{expanded ? '∧' : '∨'}</span>
      </button>

      {/* 콘텐츠 */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* 인박스 내 섹션 (폴더) */}
          {inboxSections.map((section) => {
            const sectionNotes = getNotesBySection(section.id);
            const isOver = dropTarget === section.id;
            return (
              <div
                key={section.id}
                data-inbox-section-drop={section.id}
                onTouchStart={(e) => startLongPress(section.id, 'section', e)}
                onTouchEnd={cancelLongPress}
              >
                <InboxSectionFolder section={section} isDone={isDone}>
                  <div
                    className={`space-y-2 pl-2 min-h-[40px] rounded-lg transition-colors ${isOver ? 'bg-blue-100/50 ring-2 ring-blue-300' : ''}`}
                    data-inbox-section-drop={section.id}
                  >
                    {sectionNotes.map((note) => (
                      <div
                        key={note.id}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          startLongPress(note.id, 'note', e);
                        }}
                        onTouchEnd={cancelLongPress}
                        className={dragging?.id === note.id ? 'opacity-30' : ''}
                      >
                        <MobileNoteCard
                          note={note}
                          isDone={isDone}
                          onTap={() => {
                            if (!dragging) onNoteTap(note.id);
                          }}
                        />
                      </div>
                    ))}
                    {sectionNotes.length === 0 && isOver && (
                      <div className="text-[10px] text-blue-400 text-center py-2">여기에 놓기</div>
                    )}
                  </div>
                </InboxSectionFolder>
              </div>
            );
          })}

          {/* 고아 노트 영역 */}
          <div
            data-inbox-section-drop="orphan"
            className={`space-y-2 min-h-[20px] rounded-lg transition-colors ${dropTarget === 'orphan' ? 'bg-blue-100/50 ring-2 ring-blue-300' : ''}`}
          >
            {dropTarget === 'orphan' && inboxOrphanNotes.length === 0 && (
              <div className="text-[10px] text-blue-400 text-center py-2">미소속으로 이동</div>
            )}
            {inboxOrphanNotes.map((note) => (
              <div
                key={note.id}
                onTouchStart={(e) => startLongPress(note.id, 'note', e)}
                onTouchEnd={cancelLongPress}
                className={dragging?.id === note.id ? 'opacity-30' : ''}
              >
                <MobileNoteCard
                  note={note}
                  isDone={isDone}
                  onTap={() => {
                    if (!dragging) onNoteTap(note.id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 드래그 고스트 */}
      {dragging && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ left: ghostPos.x - 80, top: ghostPos.y - 20 }}
        >
          <div className="bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow-2xl border border-blue-300 text-sm font-medium text-slate-700 max-w-[160px] truncate">
            {dragging.type === 'section' ? '📁 ' : ''}
            {draggingLabel}
          </div>
        </div>
      )}
    </div>
  );
}
