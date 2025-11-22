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
};

const COLOR_PALETTE = ['#FFFB8F', '#B7F0AD', '#FFD6E7', '#C7E9FF', '#E9D5FF', '#FEF3C7'] as const;
const SNAP_THRESHOLD = 3; // 스냅 거리 (픽셀) - 5px -> 3px로 축소
const GRID_SIZE = 10; // 그리드 크기 (픽셀)

export default function NoteItem({ id, x, y, text, color = '#FFFB8F', zIndex = 1 }: Props) {
  const {
    moveNote,
    moveNotes, // 다중 이동 액션
    updateNote,
    updateNotes, // 일괄 수정 액션
    removeNote,
    selectedNoteIds, // 다중 선택 상태
    selectNote,
    openPaletteNoteId,
    setOpenPaletteNoteId,
    zoom, // zoom 상태 가져오기
    setAlignmentGuides, // 가이드라인 설정 액션
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
  }));

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const isDragging = React.useRef(false);
  const lastPointerRef = React.useRef({ x: 0, y: 0 });

  // 이 노트가 선택되었는지 여부 확인
  const isSelected = selectedNoteIds.includes(id);
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

  React.useEffect(() => {
    if (!isEditing) setDraft(text);
    if (!isSelected && isEditing) {
      saveEdit();
    }
  }, [text, isEditing, isSelected, saveEdit]);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isEditing) return;

      if (e.shiftKey) {
        selectNote(id, true);
      } else if (!isSelected) {
        selectNote(id, false);
      }

      isDragging.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY }; // 시작 포인터 위치 저장
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [isEditing, id, selectNote, isSelected]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || isEditing) return;

      const dx = (e.clientX - lastPointerRef.current.x) / zoom;
      const dy = (e.clientY - lastPointerRef.current.y) / zoom;

      if (dx !== 0 || dy !== 0) {
        if (selectedNoteIds.length > 1 && isSelected) {
          // 그룹 이동: 스냅 없이 단순 이동 (복잡도 문제로 그룹 스냅은 제외)
          moveNotes(selectedNoteIds, dx, dy);
        } else {
          // 단일 이동: 스냅 및 바운딩 적용
          let newX = x + dx;
          let newY = y + dy;

          // 1. 바운딩 제거 (무한 스크롤 허용)
          // newX = Math.max(0, newX);
          // newY = Math.max(0, newY);

          let snappedX = newX;
          let snappedY = newY;
          const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

          // 스냅 로직은 Alt 키가 눌렸을 때만 동작
          if (e.altKey) {
            const notes = useBoardStore.getState().notes;
            const NOTE_WIDTH = 200;
            const NOTE_HEIGHT = 140;

            let minDistX = SNAP_THRESHOLD;
            let foundSnapX = false;

            let minDistY = SNAP_THRESHOLD;
            let foundSnapY = false;

            notes.forEach((other) => {
              if (other.id === id) return;

              // X축 비교 대상: [Left, Right] (Center 제거)
              const otherXs = [other.x, other.x + NOTE_WIDTH];
              const myXs = [newX, newX + NOTE_WIDTH];

              // Y축 비교 대상: [Top, Bottom] (Center 제거)
              const otherYs = [other.y, other.y + NOTE_HEIGHT];
              const myYs = [newY, newY + NOTE_HEIGHT];

              for (const ox of otherXs) {
                for (let i = 0; i < myXs.length; i++) {
                  const dist = Math.abs(myXs[i] - ox);
                  if (dist < minDistX) {
                    minDistX = dist;
                    // 스냅 적용: 현재 나의 기준점(myXs[i])이 ox가 되도록 newX 조정
                    // newX = ox - (myXs[i] - newX)
                    snappedX = ox - (myXs[i] - newX);
                    foundSnapX = true;
                    guides.push({ type: 'vertical', x: ox });
                  }
                }
              }

              // Y축 검사
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

            // 3. 그리드 스냅 (스마트 스냅이 없을 때만)
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

          // 가이드라인 업데이트 (중복 제거 필요 시 로직 추가 가능)
          setAlignmentGuides(guides);

          // 최종 위치 적용
          moveNote(id, snappedX, snappedY);
          debouncedSave({ x: snappedX, y: snappedY });
        }

        // 포인터 위치 갱신
        lastPointerRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isEditing, zoom, selectedNoteIds, isSelected, moveNotes, moveNote, id, x, y, debouncedSave, setAlignmentGuides]
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

      // 가이드라인 숨김
      setAlignmentGuides([]);

      if (selectedNoteIds.length > 1 && isSelected) {
        // 그룹 이동 종료: 일괄 저장 수행
        debouncedSave.cancel(); // 중복 저장 방지
        const currentNotes = useBoardStore.getState().notes;
        const updates = currentNotes
          .filter((n) => selectedNoteIds.includes(n.id))
          .map((n) => ({
            id: n.id,
            changes: { x: n.x, y: n.y, sectionId: n.sectionId },
          }));

        updateNotes(updates);
      } else {
        // 단일 선택: 개별 저장
        debouncedSave.cancel(); // 중복 저장 방지

        // Store에서 최신 상태(sectionId 포함)를 가져와서 저장
        const currentNote = useBoardStore.getState().notes.find(n => n.id === id);
        if (currentNote) {
          saveChanges({ x, y, sectionId: currentNote.sectionId });
        } else {
          saveChanges({ x, y });
        }
      }
    },
    [saveChanges, x, y, selectedNoteIds, isSelected, updateNotes, setAlignmentGuides]
  );

  const onPointerCancel = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
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

  return (
    <div
      role="note"
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
        width: 200,
        height: 140,
        background: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: 10,
        padding: 10,
        cursor: isEditing ? 'text' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        borderWidth: 2,
        borderColor: isSelected ? '#3B82F6' : 'transparent',
        opacity: isTempNote ? 0.7 : 1,
        zIndex: isSelected ? 9999 : zIndex,
      }}
    >
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
