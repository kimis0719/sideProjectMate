'use client';

import React from 'react';

import { useBoardStore, Note } from '@/store/boardStore';
import { socketClient } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Color Gen Helper
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// --- Markdown Preprocessor ---
const preprocessMarkdown = (text: string) => {
  if (!text) return '';
  let processed = text;
  processed = processed.replace(/(^|\n)(#{1,6})([^ \n#])/g, '$1$2 $3');
  processed = processed.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**');
  processed = processed.replace(/^ +/gm, (match) => '&nbsp;'.repeat(match.length));
  return processed;
};
// -----------------------------

// --- Debounce Helper ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
// --------------------

type Props = {
  id: string;
  x: number;
  y: number;
  text: string;
  color?: string;
  zIndex?: number;
  width?: number;
  height?: number;
  creatorId?: string;
  updaterId?: string;
  assigneeId?: string;
  dueDate?: Date;
  tags: string[];
};

// D-Day 계산 헬퍼
const getDDayInfo = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let label = '';
  let color = '#6B7280'; // 기본 회색 (미래)

  if (diffDays < 0) {
    label = `D+${Math.abs(diffDays)}`;
    color = '#EF4444'; // 빨강 (지남)
  } else if (diffDays === 0) {
    label = 'D-Day';
    color = '#F97316'; // 주황 (오늘)
  } else {
    label = `D-${diffDays}`;
    if (diffDays <= 3) color = '#F59E0B'; // 3일 전 임박 (노랑/주황)
  }

  return { label, color, diffDays };
};

const toInputDate = (d?: Date) => {
  if (!d) return '';
  return new Date(d).toISOString().split('T')[0];
};

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
const SNAP_THRESHOLD = 3;
const GRID_SIZE = 10;

export default function NoteItem({
  id,
  x,
  y,
  text,
  color = '#FFFB8F',
  zIndex = 1,
  width = 200,
  height = 140,
  creatorId,
  updaterId,
  assigneeId,
  dueDate,
  tags = [],
}: Props) {
  const {
    moveNote,
    moveNotes,
    updateNote,
    updateNotes,
    removeNote,
    selectedNoteIds,
    selectNote,
    openPaletteNoteId,
    setOpenPaletteNoteId,
    zoom,
    setAlignmentGuides,
    members,
    lockedNotes,
    lockNote,
    unlockNote,
    isSnapEnabled,
    isSelectionMode,
  } = useBoardStore((s) => ({
    moveNote: s.moveNote,
    moveNotes: s.moveNotes,
    updateNote: s.updateNote,
    updateNotes: s.updateNotes,
    removeNote: s.removeNote,
    selectedNoteIds: s.selectedNoteIds,
    selectNote: s.selectNote,
    openPaletteNoteId: s.openPaletteNoteId,
    setOpenPaletteNoteId: s.setOpenPaletteNoteId,
    zoom: s.zoom,
    setAlignmentGuides: s.setAlignmentGuides,
    members: s.members,
    lockedNotes: s.lockedNotes,
    lockNote: s.lockNote,
    unlockNote: s.unlockNote,
    isSnapEnabled: s.isSnapEnabled,
    isSelectionMode: s.isSelectionMode,
  }));

  const { data: session } = useSession();
  const myUserId = session?.user?.id || 'anonymous';

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const [tagInput, setTagInput] = React.useState('');

  const isDragging = React.useRef(false);
  const isResizing = React.useRef(false);
  const hasMoved = React.useRef(false);
  const lastPointerRef = React.useRef({ x: 0, y: 0 });

  const isSelected = selectedNoteIds.includes(id);
  const isPaletteOpen = openPaletteNoteId === id;
  const isTempNote = id.startsWith('temp-');

  const lockInfo = lockedNotes && lockedNotes[id];
  const isLockedByOther = !!(lockInfo && lockInfo.socketId !== socketClient.socket?.id);
  const lockedByUser = isLockedByOther ? members.find(m => m._id === lockInfo.userId) : null;
  const lockedByName = lockedByUser ? lockedByUser.nName : (lockInfo?.userId || 'Unknown');
  const lockedColor = lockInfo ? stringToColor(lockInfo.userId) : '#EF4444';

  // --- 서버 저장 로직 ---
  const saveChanges = React.useCallback(
    (patch: Partial<Omit<Note, 'id'>>) => {
      if (isTempNote) return;

      fetch(`/api/kanban/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch((error) => {
        console.error('Failed to save note changes:', error);
      });
    },
    [id, isTempNote]
  );

  const debouncedSave = React.useMemo(() => debounce(saveChanges, 500), [saveChanges]);

  const beginEdit = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isLockedByOther) return;

      setDraft(text);
      setIsEditing(true);
      selectNote(id);

      if (myUserId !== 'anonymous') {
        lockNote(id, myUserId);
      }
    },
    [text, id, selectNote, isLockedByOther, lockNote, myUserId]
  );

  const saveEdit = React.useCallback(() => {
    if (draft !== text) {
      updateNote(id, { text: draft });
      saveChanges({ text: draft });
    }
    setIsEditing(false);
    unlockNote(id);
  }, [draft, text, id, updateNote, saveChanges, unlockNote]);

  const cancelEdit = React.useCallback(() => {
    setDraft(text);
    setIsEditing(false);
    unlockNote(id);
  }, [text, id, unlockNote]);

  React.useEffect(() => {
    if (!isEditing) setDraft(text);
    if (!isSelected && isEditing) {
      saveEdit();
    }
  }, [text, isEditing, isSelected, saveEdit]);


  const getMemberInfo = React.useCallback((memberId?: string) => {
    if (!memberId) return null;
    const member = members.find(m => m._id === memberId);
    if (!member) return { name: 'Unknown', avatarUrl: null, initial: '?' };
    return {
      name: member.nName,
      avatarUrl: member.avatarUrl,
      initial: member.nName.charAt(0).toUpperCase()
    };
  }, [members]);

  const creatorInfo = getMemberInfo(creatorId);
  const assigneeInfo = getMemberInfo(assigneeId);

  // --- Mobile Double Tap Logic ---
  const lastTapRef = React.useRef<number>(0);
  const handleTouchEnd = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLockedByOther && !isSelectionMode) {
        e.preventDefault();
        setDraft(text);
        setIsEditing(true);
        selectNote(id);
        if (myUserId !== 'anonymous') lockNote(id, myUserId);
      }
    }
    lastTapRef.current = now;
  }, [isLockedByOther, text, id, selectNote, myUserId, lockNote, isSelectionMode]);

  const onResizePointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const tagsRef = React.useRef<HTMLDivElement>(null);

  // Auto-resize logic with Layout Effect
  React.useLayoutEffect(() => {
    if (!textareaRef.current && !contentRef.current) return;
    if (isResizing.current) return;

    let contentHeight = 0;

    // 1. Measure Content Height
    if (isEditing && textareaRef.current) {
      // [수정] 0px로 리셋하여 순수 scollHeight 측정 -> 이후 100%로 복구하여 컨테이너 채움
      textareaRef.current.style.height = '0px';
      contentHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = '100%'; // 측정 후 복구
    } else if (!isEditing && contentRef.current) {
      contentHeight = contentRef.current.offsetHeight;
    }

    // 2. Calculate Total Height
    const PADDING_TOP = 32;
    const PADDING_BOTTOM = 32;
    const FOOTER_HEIGHT = 48; // 여유 있게

    const tagsH = tagsRef.current ? tagsRef.current.offsetHeight : 0;
    const tagsMargin = (tags.length > 0 && tagsH > 0) ? 8 : 0;

    const totalCalculatedHeight = PADDING_TOP + tagsH + tagsMargin + contentHeight + PADDING_BOTTOM + FOOTER_HEIGHT;

    // 최소 높이 140px 보장
    const safeHeight = Math.max(140, totalCalculatedHeight);

    // 3. Update Height
    // [수정] 임계값 5px로 다시 조정하되, '0px' 측정 방식 덕분에 정확해짐
    // 더 커질 때만 확장, 작아질 때는 편집 아닐 때도 반영? 
    // 사용성을 위해 "편집 중에는 텍스트 줄어들면 같이 줄어들게" 허용 (단, 140px 이상)
    // 떨림 방지를 위해 2px 정도의 buffer
    if (Math.abs(safeHeight - height) > 2) {
      if (isEditing) {
        updateNote(id, { height: safeHeight });
        // 편집 중 잦은 DB 저장은 부하가 될 수 있으므로, 로컬 updateNote만 하고 DB 저장은 onBlur/Debounce로 위임?
        // 사용자 경험상 "다른 사람이 볼 때"도 커져야 하므로 debouncedSave 사용
        debouncedSave({ height: safeHeight });
      } else if (safeHeight > height) {
        // 비편집 상태에서는 커질 때만 (콘텐츠 로딩 등)
        updateNote(id, { height: safeHeight });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isEditing, tags, text]); // height dependencies removed


  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isEditing) return;
      if (isLockedByOther) return;

      if (e.shiftKey) {
        selectNote(id, true);
      } else if (isSelectionMode) {
        selectNote(id, true);
      } else if (!isSelected) {
        selectNote(id, false);
      }

      isDragging.current = true;
      hasMoved.current = false;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [isEditing, id, selectNote, isSelected, isLockedByOther, isSelectionMode]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((!isDragging.current && !isResizing.current) || isEditing) return;

      const dx = (e.clientX - lastPointerRef.current.x) / zoom;
      const dy = (e.clientY - lastPointerRef.current.y) / zoom;

      // 1. 리사이즈 로직
      if (isResizing.current) {
        if (dx !== 0 || dy !== 0) {
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 1200;
          const newWidth = Math.min(Math.max(100, width + dx), MAX_WIDTH);
          const newHeight = Math.min(Math.max(100, height + dy), MAX_HEIGHT);

          updateNote(id, { width: newWidth, height: newHeight });
        }
      }
      // 2. 드래그(이동) 로직
      else if (isDragging.current) {
        if (isSelectionMode) return;

        if (dx !== 0 || dy !== 0) {
          hasMoved.current = true;

          if (selectedNoteIds.length > 1 && isSelected) {
            moveNotes(selectedNoteIds, dx, dy);
          } else {
            let newX = x + dx;
            let newY = y + dy;
            let snappedX = newX;
            let snappedY = newY;
            const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

            if (e.altKey || isSnapEnabled) {
              const notes = useBoardStore.getState().notes;
              const NOTE_WIDTH = width;
              const NOTE_HEIGHT = height;

              let minDistX = SNAP_THRESHOLD;
              let foundSnapX = false;
              let minDistY = SNAP_THRESHOLD;
              let foundSnapY = false;

              notes.forEach((other) => {
                if (other.id === id) return;
                const otherW = other.width || 200;
                const otherH = other.height || 140;

                const otherXs = [other.x, other.x + otherW];
                const myXs = [newX, newX + NOTE_WIDTH];

                const otherYs = [other.y, other.y + otherH];
                const myYs = [newY, newY + NOTE_HEIGHT];

                for (const ox of otherXs) {
                  for (let i = 0; i < myXs.length; i++) {
                    const dist = Math.abs(myXs[i] - ox);
                    if (dist < minDistX) {
                      minDistX = dist;
                      snappedX = ox - (myXs[i] - newX);
                      foundSnapX = true;
                      guides.push({ type: 'vertical', x: ox });
                    }
                  }
                }

                for (const oy of otherYs) {
                  for (let i = 0; i < myYs.length; i++) {
                    const dist = Math.abs(myYs[i] - oy);
                    if (dist < minDistY) {
                      minDistY = dist;
                      snappedY = oy - (myYs[i] - newY);
                      foundSnapY = true;
                      guides.push({ type: 'horizontal', y: oy });
                    }
                  }
                }
              });

              if (!foundSnapX) {
                if (Math.abs(newX % GRID_SIZE) < SNAP_THRESHOLD) {
                  snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                }
              }
              if (!foundSnapY) {
                if (Math.abs(newY % GRID_SIZE) < SNAP_THRESHOLD) {
                  snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                }
              }
            }

            setAlignmentGuides(guides);
            moveNote(id, snappedX, snappedY);
            debouncedSave({ x: snappedX, y: snappedY });
          }
        }
      }

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    },
    [isEditing, isDragging, isResizing, zoom, width, height, id, updateNote, debouncedSave, selectedNoteIds, isSelected, moveNotes, setAlignmentGuides, moveNote, x, y, isSnapEnabled, isSelectionMode]
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // 리사이즈 종료 처리
      if (isResizing.current) {
        isResizing.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        debouncedSave.cancel();
        saveChanges({ width, height });
        return;
      }

      // 드래그 종료 처리
      if (!isDragging.current) return;
      isDragging.current = false;
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      setAlignmentGuides([]);

      if (!hasMoved.current) {
        debouncedSave.cancel();
        return;
      }

      if (selectedNoteIds.length > 1 && isSelected) {
        debouncedSave.cancel();
        const currentNotes = useBoardStore.getState().notes;
        const updates = currentNotes
          .filter((n) => selectedNoteIds.includes(n.id))
          .map((n) => ({
            id: n.id,
            changes: { x: n.x, y: n.y, sectionId: n.sectionId },
          }));
        updateNotes(updates);
      } else {
        debouncedSave.cancel();
        const currentNote = useBoardStore.getState().notes.find(n => n.id === id);
        if (currentNote) {
          saveChanges({ x, y, sectionId: currentNote.sectionId });
        } else {
          saveChanges({ x, y });
        }
      }
    },
    [saveChanges, width, height, selectedNoteIds, isSelected, updateNotes, setAlignmentGuides, debouncedSave, x, y, id]
  );

  const onPointerCancel = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    isResizing.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    setAlignmentGuides([]);
  }, [setAlignmentGuides]);

  const changeColor = React.useCallback(
    (newColor: string) => {
      updateNote(id, { color: newColor });
      saveChanges({ color: newColor });
    },
    [id, updateNote, saveChanges]
  );

  const togglePalette = () => {
    setOpenPaletteNoteId(isPaletteOpen ? null : id);
  };

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;

    const STEP = e.shiftKey ? 50 : 10;
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowUp': dy = -STEP; break;
      case 'ArrowDown': dy = STEP; break;
      case 'ArrowLeft': dx = -STEP; break;
      case 'ArrowRight': dx = STEP; break;
      case 'Enter':
        e.preventDefault();
        setIsEditing(true);
        return;
      case 'Delete':
        e.preventDefault();
        removeNote(id);
        return;
      default: return;
    }

    e.preventDefault();
    e.stopPropagation();

    const newX = x + dx;
    const newY = y + dy;
    moveNote(id, newX, newY);
    debouncedSave({ x: newX, y: newY });
  }, [isEditing, x, y, id, moveNote, debouncedSave, setIsEditing, removeNote]);

  return (
    <div
      role="note"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchEnd={handleTouchEnd}
      aria-grabbed={isDragging.current}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={beginEdit}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        transform: `translate3d(${x}px, ${y}px, 0)`,
        width: width,
        height: height,
        background: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: 12,
        padding: 0,
        cursor: isEditing ? 'text' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        borderWidth: isLockedByOther ? 3 : 2,
        borderColor: isLockedByOther ? lockedColor : (isSelected ? '#3B82F6' : 'transparent'),
        opacity: isTempNote ? 0.7 : 1,
        zIndex: isSelected ? 9999 : zIndex,
        pointerEvents: isLockedByOther ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Lock Indicator */}
      {isLockedByOther && (
        <div style={{
          position: 'absolute',
          top: -26,
          left: -2,
          background: lockedColor,
          color: 'white',
          fontSize: 12,
          fontWeight: 'bold',
          padding: '2px 8px',
          borderRadius: '4px 4px 4px 0',
          zIndex: 100,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {lockedByName}
        </div>
      )}

      {/* Settings Popover */}
      {isPaletteOpen && (
        <div
          className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl z-20 border border-gray-100 dark:border-gray-700"
          style={{
            position: 'absolute',
            top: 40,
            right: -240,
            width: 240,
            cursor: 'default',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* 1. 색상 선택 */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">색상</div>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => changeColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: c === color ? '2px solid #3B82F6' : '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 2. 담당자 설정 */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">담당자</div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {members.length > 0 ? (
                members.map((member) => (
                  <button
                    key={member._id}
                    onClick={() => {
                      updateNote(id, { assigneeId: member._id });
                      saveChanges({ assigneeId: member._id });
                    }}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors border ${assigneeId === member._id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : 'hover:bg-gray-50 border-transparent dark:hover:bg-gray-700'}`}
                  >
                    {member.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatarUrl} alt={member.nName} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {member.nName[0]}
                      </div>
                    )}
                    <span className={`text-xs ${assigneeId === member._id ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {member.nName}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-xs text-gray-400">멤버가 없습니다.</div>
              )}
            </div>
          </div>

          {/* 3. 태그 설정 */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">태그</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs flex items-center gap-1 text-gray-700 dark:text-gray-200">
                  #{tag}
                  <button
                    onClick={() => {
                      const newTags = tags.filter(t => t !== tag);
                      updateNote(id, { tags: newTags });
                      saveChanges({ tags: newTags });
                    }}
                    className="hover:text-red-500 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="태그 입력 후 Enter"
              className="w-full text-sm border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = tagInput.trim();
                  if (val && !tags.includes(val)) {
                    const newTags = [...tags, val];
                    updateNote(id, { tags: newTags });
                    saveChanges({ tags: newTags });
                    setTagInput('');
                  }
                }
              }}
            />
          </div>

          {/* 4. 마감일 설정 */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">마감일</div>
            <input
              type="date"
              className="w-full text-sm border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
              value={dueDate ? toInputDate(dueDate) : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                updateNote(id, { dueDate: date });
                saveChanges({ dueDate: date });
              }}
            />
          </div>

          <hr className="border-gray-100 dark:border-gray-700" />

          {/* 5. 삭제 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isTempNote) removeNote(id);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <span>🗑️ 노트 삭제</span>
          </button>

        </div>
      )}

      {/* Done Button for Mobile Editing - Top Center */}
      {isEditing && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            saveEdit();
          }}
          style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: '#3B82F6',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 16,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          완료
        </button>
      )}

      {/* Settings Button */}
      <button
        type="button"
        aria-label="설정 메뉴 열기"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={togglePalette}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 24,
          height: 24,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
          opacity: 0.6,
        }}
        className="hover:bg-black/10 transition-colors"
      >
        <span style={{ fontSize: 18, lineHeight: 1, color: '#111827' }}>...</span>
      </button>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 pt-8 pb-8 px-3">
        {/* Tags Display */}
        {tags && tags.length > 0 && (
          <div ref={tagsRef} className="flex flex-wrap gap-1 mb-2">
            {tags.map(tag => (
              <span key={tag} style={{
                fontSize: 10,
                backgroundColor: 'rgba(0,0,0,0.06)',
                padding: '2px 6px',
                borderRadius: 10,
                color: '#374151',
                fontWeight: 500
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Markdown Body or Textarea */}
        {!isEditing ? (
          <div
            ref={contentRef}
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 1.5,
              color: '#111827',
              overflow: 'hidden',
              pointerEvents: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
            className="markdown-body"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }: any) => <h1 style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0 0 4px 0', borderBottom: '1px solid #ddd' }}>{children}</h1>,
                h2: ({ children }: any) => <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '4px 0' }}>{children}</h2>,
                p: ({ children }: any) => <p style={{ margin: '0 0 4px 0', whiteSpace: 'pre-wrap' }}>{children}</p>,
                a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>{children}</a>,
              }}
            >
              {preprocessMarkdown(text)}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                saveEdit();
              }
            }}
            aria-label="노트 텍스트 편집"
            style={{
              // [수정] 100%로 설정하여 컨테이너 사이즈를 따라가도록 함 (flex:1 대신)
              width: '100%',
              height: '100%',
              resize: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#111827',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              padding: 0,
              margin: 0,
              border: 'none',
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div
        className="h-8 px-3 flex items-center w-full"
        style={{ marginTop: 'auto', pointerEvents: 'auto' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center -space-x-1 overflow-hidden p-1">
          {/* Creator Avatar - Fixed width/height for alignment */}
          <div className="relative z-0 opacity-80"
            style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={`작성자: ${creatorInfo?.name}`}>
            {creatorInfo?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creatorInfo.avatarUrl}
                alt={creatorInfo.name}
                className="w-[18px] h-[18px] rounded-full object-cover border border-white dark:border-gray-700"
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-gray-400 border border-white dark:border-gray-700 flex items-center justify-center text-[8px] text-white">
                {creatorInfo?.initial}
              </div>
            )}
          </div>

          {/* Assignee Avatar */}
          <div className="relative z-10 ml-0.5"
            style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={assigneeId ? `담당자: ${assigneeInfo?.name}` : '담당자 미지정'}>
            {assigneeId ? (
              assigneeInfo?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assigneeInfo.avatarUrl}
                  alt={assigneeInfo.name}
                  className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-black/5 dark:border-gray-800"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-sm ring-1 ring-black/5 dark:border-gray-800 flex items-center justify-center text-[10px] text-white font-bold">
                  {assigneeInfo?.initial}
                </div>
              )
            ) : (
              <button
                onClick={togglePalette}
                className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-white transition-all ml-1"
                title="담당자 할당"
              >
                <span className="text-sm shadow-none">+</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1"></div>

        {/* Due Date Badge */}
        {dueDate && (
          <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full shadow-sm ml-2" title={dueDate.toLocaleDateString()}>
            <span className="text-xs">🕰️</span>
            <span
              className="text-[10px] font-bold"
              style={{ color: getDDayInfo(dueDate).color }}
            >
              {getDDayInfo(dueDate).label}
            </span>
          </div>
        )}

      </div>

      {/* Resize Handle */}
      {isSelected && !isLockedByOther && !isSelectionMode && (
        <div
          onPointerDown={onResizePointerDown}
          style={{
            position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, cursor: 'nwse-resize', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.3 }}>
            <path d="M22 22L22 2L2 22L22 22Z" />
          </svg>
        </div>
      )}
    </div>
  );
}
