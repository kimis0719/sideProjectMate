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
  isDoneView?: boolean;
  completedAt?: Date;
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

const COLOR_PALETTE = ['#fef9c3', '#dcfce7', '#fce7f3', '#dbeafe', '#f3e8ff', '#FEF3C7'] as const;
const SNAP_THRESHOLD = 3;
const GRID_SIZE = 10;

// [Helper] Note Alignment Snap Calculation
// 현재 이동 중인 노트와 다른 노트들 간의 정렬 위치를 계산하고 가이드라인 정보를 반환합니다.
const calculateSnap = (
  currX: number,
  currY: number,
  width: number,
  height: number,
  myId: string,
  notes: Note[]
) => {
  const THRESHOLD = 5; // 5px 이내 접근 시 스냅
  let snappedX = currX;
  let snappedY = currY;
  const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

  let minDiffX = THRESHOLD + 1;
  let minDiffY = THRESHOLD + 1;
  let bestGuideX: number | null = null;
  let bestGuideY: number | null = null;

  const my = {
    l: currX,
    c: currX + width / 2,
    r: currX + width,
    t: currY,
    m: currY + height / 2,
    b: currY + height,
  };

  notes.forEach((note) => {
    if (note.id === myId) return;

    const other = {
      l: note.x,
      c: note.x + note.width / 2,
      r: note.x + note.width,
      t: note.y,
      m: note.y + note.height / 2,
      b: note.y + note.height,
    };

    // X-Axis Snap (Vertical Guides)
    const checkX = (target: number) => {
      // My Left -> Target
      if (Math.abs(target - my.l) < minDiffX) {
        minDiffX = Math.abs(target - my.l);
        snappedX = target;
        bestGuideX = target;
      }
      // My Center -> Target
      if (Math.abs(target - my.c) < minDiffX) {
        minDiffX = Math.abs(target - my.c);
        snappedX = target - width / 2;
        bestGuideX = target;
      }
      // My Right -> Target
      if (Math.abs(target - my.r) < minDiffX) {
        minDiffX = Math.abs(target - my.r);
        snappedX = target - width;
        bestGuideX = target;
      }
    };
    [other.l, other.c, other.r].forEach(checkX);

    // Y-Axis Snap (Horizontal Guides)
    const checkY = (target: number) => {
      // My Top
      if (Math.abs(target - my.t) < minDiffY) {
        minDiffY = Math.abs(target - my.t);
        snappedY = target;
        bestGuideY = target;
      }
      // My Middle
      if (Math.abs(target - my.m) < minDiffY) {
        minDiffY = Math.abs(target - my.m);
        snappedY = target - height / 2;
        bestGuideY = target;
      }
      // My Bottom
      if (Math.abs(target - my.b) < minDiffY) {
        minDiffY = Math.abs(target - my.b);
        snappedY = target - height;
        bestGuideY = target;
      }
    };
    [other.t, other.m, other.b].forEach(checkY);
  });

  if (bestGuideX !== null) guides.push({ type: 'vertical', x: bestGuideX });
  if (bestGuideY !== null) guides.push({ type: 'horizontal', y: bestGuideY });

  return { x: snappedX, y: snappedY, guides };
};

// [Helper] Note Resize Snap Calculation
const calculateResizeSnap = (
  currX: number,
  currY: number,
  targetWidth: number,
  targetHeight: number,
  myId: string,
  notes: Note[]
) => {
  const THRESHOLD = 5;
  let snappedWidth = targetWidth;
  let snappedHeight = targetHeight;
  const guides: { type: 'vertical' | 'horizontal'; x?: number; y?: number }[] = [];

  // My Edges (Right and Bottom only for resize)
  const myR = currX + targetWidth;
  const myB = currY + targetHeight;

  let minDiffX = THRESHOLD + 1;
  let minDiffY = THRESHOLD + 1;
  let bestGuideX: number | null = null;
  let bestGuideY: number | null = null;

  notes.forEach((note) => {
    if (note.id === myId) return;

    const other = {
      l: note.x,
      c: note.x + note.width / 2,
      r: note.x + note.width,
      t: note.y,
      m: note.y + note.height / 2,
      b: note.y + note.height,
    };

    // X-Axis Match (My Right vs Other L/C/R)
    const checkX = (target: number) => {
      if (Math.abs(target - myR) < minDiffX) {
        minDiffX = Math.abs(target - myR);
        snappedWidth = target - currX;
        bestGuideX = target;
      }
    };
    [other.l, other.c, other.r].forEach(checkX);

    // Y-Axis Match (My Bottom vs Other T/M/B)
    const checkY = (target: number) => {
      if (Math.abs(target - myB) < minDiffY) {
        minDiffY = Math.abs(target - myB);
        snappedHeight = target - currY;
        bestGuideY = target;
      }
    };
    [other.t, other.m, other.b].forEach(checkY);
  });

  if (bestGuideX !== null) guides.push({ type: 'vertical', x: bestGuideX });
  if (bestGuideY !== null) guides.push({ type: 'horizontal', y: bestGuideY });

  return { w: snappedWidth, h: snappedHeight, guides };
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
  tags = [],
  isDoneView = false,
  completedAt,
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
    peerSelections,
    completeNote,
    revertNote,
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
    peerSelections: s.peerSelections,
    completeNote: s.completeNote,
    revertNote: s.revertNote,
  }));

  const { data: session } = useSession();
  const myUserId = session?.user?.id || 'anonymous';

  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(text);
  const [tagInput, setTagInput] = React.useState('');
  const [isHovered, setIsHovered] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);

  const isDragging = React.useRef(false);
  const isResizing = React.useRef(false);
  const hasMoved = React.useRef(false);
  const lastPointerRef = React.useRef({ x: 0, y: 0 });

  // [Refactoring] Drag/Resize Visual Updates without Store updates
  const visualRef = React.useRef<HTMLDivElement>(null);
  const currentVisual = React.useRef({ x, y, width, height });

  // Sync refs when props change (only if not dragging/resizing)
  React.useEffect(() => {
    if (!isDragging.current && !isResizing.current) {
      currentVisual.current = { x, y, width, height };
      if (visualRef.current) {
        visualRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        visualRef.current.style.width = `${width}px`;
        visualRef.current.style.height = `${height}px`;
      }
    }
  }, [x, y, width, height]);

  const isSelected = selectedNoteIds.includes(id);
  const isPaletteOpen = openPaletteNoteId === id;
  const isTempNote = id.startsWith('temp-');

  const lockInfo = lockedNotes && lockedNotes[id];
  const isLockedByOther = !!(lockInfo && lockInfo.socketId !== socketClient.socket?.id);
  const lockedByUser = isLockedByOther ? members.find((m) => m._id === lockInfo.userId) : null;
  const lockedByName = lockedByUser ? lockedByUser.nName : lockInfo?.userId || 'Unknown';
  const lockedColor = lockInfo ? stringToColor(lockInfo.userId) : '#EF4444';

  const peerSelection =
    peerSelections && peerSelections[id]
      ? peerSelections[id].find((s) => s.socketId !== socketClient.socket?.id)
      : null;
  const isPeerSelected = !!peerSelection;
  const peerColor = peerSelection ? peerSelection.color : 'transparent';

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
      if (isDoneView) return;
      if (isLockedByOther) return;

      setDraft(text);
      setIsEditing(true);
      selectNote(id);

      if (myUserId !== 'anonymous') {
        lockNote(id, myUserId);
      }
    },
    [text, id, selectNote, isLockedByOther, isDoneView, lockNote, myUserId]
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

  const getMemberInfo = React.useCallback(
    (memberId?: string) => {
      if (!memberId) return null;
      const member = members.find((m) => m._id === memberId);
      if (!member) return { name: 'Unknown', avatarUrl: null, initial: '?' };
      return {
        name: member.nName,
        avatarUrl: member.avatarUrl,
        initial: member.nName.charAt(0).toUpperCase(),
      };
    },
    [members]
  );

  const creatorInfo = getMemberInfo(creatorId);
  const assigneeInfo = getMemberInfo(assigneeId);

  // --- Mobile Double Tap Logic ---
  const lastTapRef = React.useRef<number>(0);
  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
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
    },
    [isLockedByOther, text, id, selectNote, myUserId, lockNote, isSelectionMode]
  );

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
    // 리사이즈 중에는 자동 높이 조절 안 함
    if (isResizing.current) return;

    let contentHeight = 0;

    // 1. Measure Content Height
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = '0px';
      contentHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = '100%';
    } else if (!isEditing && contentRef.current) {
      // [Bug Fix]
      // 기존 코드: contentHeight = contentRef.current.offsetHeight;
      // 원인: contentRef는 flex-1 스타일로 인해 부모(NoteItem)의 높이가 커지면 같이 늘어남.
      //       이로 인해 '부모 높이 증가 -> contentRef 높이 증가 -> 계산된 safeHeight 증가 -> 부모 높이 업데이트'의 무한 루프 발생.
      // 해결: 늘어나는 컨테이너가 아닌, 실제 내부 텍스트 콘텐츠(Markdown Wrapper)의 높이를 측정하도록 변경.
      const innerContent = contentRef.current.firstElementChild as HTMLElement;
      contentHeight = innerContent ? innerContent.offsetHeight : 0;
    }

    // 2. Calculate Total Height
    const PADDING_TOP = 28;
    const PADDING_BOTTOM = 8;
    const FOOTER_HEIGHT = 48;

    const tagsH = tagsRef.current ? tagsRef.current.offsetHeight : 0;
    const tagsMargin = tags.length > 0 && tagsH > 0 ? 8 : 0;

    const totalCalculatedHeight =
      PADDING_TOP + tagsH + tagsMargin + contentHeight + PADDING_BOTTOM + FOOTER_HEIGHT;

    const safeHeight = Math.max(140, totalCalculatedHeight);

    // 3. Update Height
    if (Math.abs(safeHeight - height) > 2) {
      // 로컬 Visual 업데이트
      // 높이 변경도 Undo 스택에 쌓일 수 있으므로 주의.
      // 하지만 여기서 updateNote를 부르면 equality 검사로 인해 무시되도록 설정했음.
      // 따라서 updateNote 호출은 안전함(높이 변화만 있으면 히스토리 안 쌓임).
      if (isEditing) {
        updateNote(id, { height: safeHeight });
        debouncedSave({ height: safeHeight });
      } else if (safeHeight > height) {
        updateNote(id, { height: safeHeight });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isEditing, tags, text]);

  // Drag Accumulator for Multi-Select
  const totalDragRef = React.useRef({ x: 0, y: 0 });

  // 다중 선택 드래그 시 DOM 캐시 (드래그 시작 시 1회 빌드, 매 프레임 querySelector 제거)
  const nodeCacheRef = React.useRef<
    Map<string, { el: HTMLElement; startX: number; startY: number }>
  >(new Map());

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (isDoneView) return;
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
      useBoardStore.getState().setIsDraggingNote(true);
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      totalDragRef.current = { x: 0, y: 0 };

      // 현재 상태 캡처 (드래그 시작 좌표)
      currentVisual.current = { x, y, width, height };

      // 다중 선택 드래그 시 선택된 노트들의 DOM 요소와 시작 위치를 1회 캐싱
      nodeCacheRef.current = new Map();
      const { selectedNoteIds: currentSelected, notes: allNotes } = useBoardStore.getState();
      if (currentSelected.length > 1) {
        currentSelected.forEach((selectedId) => {
          if (selectedId === id) return;
          const el = document.querySelector(`[data-note-id="${selectedId}"]`) as HTMLElement;
          const note = allNotes.find((n) => n.id === selectedId);
          if (el && note) {
            nodeCacheRef.current.set(selectedId, { el, startX: note.x, startY: note.y });
          }
        });
      }

      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    },
    [
      isEditing,
      isDoneView,
      id,
      selectNote,
      isSelected,
      isLockedByOther,
      isSelectionMode,
      x,
      y,
      width,
      height,
    ]
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

          let newWidth = currentVisual.current.width + dx;
          let newHeight = currentVisual.current.height + dy;

          // [Snap Logic]
          if (isSnapEnabled || e.altKey || e.shiftKey) {
            const allNotes = useBoardStore.getState().notes;
            const { w, h, guides } = calculateResizeSnap(
              currentVisual.current.x,
              currentVisual.current.y,
              newWidth,
              newHeight,
              id,
              allNotes
            );
            newWidth = w;
            newHeight = h;
            setAlignmentGuides(guides);
          } else {
            setAlignmentGuides([]);
          }

          newWidth = Math.min(Math.max(100, newWidth), MAX_WIDTH);
          newHeight = Math.min(Math.max(100, newHeight), MAX_HEIGHT);

          // Direct DOM Manipulation
          if (visualRef.current) {
            visualRef.current.style.width = `${newWidth}px`;
            visualRef.current.style.height = `${newHeight}px`;
          }
          currentVisual.current.width = newWidth;
          currentVisual.current.height = newHeight;
        }
      }
      // 2. 드래그(이동) 로직
      else if (isDragging.current) {
        if (isSelectionMode) return;

        if (dx !== 0 || dy !== 0) {
          hasMoved.current = true;
          totalDragRef.current.x += dx;
          totalDragRef.current.y += dy;

          // 이동할 새로운 좌표 계산
          let newX = currentVisual.current.x + dx;
          let newY = currentVisual.current.y + dy;

          // [Snap Logic & Alignment Guides]
          // 자석 모드(Snap)가 켜져있거나, Alt 또는 Shift 키를 누르고 있을 때 동작
          // 빨간 줄(가이드라인)을 표시하고 근처 노트에 스냅됨
          if (selectedNoteIds.length <= 1 && (isSnapEnabled || e.altKey || e.shiftKey)) {
            const allNotes = useBoardStore.getState().notes;
            const { x: sx, y: sy, guides } = calculateSnap(newX, newY, width, height, id, allNotes);

            // 만약 가이드에 의한 스냅이 없으면, GRID 스냅 적용 (선택적)
            // 여기서는 Alignment Snap을 우선시하고, 가이드가 없으면 Grid Snap 적용 가능하지 않음 (사용자 요구사항은 Alignment Snap)
            // 따라서 Alignment 결과값을 바로 적용.
            newX = sx;
            newY = sy;
            setAlignmentGuides(guides);
          } else {
            setAlignmentGuides([]);
          }

          currentVisual.current.x = newX;
          currentVisual.current.y = newY;

          if (visualRef.current) {
            visualRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
          }

          // 다중 선택된 노트들의 이동 처리 (드래그 시작 시 캐싱된 DOM 요소 사용)
          if (selectedNoteIds.length > 1 && isSelected) {
            nodeCacheRef.current.forEach(({ el, startX, startY }) => {
              el.style.transform = `translate3d(${startX + totalDragRef.current.x}px, ${startY + totalDragRef.current.y}px, 0)`;
            });
          }
        }
      }

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    },
    [
      isEditing,
      isDragging,
      isResizing,
      zoom,
      width,
      height,
      id,
      selectedNoteIds,
      isSelected,
      isSelectionMode,
      isSnapEnabled,
      setAlignmentGuides,
    ]
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // 리사이즈 종료 처리
      if (isResizing.current) {
        isResizing.current = false;
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

        // 최종 크기 저장 (Store Update -> Undo Stack 1회 저장)
        const finalWidth = currentVisual.current.width;
        const finalHeight = currentVisual.current.height;

        updateNote(id, { width: finalWidth, height: finalHeight });
        debouncedSave.cancel(); // 중간 저장 취소
        saveChanges({ width: finalWidth, height: finalHeight }); // 최종 저장
        setAlignmentGuides([]); // Clear Guides
        return;
      }

      // 드래그 종료 처리
      if (!isDragging.current) return;
      isDragging.current = false;
      useBoardStore.getState().setIsDraggingNote(false);
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      setAlignmentGuides([]);

      if (!hasMoved.current) {
        debouncedSave.cancel(); // 이동 안했으면 저장 안함
        return;
      }

      if (selectedNoteIds.length > 1 && isSelected) {
        // 다중 선택 이동: 누적된 이동 거리(totalDragRef)를 사용하여 Store 및 DB 업데이트
        debouncedSave.cancel();

        const tdx = totalDragRef.current.x;
        const tdy = totalDragRef.current.y;

        // 1. Store Update (moveNotes Action)
        moveNotes(selectedNoteIds, tdx, tdy);

        // 2. DB Update (Batch)
        // Store 업데이트 후, DB에는 '이동 된 좌표'를 보내거나, '이동 전 좌표 + 델타'를 보내야 함.
        // 여기서는 안전하게 계산된 값을 보냄.
        const { notes: currentNotes, sections: allSecs } = useBoardStore.getState();
        const sortedSecs = [...allSecs].sort((a, b) => (b.depth || 0) - (a.depth || 0));
        const updates = currentNotes
          .filter((n) => selectedNoteIds.includes(n.id))
          .map((n) => {
            const cx = n.x + (n.width || 200) / 2;
            const cy = n.y + (n.height || 140) / 2;
            let capId: string | null = null;
            for (const sec of sortedSecs) {
              if (
                cx >= sec.x &&
                cx <= sec.x + sec.width &&
                cy >= sec.y &&
                cy <= sec.y + sec.height
              ) {
                capId = sec.id;
                break;
              }
            }
            updateNote(n.id, { sectionId: capId });
            return { id: n.id, changes: { x: n.x, y: n.y, sectionId: capId } };
          });

        fetch('/api/kanban/notes/batch', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        }).catch((err) => console.error('Batch move failed:', err));
      } else {
        // 단일 선택의 경우, Visual만 바뀌어 있으므로 이제 Store Update
        const finalX = currentVisual.current.x;
        const finalY = currentVisual.current.y;

        // 스냅 로직 적용
        let snappedX = finalX;
        let snappedY = finalY;

        if (isSnapEnabled || e.altKey) {
          if (Math.abs(snappedX % GRID_SIZE) < SNAP_THRESHOLD)
            snappedX = Math.round(snappedX / GRID_SIZE) * GRID_SIZE;
          if (Math.abs(snappedY % GRID_SIZE) < SNAP_THRESHOLD)
            snappedY = Math.round(snappedY / GRID_SIZE) * GRID_SIZE;
        }

        // 인박스 영역 위에 드롭했는지 체크 (화면 우측 인박스 패널)
        const inboxEl = document.querySelector('[data-inbox-panel]');
        if (inboxEl) {
          const inboxRect = inboxEl.getBoundingClientRect();
          if (
            e.clientX >= inboxRect.left &&
            e.clientX <= inboxRect.right &&
            e.clientY >= inboxRect.top &&
            e.clientY <= inboxRect.bottom
          ) {
            // 인박스로 이동: 좌표 null
            updateNote(id, {
              x: null as unknown as number,
              y: null as unknown as number,
              sectionId: null,
            });
            saveChanges({ x: null, y: null, sectionId: null } as unknown as Partial<
              Omit<Note, 'id'>
            >);
            return;
          }
        }

        moveNote(id, snappedX, snappedY); // Store Update (Undo 1회 저장)
        debouncedSave.cancel();

        // Auto-capture: 노트 중심이 어떤 섹션 안에 있는지 계산 → 항상 sectionId 포함하여 저장
        const allSections = useBoardStore.getState().sections;
        const noteCX = snappedX + (width || 200) / 2;
        const noteCY = snappedY + (height || 140) / 2;
        let capturedSectionId: string | null = null;
        for (const sec of [...allSections].sort((a, b) => (b.depth || 0) - (a.depth || 0))) {
          if (
            noteCX >= sec.x &&
            noteCX <= sec.x + sec.width &&
            noteCY >= sec.y &&
            noteCY <= sec.y + sec.height
          ) {
            capturedSectionId = sec.id;
            break;
          }
        }
        updateNote(id, { sectionId: capturedSectionId });
        saveChanges({ x: snappedX, y: snappedY, sectionId: capturedSectionId });
      }
    },
    [
      saveChanges,
      id,
      updateNote,
      selectedNoteIds,
      isSelected,
      setAlignmentGuides,
      debouncedSave,
      isSnapEnabled,
      moveNote,
      width,
      height,
      moveNotes,
    ]
  );

  const onPointerCancel = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = false;
      useBoardStore.getState().setIsDraggingNote(false);
      isResizing.current = false;
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      setAlignmentGuides([]);
      // Visual 되돌리기 (원상복구)
      if (visualRef.current) {
        visualRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        visualRef.current.style.width = `${width}px`;
        visualRef.current.style.height = `${height}px`;
      }
    },
    [setAlignmentGuides, x, y, width, height]
  );

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

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEditing) return;

      const STEP = e.shiftKey ? 50 : 10;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp':
          dy = -STEP;
          break;
        case 'ArrowDown':
          dy = STEP;
          break;
        case 'ArrowLeft':
          dx = -STEP;
          break;
        case 'ArrowRight':
          dx = STEP;
          break;
        case 'Enter':
          e.preventDefault();
          setIsEditing(true);
          return;
        case 'Delete':
          e.preventDefault();
          removeNote(id);
          return;
        default:
          return;
      }

      e.preventDefault();
      e.stopPropagation();

      const newX = x + dx;
      const newY = y + dy;
      moveNote(id, newX, newY);
      debouncedSave({ x: newX, y: newY });
    },
    [isEditing, x, y, id, moveNote, debouncedSave, setIsEditing, removeNote]
  );

  // --- Box-Shadow (Border Replacement) ---
  const baseShadow = '0 4px 12px rgba(0,0,0,0.08)';
  let ringShadow = '';

  if (isLockedByOther) {
    ringShadow = `inset 0 0 0 3px ${lockedColor}`;
  } else if (isSelected) {
    ringShadow = `inset 0 0 0 2px #3B82F6`;
  } else if (isPeerSelected) {
    ringShadow = `inset 0 0 0 2px ${peerColor}`;
  }

  const hoverShadow = '0 8px 24px rgba(0,0,0,0.12)';
  const finalShadow = ringShadow ? `${baseShadow}, ${ringShadow}` : baseShadow;
  const finalHoverShadow = ringShadow ? `${hoverShadow}, ${ringShadow}` : hoverShadow;

  return (
    <div
      ref={visualRef} // Attach Ref
      role="note"
      data-note-id={id} // For DOM manipulation
      data-section-id={useBoardStore.getState().notes.find((n) => n.id === id)?.sectionId || ''}
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        width: width,
        height: height,
        background: isDoneView ? `${color}99` : color,
        boxShadow: isHovered && !isEditing && !isDoneView ? finalHoverShadow : finalShadow,
        borderRadius: 8,
        padding: 0,
        cursor: isDoneView ? 'default' : isEditing ? 'text' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        touchAction: 'none',
        overscrollBehavior: 'contain',
        outline: 'none',
        opacity: isTempNote ? 0.7 : isCompleting ? 0 : isDoneView ? 0.6 : 1,
        transition: isCompleting
          ? 'opacity 0.3s ease, transform 0.3s ease'
          : 'box-shadow 0.2s ease',
        transform: `translate3d(${x}px, ${y}px, 0)${isHovered && !isEditing && !isDoneView ? ' scale(1.02)' : ''}`,
        zIndex: isSelected ? 9999 : isHovered ? 10 : zIndex,
        pointerEvents: isLockedByOther ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Lock Indicator */}
      {isLockedByOther && (
        <div
          style={{
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
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          {lockedByName}님이 편집 중
        </div>
      )}

      {/* Peer Selection Indicator & Name */}
      {!isLockedByOther && isPeerSelected && (
        <>
          <div
            style={{
              position: 'absolute',
              top: -26,
              left: -2,
              background: peerColor,
              color: 'white',
              fontSize: 12,
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '4px 4px 4px 0',
              zIndex: 100,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {members.find((m) => m._id === peerSelection.userId)?.nName || peerSelection.userId}님이
            선택 중
          </div>
          <div
            style={{
              position: 'absolute',
              top: -10,
              right: -2,
              background: peerColor,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid white',
              zIndex: 100,
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          />
        </>
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
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              담당자
            </div>
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
                      <img
                        src={member.avatarUrl}
                        alt={member.nName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {member.nName[0]}
                      </div>
                    )}
                    <span
                      className={`text-xs ${assigneeId === member._id ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
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
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs flex items-center gap-1 text-gray-700 dark:text-gray-200"
                >
                  #{tag}
                  <button
                    onClick={() => {
                      const newTags = tags.filter((t) => t !== tag);
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

          {/* 4. 마감일 설정 (Input Style Change for clickable area) */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              마감일
            </div>
            <div className="relative">
              <input
                type="date"
                className="w-full text-sm border rounded px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 cursor-pointer"
                style={{ minHeight: '32px' }} // 높이 확보
                value={dueDate ? toInputDate(dueDate) : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  updateNote(id, { dueDate: date });
                  saveChanges({ dueDate: date });
                }}
              />
            </div>
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
            cursor: 'pointer',
          }}
        >
          완료
        </button>
      )}

      {/* 완료 체크박스 (진행중 뷰, hover 시 표시) */}
      {!isDoneView && !isTempNote && (
        <button
          type="button"
          aria-label="노트 완료"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={async (e) => {
            e.stopPropagation();
            setIsCompleting(true);
            await new Promise((r) => setTimeout(r, 280));
            completeNote(id);
          }}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid rgba(0,0,0,0.25)',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
          className="hover:bg-green-100 hover:border-green-500"
        />
      )}

      {/* 완료 날짜 뱃지 + 되돌리기 버튼 (완료 뷰) */}
      {isDoneView && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            zIndex: 30,
          }}
        >
          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, whiteSpace: 'nowrap' }}>
            ✅{' '}
            {completedAt
              ? `${new Date(completedAt).getFullYear()}.${String(new Date(completedAt).getMonth() + 1).padStart(2, '0')}.${String(new Date(completedAt).getDate()).padStart(2, '0')} 완료`
              : '완료'}
          </span>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              revertNote(id);
            }}
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.15)',
              background: 'white',
              cursor: 'pointer',
              color: '#6B7280',
              whiteSpace: 'nowrap',
            }}
          >
            ↩️ 되돌리기
          </button>
        </div>
      )}

      {/* Settings Button */}
      {!isDoneView && (
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="5" r="2" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="19" r="2" fill="currentColor" />
          </svg>
        </button>
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col pt-7 pb-2 px-4"
        ref={contentRef}
        style={{ overflow: 'hidden' }}
      >
        {isEditing ? (
          <>
            <textarea
              ref={textareaRef}
              defaultValue={text}
              maxLength={2000}
              onChange={(e) => {
                setDraft(e.target.value);
                // 높이 자동 조절 트리거 (LayoutEffect가 감지)
                // (state인 draft가 바뀌므로 effect 실행됨)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
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
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                fontSize: 10,
                color: draft.length > 1900 ? '#EF4444' : '#9CA3AF',
                pointerEvents: 'none',
                zIndex: 10,
                fontWeight: 600,
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: '2px 4px',
                borderRadius: 4,
              }}
            >
              {draft.length}/2000
            </div>
          </>
        ) : (
          <div
            className={`prose prose-sm max-w-none select-text pointer-events-auto cursor-text text-[15px] font-medium break-all whitespace-pre-wrap leading-relaxed ${isDoneView ? 'line-through text-zinc-400' : 'text-zinc-800'}`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preprocessMarkdown(text)}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Tags Display */}
      <div ref={tagsRef} className="px-4 flex flex-wrap gap-1">
        {tags.length > 0 &&
          tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-black/5 rounded text-[10px] text-gray-600 font-medium"
            >
              #{tag}
            </span>
          ))}
      </div>

      {/* Footer Info (D-Day, Assignee) */}
      <div className="h-12 px-4 flex items-center justify-between border-t border-black/5 mt-auto">
        <div className="flex items-center gap-2">
          {/* Avatar */}
          {assigneeId && (
            <div className="flex items-center" title={`담당자: ${assigneeInfo?.name}`}>
              {assigneeInfo?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assigneeInfo.avatarUrl}
                  alt={assigneeInfo.name}
                  className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-white shadow-sm">
                  {assigneeInfo?.initial}
                </div>
              )}
            </div>
          )}
          {/* D-Day Badge */}
          {dueDate && (
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm"
              style={{
                borderColor: getDDayInfo(dueDate).color,
                color: getDDayInfo(dueDate).color,
                backgroundColor: 'white',
              }}
            >
              {getDDayInfo(dueDate).label}
            </div>
          )}
        </div>
        <div className="text-[10px] text-gray-400">{/* 작성자 정보 등 추가 가능 */}</div>
      </div>

      {/* Resize Handle (Bottom-Right) */}
      {!isEditing && !isLockedByOther && !isDoneView && (
        <div
          onPointerDown={onResizePointerDown}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            cursor: 'nwse-resize',
            zIndex: 50, // More than content
          }}
        >
          {/* 시각적 핸들 아이콘 (Optional) */}
          <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none">
            <path d="M14 14L20 20" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
            <path d="M10 18L18 10" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  );
}
