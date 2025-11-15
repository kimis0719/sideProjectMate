'use client';

import React from 'react';
import { useBoardStore, Note } from '@/store/boardStore';

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

  return debounced;
}
// --------------------

type Props = {
  id: string;
  x: number;
  y: number;
  text: string;
  color?: string;
};

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;

export default function NoteItem({ id, x, y, text, color = '#FFFB8F' }: Props) {
  const {
    moveNote,
    updateNote,
    removeNote,
    selectedNoteId,
    selectNote,
    openPaletteNoteId,
    setOpenPaletteNoteId,
  } = useBoardStore((s) => ({
    moveNote: s.moveNote,
    updateNote: s.updateNote,
    removeNote: s.removeNote,
    selectedNoteId: s.selectedNoteId,
    selectNote: s.selectNote,
    openPaletteNoteId: s.openPaletteNoteId,
    setOpenPaletteNoteId: s.setOpenPaletteNoteId,
  }));

  const [dragging, setDragging] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const startRef = React.useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });

  const isSelected = selectedNoteId === id;
  const isPaletteOpen = openPaletteNoteId === id;
  const isTempNote = id.startsWith('temp-'); // 임시 노트 여부 확인

  // --- 서버 저장 로직 ---
  const saveChanges = React.useCallback(
    (patch: Partial<Omit<Note, 'id'>>) => {
      // 임시 노트(아직 서버에 생성되지 않음)는 저장하지 않음
      if (isTempNote) return;

      fetch(`/api/kanban/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch((error) => {
        console.error('Failed to save note changes:', error);
        // TODO: 저장 실패 시 사용자에게 알림 (예: 토스트 메시지)
      });
    },
    [id, isTempNote]
  );

  // 500ms 디바운싱 적용된 저장 함수
  const debouncedSave = React.useMemo(() => debounce(saveChanges, 500), [saveChanges]);
  // --------------------

  React.useEffect(() => {
    if (!isEditing) setDraft(text);
  }, [text, isEditing]);

  const beginEdit = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDraft(text);
    setIsEditing(true);
    selectNote(id);
  }, [text, id, selectNote]);

  const saveEdit = React.useCallback(() => {
    // UI 즉시 업데이트
    updateNote(id, { text: draft });
    // 서버에 변경사항 저장
    saveChanges({ text: draft });
    setIsEditing(false);
  }, [draft, id, updateNote, saveChanges]);

  const cancelEdit = React.useCallback(() => {
    setDraft(text);
    setIsEditing(false);
  }, [text]);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isEditing) return;
      e.stopPropagation();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      startRef.current = { sx: e.clientX, sy: e.clientY, ox: x, oy: y };
      setDragging(true);
      selectNote(id);
    },
    [x, y, isEditing, id, selectNote]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging || isEditing) return;
      const dx = e.clientX - startRef.current.sx;
      const dy = e.clientY - startRef.current.sy;
      const newX = startRef.current.ox + dx;
      const newY = startRef.current.oy + dy;
      // UI 즉시 업데이트
      moveNote(id, newX, newY);
      // 서버 저장 (디바운스)
      debouncedSave({ x: newX, y: newY });
    },
    [dragging, id, moveNote, isEditing, debouncedSave]
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      // 드래그 종료 시점에 최종 위치 즉시 저장 시도 (디바운스 취소 및 즉시 실행)
      // debouncedSave.flush(); // lodash.debounce 사용 시
      saveChanges({ x, y });
    },
    [dragging, saveChanges, x, y]
  );

  const onPointerCancel = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, []);

  const changeColor = React.useCallback(
    (newColor: string) => {
      // UI 즉시 업데이트
      updateNote(id, { color: newColor });
      // 서버에 변경사항 저장
      saveChanges({ color: newColor });
    },
    [id, updateNote, saveChanges]
  );

  const togglePalette = () => {
    setOpenPaletteNoteId(isPaletteOpen ? null : id);
  };

  return (
    <div
      role="note"
      aria-grabbed={dragging}
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
        willChange: dragging ? 'transform' : 'auto',
        width: 200,
        height: 140,
        background: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: 10,
        padding: 10,
        cursor: isEditing ? 'text' : dragging ? 'grabbing' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        borderWidth: 2,
        borderColor: isSelected ? '#3B82F6' : 'transparent',
        opacity: isTempNote ? 0.7 : 1, // 임시 노트는 약간 투명하게
      }}
    >
      {/* ... (팔레트, 버튼 등 나머지 JSX는 동일) ... */}
      {isPaletteOpen && (
        <div style={{ position: 'absolute', top: 36, left: 6, display: 'flex', gap: 4, background: 'white', padding: '4px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 }}>
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
            whiteSpace: 'pre-wrap',
            height: '100%',
            paddingTop: 24,
          }}
        >
          {text}
        </div>
      )}

      {isEditing && (
        <textarea
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
            inset: 8,
            top: 40,
            resize: 'none',
            outline: '2px solid rgba(59,130,246,0.5)',
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.1)',
            padding: 8,
            fontSize: 14,
            lineHeight: 1.4,
            color: '#111827',
            background: 'rgba(255,255,255,0.95)',
          }}
        />
      )}
    </div>
  );
}
