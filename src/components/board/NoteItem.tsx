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
// 마크다운 문법을 느슨하게 허용하기 위한 전처리 함수
const preprocessMarkdown = (text: string) => {
  if (!text) return '';
  let processed = text;

  // 1. Header Correction: "#Title" -> "# Title"
  // 라인 시작(또는 줄바꿈 후)에 #이(1~6개) 오고, 공백 없이 문자가 올 경우 공백 추가
  processed = processed.replace(/(^|\n)(#{1,6})([^ \n#])/g, '$1$2 $3');

  // 2. Bold Correction: "** Bold **" -> "**Bold**"
  // ** 와 텍스트 사이에 공백이 있어도 볼드 처리되도록 수정
  // (단, 중간에 *이 포함되지 않는 경우에 한함)
  processed = processed.replace(/\*\*\s+([^\*]+?)\s+\*\*/g, '**$1**');

  // 3. Leading Space Preservation
  // 라인 맨 앞의 공백이 Markdown에서 무시되거나 이상하게 줄바꿈 처리되는 것 방지
  // 공백을 &nbsp;로 변환하여 시각적으로 유지
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
};

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
const SNAP_THRESHOLD = 3; // 스냅 거리 (픽셀) - 5px -> 3px로 축소
const GRID_SIZE = 10; // 그리드 크기 (픽셀)

// Helper to get nickname from ID
const getMemberName = (id: string | undefined, members: any[]) => {
  if (!id) return '';
  const member = members.find((m) => m._id === id);
  return member ? member.nName : 'Unknown';
};

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
  }));

  const { data: session } = useSession();
  const myUserId = session?.user?.id || 'anonymous';
  const myUserName = session?.user?.name || 'Me';

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const [showAssigneePicker, setShowAssigneePicker] = React.useState(false);

  const isDragging = React.useRef(false);
  const isResizing = React.useRef(false); // 리사이즈 중인지 여부
  const hasMoved = React.useRef(false); // 드래그로 인해 실제로 이동했는지 여부
  const lastPointerRef = React.useRef({ x: 0, y: 0 });

  // 이 노트가 선택되었는지 여부 확인
  const isSelected = selectedNoteIds.includes(id);
  const isPaletteOpen = openPaletteNoteId === id;
  const isTempNote = id.startsWith('temp-');

  // Lock Status
  const lockInfo = lockedNotes && lockedNotes[id];
  const isLockedByOther = !!(lockInfo && lockInfo.socketId !== socketClient.socket?.id);
  // const lockedByUser = isLockedByOther ? members.find(m => m._id === lockInfo.userId) : null;
  // NOTE: members might not be fully populated or userId might match differently. 
  // Fallback to simpler display if member not found.
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
  // --------------------

  const beginEdit = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isLockedByOther) return; // 잠겨있으면 편집 불가

      setDraft(text);
      setIsEditing(true);
      selectNote(id);

      // Lock Request
      if (myUserId !== 'anonymous') {
        lockNote(id, myUserId);
      }
    },
    [text, id, selectNote, isLockedByOther, lockNote, myUserId]
  );

  const saveEdit = React.useCallback(() => {
    // 변경사항이 있을 때만 저장
    if (draft !== text) {
      updateNote(id, { text: draft });
      saveChanges({ text: draft });
    }
    setIsEditing(false);
    unlockNote(id); // Release Lock
  }, [draft, text, id, updateNote, saveChanges, unlockNote]);

  const cancelEdit = React.useCallback(() => {
    setDraft(text);
    setIsEditing(false);
    unlockNote(id); // Release Lock
  }, [text, id, unlockNote]);

  React.useEffect(() => {
    if (!isEditing) setDraft(text);
    if (!isSelected && isEditing) {
      saveEdit();
    }
  }, [text, isEditing, isSelected, saveEdit]);

  // Assignee Handlers
  const handleAssigneeClick = (memberId: string) => {
    updateNote(id, { assigneeId: memberId });
    saveChanges({ assigneeId: memberId });
    setShowAssigneePicker(false);
  };

  const creatorName = React.useMemo(
    () => getMemberName(creatorId, members),
    [creatorId, members]
  );
  const assigneeName = React.useMemo(
    () => getMemberName(assigneeId, members),
    [assigneeId, members]
  );

  // --- Resize Handle (Start) ---
  const onResizePointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    isResizing.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);
  // -----------------------------

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic with useEffect
  React.useLayoutEffect(() => {
    if (isEditing && textareaRef.current) {
      // 1. Reset height to auto to correctly measure scrollHeight (shrink if needed)
      textareaRef.current.style.height = 'auto';
      const contentHeight = textareaRef.current.scrollHeight;

      // 2. Set textarea height to fit content
      textareaRef.current.style.height = `${contentHeight}px`;

      // 3. Calculate required Note height (Top 40 + Bottom 30 + Content)
      // Note: We maintain a minimum height of 140 (default) or whatever fits the content
      const listHeaderHeight = 40;
      const listFooterHeight = 30;
      const newNoteHeight = Math.max(140, contentHeight + listHeaderHeight + listFooterHeight);

      // 4. Update Note height if significantly LARGER (do not shrink below current manual size)
      // 편집 중에는 내용이 많아지면 늘어나야 하지만, 내용이 적다고 해서 갑자기 줄어들면 안됨 (사용자가 수동으로 늘려놨을 수도 있음)
      if (newNoteHeight > height && Math.abs(newNoteHeight - height) > 2) {
        updateNote(id, { height: newNoteHeight });
        debouncedSave({ height: newNoteHeight });
      }
    }
    // height change triggers re-render, but we don't want to re-run layout effect on height change 
    // (cause infinite loop), only on content change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isEditing]);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isEditing) return;
      if (isLockedByOther) return;

      if (e.shiftKey) {
        selectNote(id, true);
      } else if (!isSelected) {
        selectNote(id, false);
      }

      isDragging.current = true;
      hasMoved.current = false; // Reset move flag
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [isEditing, id, selectNote, isSelected, isLockedByOther]
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
          const MAX_HEIGHT = 600;
          const newWidth = Math.min(Math.max(100, width + dx), MAX_WIDTH);
          const newHeight = Math.min(Math.max(100, height + dy), MAX_HEIGHT);

          updateNote(id, { width: newWidth, height: newHeight });
          // debouncedSave 제거: 드래그 중에는 로컬 상태만 업데이트하여 불필요한 API 호출 방지
        }
      }
      // 2. 드래그(이동) 로직
      else if (isDragging.current) {
        if (dx !== 0 || dy !== 0) {
          hasMoved.current = true; // Mark as moved

          if (selectedNoteIds.length > 1 && isSelected) {
            moveNotes(selectedNoteIds, dx, dy);
          } else {
            let newX = x + dx;
            let newY = y + dy;
            let snappedX = newX;
            let snappedY = newY;
            const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

            if (e.altKey) {
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
    [isEditing, isDragging, isResizing, zoom, width, height, id, updateNote, debouncedSave, selectedNoteIds, isSelected, moveNotes, setAlignmentGuides, moveNote, x, y]
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

      // 실제로 이동하지 않았다면 저장 로직 건너뜀
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

  // --- Keyboard Accessibility ---
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return; // 편집 중이면 무시

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
        setIsEditing(true); // 엔터로 편집 진입
        return;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        removeNote(id);
        return;
      default: return;
    }

    e.preventDefault();
    e.stopPropagation(); // 부모(ShortcutHandler)로 전파 방지 (중복 실행 방지)

    const newX = x + dx;
    const newY = y + dy;
    moveNote(id, newX, newY);
    debouncedSave({ x: newX, y: newY });
  }, [isEditing, x, y, id, moveNote, debouncedSave, setIsEditing, removeNote]);

  return (
    <div
      role="note"
      tabIndex={0} // Focusable
      onKeyDown={handleKeyDown}
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
        borderRadius: 10,
        padding: 10,
        cursor: isEditing ? 'text' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        borderWidth: isLockedByOther ? 3 : 2, // 강조
        borderColor: isLockedByOther ? lockedColor : (isSelected ? '#3B82F6' : 'transparent'),
        opacity: isTempNote ? 0.7 : 1,
        zIndex: isSelected ? 9999 : zIndex,
        pointerEvents: isLockedByOther ? 'none' : 'auto',
      }}
    >
      {/* Lock Indicator */}
      {isLockedByOther && (
        <div style={{
          position: 'absolute',
          top: -26, // 조금 더 위로
          left: -2,
          background: lockedColor,
          color: 'white', // 텍스트 컬러는 밝기 계산 필요하지만 일단 white
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
      {isPaletteOpen && (
        <div style={{ position: 'absolute', top: 36, left: 6, display: 'flex', gap: 4, background: 'white', padding: '4px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 20 }}>
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`색상 ${c}로 변경`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => changeColor(c)}
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: c,
                border: c === color ? '2px solid #3B82F6' : '1px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        aria-label="색상 팔레트 열기"
        title="색상 변경"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={togglePalette}
        style={{
          position: 'absolute',
          top: 6,
          right: 36,
          width: 28,
          height: 28,
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        ...
      </button>

      <button
        type="button"
        aria-label="노트 삭제"
        title="삭제"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!isTempNote) removeNote(id);
        }}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 28,
          height: 28,
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      {!isEditing && (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            color: '#111827',
            height: '100%',
            paddingTop: 24,
            overflow: 'hidden',
            pointerEvents: 'none', // 텍스트 영역이 클릭 이벤트를 가로채지 않도록 설정 (드래그 지원)
            whiteSpace: 'pre-wrap', // 공백과 줄바꿈을 있는 그대로 표시
          }}
          className="markdown-body" // Optional: if you use a global markdown stylesheet
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 커스텀 스타일링 for Note
              h1: ({ children }: any) => <h1 style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0 0 4px 0', borderBottom: '1px solid #ddd' }}>{children}</h1>,
              h2: ({ children }: any) => <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '4px 0' }}>{children}</h2>,
              h3: ({ children }: any) => <h3 style={{ fontSize: '1em', fontWeight: 'bold', margin: '4px 0' }}>{children}</h3>,
              ul: ({ children }: any) => <ul style={{ listStyleType: 'disc', paddingLeft: '1.2em', margin: '0' }}>{children}</ul>,
              ol: ({ children }: any) => <ol style={{ listStyleType: 'decimal', paddingLeft: '1.2em', margin: '0' }}>{children}</ol>,
              li: ({ children }: any) => <li style={{ marginBottom: '0' }}>{children}</li>,
              p: ({ children }: any) => <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{children}</p>,
              blockquote: ({ children }: any) => <blockquote style={{ borderLeft: '4px solid #ccc', paddingLeft: '8px', color: '#666', margin: '0.5em 0' }}>{children}</blockquote>,
              code: ({ children, className }: any) => {
                const isInline = !String(children).includes('\n');
                return (
                  <code style={{
                    background: 'rgba(0,0,0,0.05)',
                    padding: '2px 4px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    display: isInline ? 'inline' : 'block',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {children}
                  </code>
                );
              },
              table: ({ children }: any) => <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0.5em 0', fontSize: '0.9em' }}>{children}</table>,
              th: ({ children }: any) => <th style={{ border: '1px solid #ddd', padding: '4px', background: 'rgba(0,0,0,0.02)' }}>{children}</th>,
              td: ({ children }: any) => <td style={{ border: '1px solid #ddd', padding: '4px' }}>{children}</td>,
              a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>{children}</a>
            }}
          >
            {preprocessMarkdown(text)}
          </ReactMarkdown>
        </div>
      )}

      {isEditing && (
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
            position: 'absolute',
            left: 8,
            right: 8,
            top: 40,
            // inset: 8, // Removed to avoid 'bottom' constraint interfering with auto-resize
            // bottom is undefined, allowing height to be controlled solely by content
            resize: 'none',
            outline: '2px solid rgba(59,130,246,0.5)',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            padding: 8,
            fontSize: 14,
            lineHeight: 1.4,
            color: '#111827',
            background: 'rgba(255,255,255,0.95)',
            overflow: 'hidden',
          }}
        />
      )}

      {/* Note Footer (Properties) */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: 8,
          right: 20, /* Resize handle space */
          height: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: '#4B5563',
          pointerEvents: 'auto', // Allow interaction
          zIndex: 20, // Ensure it's above other elements
        }}
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
      >
        {/* Creator Display */}
        {creatorId && (
          <span style={{ fontSize: 10, color: '#9CA3AF', marginRight: 4, flexShrink: 0 }}>
            By {creatorName}
          </span>
        )}

        {/* Assignee Badge / Picker Trigger */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setShowAssigneePicker(!showAssigneePicker);
            }}
            className="hover:bg-black/5 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
            title="담당자 변경"
          >
            {assigneeId ? (
              <span style={{ fontWeight: 600, color: '#1F2937' }}>@{assigneeName}</span>
            ) : (
              <span>+ Assignee</span>
            )}
          </div>

          {/* Assignee Picker Popover */}
          {showAssigneePicker && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                backgroundColor: 'white',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: 4,
                minWidth: 140,
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssigneeClick(member._id);
                    }}
                    className="px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm transition-colors"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {/* Simple Avatar Placeholder */}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#E5E7EB',
                        fontSize: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B7280',
                        flexShrink: 0,
                      }}
                    >
                      {member.nName[0]}
                    </div>
                    <span className="truncate">{member.nName}</span>
                  </div>
                ))
              ) : (
                <div className="px-2 py-1 text-xs text-gray-500">멤버 없음</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 리사이즈 핸들 */}
      <div
        onPointerDown={onResizePointerDown}
        // onPointerMove / Up은 부모 요소에서 처리함
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 20,
          height: 20,
          cursor: 'nwse-resize',
          zIndex: 10,
          background: 'transparent',
        }}
      >
        {/* 시각적 핸들 아이콘 (우측 하단 코너 표시) */}
        <div style={{
          position: 'absolute',
          right: 4,
          bottom: 4,
          width: 8,
          height: 8,
          borderRight: '2px solid rgba(0,0,0,0.3)',
          borderBottom: '2px solid rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}
