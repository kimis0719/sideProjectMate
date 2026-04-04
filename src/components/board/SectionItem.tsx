'use client';

import React from 'react';
import { useBoardStore, Section, Note } from '@/store/boardStore';
import { socketClient } from '@/lib/socket';
import { useSession } from 'next-auth/react';
import { useModal } from '@/hooks/useModal';

// Color Gen Helper
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

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

// [Helper] Section Alignment Snap
const calculateSectionSnap = (
  currX: number,
  currY: number,
  width: number,
  height: number,
  myId: string,
  sections: Section[]
) => {
  const THRESHOLD = 5;
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

  sections.forEach((sec) => {
    if (sec.id === myId) return;

    const other = {
      l: sec.x,
      c: sec.x + sec.width / 2,
      r: sec.x + sec.width,
      t: sec.y,
      m: sec.y + sec.height / 2,
      b: sec.y + sec.height,
    };

    // X-Axis
    const checkX = (target: number) => {
      if (Math.abs(target - my.l) < minDiffX) {
        minDiffX = Math.abs(target - my.l);
        snappedX = target;
        bestGuideX = target;
      }
      if (Math.abs(target - my.c) < minDiffX) {
        minDiffX = Math.abs(target - my.c);
        snappedX = target - width / 2;
        bestGuideX = target;
      }
      if (Math.abs(target - my.r) < minDiffX) {
        minDiffX = Math.abs(target - my.r);
        snappedX = target - width;
        bestGuideX = target;
      }
    };
    [other.l, other.c, other.r].forEach(checkX);

    // Y-Axis
    const checkY = (target: number) => {
      if (Math.abs(target - my.t) < minDiffY) {
        minDiffY = Math.abs(target - my.t);
        snappedY = target;
        bestGuideY = target;
      }
      if (Math.abs(target - my.m) < minDiffY) {
        minDiffY = Math.abs(target - my.m);
        snappedY = target - height / 2;
        bestGuideY = target;
      }
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

// [Helper] Section Resize Snap Calculation
const calculateSectionResizeSnap = (
  currX: number,
  currY: number,
  targetWidth: number,
  targetHeight: number,
  myId: string,
  sections: Section[]
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

  sections.forEach((sec) => {
    if (sec.id === myId) return;

    const other = {
      l: sec.x,
      c: sec.x + sec.width / 2,
      r: sec.x + sec.width,
      t: sec.y,
      m: sec.y + sec.height / 2,
      b: sec.y + sec.height,
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

const SECTION_COLORS = [
  { value: '#93C5FD', label: 'blue' }, // blue-300
  { value: '#C4B5FD', label: 'purple' }, // violet-300
  { value: '#86EFAC', label: 'green' }, // green-300
  { value: '#FCA5A5', label: 'red' }, // red-300
  { value: '#FDBA74', label: 'orange' }, // orange-300
  { value: '#E5E7EB', label: 'gray' }, // gray-200 (기본)
] as const;

// border(연한) → title(진한) 톤 매핑
const SECTION_TITLE_COLOR_MAP: Record<string, string> = {
  '#93C5FD': '#1D4ED8', // blue-300 → blue-700
  '#C4B5FD': '#6D28D9', // violet-300 → violet-700
  '#86EFAC': '#15803D', // green-300 → green-700
  '#FCA5A5': '#B91C1C', // red-300 → red-700
  '#FDBA74': '#C2410C', // orange-300 → orange-700
  '#E5E7EB': '#374151', // gray-200 → gray-700
};

const getSectionTitleColor = (sectionColor: string | undefined) =>
  SECTION_TITLE_COLOR_MAP[sectionColor || '#E5E7EB'] || '#374151';

type Props = {
  section: Section;
  readOnly?: boolean;
};

export default function SectionItem({ section, readOnly = false }: Props) {
  const {
    moveSection,
    updateSection,
    removeSection,
    removeNotes,
    zoom,
    moveNotes,
    notes,
    updateNotes,
    selectNotes,
    lockedSections,
    lockedNotes,
    lockSection,
    unlockSection,
    members,
    sections,
    setAlignmentGuides,
    isSnapEnabled,
  } = useBoardStore((s) => ({
    moveSection: s.moveSection,
    updateSection: s.updateSection,
    removeSection: s.removeSection,
    removeNotes: s.removeNotes,
    zoom: s.zoom,
    moveNotes: s.moveNotes,
    notes: s.notes,
    updateNotes: s.updateNotes,
    selectNotes: s.selectNotes,
    lockedSections: s.lockedSections,
    lockedNotes: s.lockedNotes,
    lockSection: s.lockSection,
    unlockSection: s.unlockSection,
    members: s.members,
    sections: s.sections,
    setAlignmentGuides: s.setAlignmentGuides,
    isSnapEnabled: s.isSnapEnabled,
  }));

  const { data: session } = useSession();
  const { confirm, alert } = useModal();
  const myUserId = session?.user?.id || 'anonymous';

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(section.title);
  const [isColorOpen, setIsColorOpen] = React.useState(false);
  const colorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isColorOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setIsColorOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isColorOpen]);
  const isDragging = React.useRef(false);
  const hasMoved = React.useRef(false);
  const isResizing = React.useRef(false);
  const lastPointerRef = React.useRef({ x: 0, y: 0 });

  // [Refactoring] Visual Refs
  const visualRef = React.useRef<HTMLDivElement>(null);
  const currentVisual = React.useRef({
    x: section.x,
    y: section.y,
    width: section.width,
    height: section.height,
  });

  // 섹션 드래그 시 자식 노트 DOM 캐시 (드래그 시작 시 1회 빌드, 매 프레임 querySelectorAll 제거)
  const childNodeCacheRef = React.useRef<Map<HTMLElement, { startX: number; startY: number }>>(
    new Map()
  );
  // 자식 섹션 DOM 캐시 (부모 섹션 드래그 시 자식 섹션도 이동)
  const childSectionCacheRef = React.useRef<Map<HTMLElement, { startX: number; startY: number }>>(
    new Map()
  );
  const sectionDragDeltaRef = React.useRef({ x: 0, y: 0 });

  // Sync Visual State when props change (only if not interacting)
  React.useEffect(() => {
    if (!isDragging.current && !isResizing.current) {
      currentVisual.current = {
        x: section.x,
        y: section.y,
        width: section.width,
        height: section.height,
      };
      if (visualRef.current) {
        visualRef.current.style.transform = `translate3d(${section.x}px, ${section.y}px, 0)`;
        visualRef.current.style.width = `${section.width}px`;
        visualRef.current.style.height = `${section.height}px`;
      }
    }
  }, [section.x, section.y, section.width, section.height]);

  const lockInfo = lockedSections && lockedSections[section.id];
  const isLockedByOther = !!(lockInfo && lockInfo.socketId !== socketClient.socket?.id);
  const lockedByUser = isLockedByOther ? members.find((m) => m._id === lockInfo.userId) : null;
  const lockedByName = lockedByUser ? lockedByUser.nName : lockInfo?.userId || 'Unknown';
  const lockedColor = lockInfo ? stringToColor(lockInfo.userId) : '#EF4444';

  // --- 서버 저장 로직 ---
  const saveChanges = React.useCallback(
    (patch: Partial<Omit<Section, 'id'>>) => {
      fetch(`/api/kanban/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch((error) => {
        console.error('Failed to save section changes:', error);
      });
    },
    [section.id]
  );

  const debouncedSave = React.useMemo(() => debounce(saveChanges, 500), [saveChanges]);

  // --- Title Edit ---
  const startEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLockedByOther) return;

    setIsEditingTitle(true);
    if (myUserId !== 'anonymous') {
      lockSection(section.id, myUserId);
    }
  };

  const saveTitle = () => {
    updateSection(section.id, { title: titleDraft });
    saveChanges({ title: titleDraft });
    setIsEditingTitle(false);
    unlockSection(section.id);
  };

  // --- Dragging (Move) ---
  const onPointerDownHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isEditingTitle) return;
    if (isLockedByOther) return;

    isDragging.current = true;
    hasMoved.current = false;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    // Capture start position
    currentVisual.current = {
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
    };

    // 자식 노트의 DOM 요소와 시작 위치를 1회 캐싱 (매 포인터 이벤트에서 querySelectorAll 제거)
    childNodeCacheRef.current = new Map();
    childSectionCacheRef.current = new Map();
    sectionDragDeltaRef.current = { x: 0, y: 0 };
    const childEls = document.querySelectorAll(`[data-section-id="${section.id}"]`);
    childEls.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const match = htmlEl.style.transform.match(/translate3d\(([^p]+)px,\s*([^p]+)px,\s*0\)/);
      if (match) {
        childNodeCacheRef.current.set(htmlEl, {
          startX: parseFloat(match[1]),
          startY: parseFloat(match[2]),
        });
      }
    });

    // 자식 섹션 DOM 캐시 (depth=1이며 parentSectionId===section.id인 섹션들)
    const childSecs = useBoardStore
      .getState()
      .sections.filter((s) => s.parentSectionId === section.id);
    childSecs.forEach((cs) => {
      const el = document.querySelector(`[data-section-item-id="${cs.id}"]`) as HTMLElement;
      if (el) {
        const match = el.style.transform.match(/translate3d\(([^p]+)px,\s*([^p]+)px,\s*0\)/);
        if (match) {
          childSectionCacheRef.current.set(el, {
            startX: parseFloat(match[1]),
            startY: parseFloat(match[2]),
          });
        }
        // 자식 섹션의 노트도 childNodeCache에 추가
        const grandchildEls = document.querySelectorAll(`[data-section-id="${cs.id}"]`);
        grandchildEls.forEach((gEl) => {
          const gHtmlEl = gEl as HTMLElement;
          const gMatch = gHtmlEl.style.transform.match(
            /translate3d\(([^p]+)px,\s*([^p]+)px,\s*0\)/
          );
          if (gMatch) {
            childNodeCacheRef.current.set(gHtmlEl, {
              startX: parseFloat(gMatch[1]),
              startY: parseFloat(gMatch[2]),
            });
          }
        });
      }
    });

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    // 섹션 내의 모든 노트 선택
    const childNoteIds = notes.filter((n) => n.sectionId === section.id).map((n) => n.id);

    if (childNoteIds.length > 0) {
      selectNotes(childNoteIds);
    }
  };

  const onPointerMoveHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.stopPropagation();

    const rawDx = (e.clientX - lastPointerRef.current.x) / zoom;
    const rawDy = (e.clientY - lastPointerRef.current.y) / zoom;

    if (rawDx !== 0 || rawDy !== 0) {
      hasMoved.current = true;

      const prevX = currentVisual.current.x;
      const prevY = currentVisual.current.y;

      let newX = prevX + rawDx;
      let newY = prevY + rawDy;

      if (isSnapEnabled || e.altKey || e.shiftKey) {
        const {
          x: sx,
          y: sy,
          guides,
        } = calculateSectionSnap(newX, newY, section.width, section.height, section.id, sections);
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

      // Sync Child Notes (캐싱된 DOM 요소와 누적 delta 사용)
      const realDx = newX - prevX;
      const realDy = newY - prevY;

      sectionDragDeltaRef.current.x += realDx;
      sectionDragDeltaRef.current.y += realDy;
      childNodeCacheRef.current.forEach(({ startX, startY }, el) => {
        el.style.transform = `translate3d(${startX + sectionDragDeltaRef.current.x}px, ${startY + sectionDragDeltaRef.current.y}px, 0)`;
      });
      childSectionCacheRef.current.forEach(({ startX, startY }, el) => {
        el.style.transform = `translate3d(${startX + sectionDragDeltaRef.current.x}px, ${startY + sectionDragDeltaRef.current.y}px, 0)`;
      });

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerUpHeader = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    setAlignmentGuides([]); // Clear guides

    if (!hasMoved.current) return;

    const finalX = currentVisual.current.x;
    const finalY = currentVisual.current.y;
    const myCenterX = finalX + section.width / 2;
    const myCenterY = finalY + section.height / 2;

    // 자식 섹션이 드래그된 경우: 부모 경계 밖이면 릴리즈
    if (section.depth === 1 && section.parentSectionId) {
      const parent = useBoardStore
        .getState()
        .sections.find((s) => s.id === section.parentSectionId);

      if (parent) {
        const isInsideParent =
          myCenterX >= parent.x &&
          myCenterX <= parent.x + parent.width &&
          myCenterY >= parent.y &&
          myCenterY <= parent.y + parent.height;

        if (!isInsideParent) {
          // 릴리즈: 최상위로 승격
          updateSection(section.id, { parentSectionId: null, depth: 0 });
          fetch(`/api/kanban/sections/${section.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentSectionId: null, depth: 0 }),
          }).catch((err) => console.error('Failed to release child section:', err));
        }
      }
    }

    // 최상위 섹션이 드래그된 경우: 다른 최상위 섹션 안에 들어오면 자식으로 캡처
    if (!section.parentSectionId) {
      const allSections = useBoardStore.getState().sections;
      const potentialParent = allSections.find((s) => {
        if (s.id === section.id) return false;
        if ((s.depth || 0) !== 0) return false; // 최상위 섹션만 부모가 될 수 있음
        return (
          myCenterX >= s.x &&
          myCenterX <= s.x + s.width &&
          myCenterY >= s.y &&
          myCenterY <= s.y + s.height
        );
      });

      if (potentialParent) {
        updateSection(section.id, { parentSectionId: potentialParent.id, depth: 1 });
        fetch(`/api/kanban/sections/${section.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentSectionId: potentialParent.id, depth: 1 }),
        }).catch((err) => console.error('Failed to capture section into parent:', err));
      }
    }

    // 드래그 종료 시: 섹션 위치 저장 + 하위 노트 위치 저장
    debouncedSave.cancel();

    // 1. Move Section (Store Update - 자식 섹션 + 모든 노트 이동 포함됨)
    moveSection(section.id, finalX, finalY);
    saveChanges({ x: finalX, y: finalY });

    // 2. 자식 섹션 DB 저장
    const childSections = useBoardStore
      .getState()
      .sections.filter((s) => s.parentSectionId === section.id);
    childSections.forEach((cs) => {
      fetch(`/api/kanban/sections/${cs.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: cs.x, y: cs.y }),
      }).catch((err) => console.error('Failed to update child section:', err));
    });

    // 3. Move Child Notes (DB Save Only) - 모든 소속 노트 (부모 + 자식 섹션의 노트)
    const allMovedSectionIds = [section.id, ...childSections.map((cs) => cs.id)];
    const allChildNotes = useBoardStore
      .getState()
      .notes.filter((n) => n.sectionId && allMovedSectionIds.includes(n.sectionId.toString()));

    if (allChildNotes.length > 0) {
      const updates = allChildNotes.map((n) => ({
        id: n.id,
        changes: { x: n.x, y: n.y },
      }));

      fetch('/api/kanban/notes/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      }).catch((err) => console.error('Failed to batch update child notes:', err));
    }
  };

  // --- Resizing ---
  const onPointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isLockedByOther) return;

    isResizing.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    // Capture start
    currentVisual.current = {
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
    };

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing.current) return;
    e.stopPropagation();

    const dx = (e.clientX - lastPointerRef.current.x) / zoom;
    const dy = (e.clientY - lastPointerRef.current.y) / zoom;

    if (dx !== 0 || dy !== 0) {
      let newWidth = Math.max(200, currentVisual.current.width + dx);
      let newHeight = Math.max(100, currentVisual.current.height + dy);

      // [Snap Logic]
      if (isSnapEnabled || e.altKey || e.shiftKey) {
        const { w, h, guides } = calculateSectionResizeSnap(
          currentVisual.current.x,
          currentVisual.current.y,
          newWidth,
          newHeight,
          section.id,
          sections
        );
        newWidth = w;
        newHeight = h;
        setAlignmentGuides(guides);
      } else {
        setAlignmentGuides([]);
      }

      // Visual Update Only
      currentVisual.current.width = newWidth;
      currentVisual.current.height = newHeight;

      if (visualRef.current) {
        visualRef.current.style.width = `${newWidth}px`;
        visualRef.current.style.height = `${newHeight}px`;
      }

      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing.current) return;
    isResizing.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    debouncedSave.cancel();
    setAlignmentGuides([]); // Clear guides

    const finalWidth = currentVisual.current.width;
    const finalHeight = currentVisual.current.height;

    // Store Update (Undo 1회)
    updateSection(section.id, { width: finalWidth, height: finalHeight });
    saveChanges({ width: finalWidth, height: finalHeight });

    // Resize 종료 시 capture/release
    const NOTE_WIDTH = 200;
    const NOTE_HEIGHT = 140;
    const updates: { id: string; changes: Partial<Note> }[] = [];

    const currentNotes = useBoardStore.getState().notes;

    const secX = currentVisual.current.x;
    const secY = currentVisual.current.y;

    // 부모 섹션인 경우: 자식 섹션 목록을 미리 조회 (자식 섹션 안의 노트는 캡처하지 않음)
    const allSectionsForCapture = useBoardStore.getState().sections;
    const childSectionIds = allSectionsForCapture
      .filter((s) => s.parentSectionId === section.id)
      .map((s) => s.id);

    currentNotes.forEach((note) => {
      const noteCenterX = note.x + NOTE_WIDTH / 2;
      const noteCenterY = note.y + NOTE_HEIGHT / 2;

      const isInside =
        noteCenterX >= secX &&
        noteCenterX <= secX + finalWidth &&
        noteCenterY >= secY &&
        noteCenterY <= secY + finalHeight;

      if (isInside) {
        // 부모 섹션이 캡처하려 할 때: 노트가 자식 섹션 안에 있으면 건너뜀
        if (childSectionIds.length > 0 && note.sectionId === null) {
          const isInsideChild = allSectionsForCapture.some((cs) => {
            if (cs.parentSectionId !== section.id) return false;
            return (
              noteCenterX >= cs.x &&
              noteCenterX <= cs.x + cs.width &&
              noteCenterY >= cs.y &&
              noteCenterY <= cs.y + cs.height
            );
          });
          if (isInsideChild) return; // 자식 섹션이 캡처할 노트이므로 부모는 건너뜀
        }
        if (note.sectionId === null || note.sectionId === undefined) {
          updates.push({ id: note.id, changes: { sectionId: section.id } });
        }
      } else {
        if (note.sectionId === section.id) {
          // 릴리즈 시: 노트가 자식 섹션 안에 있으면 자식 섹션으로 재할당
          const targetChild = allSectionsForCapture.find((cs) => {
            if (cs.parentSectionId !== section.id) return false;
            return (
              noteCenterX >= cs.x &&
              noteCenterX <= cs.x + cs.width &&
              noteCenterY >= cs.y &&
              noteCenterY <= cs.y + cs.height
            );
          });
          updates.push({
            id: note.id,
            changes: { sectionId: targetChild ? targetChild.id : null },
          });
        }
      }
    });

    if (updates.length > 0) {
      updateNotes(updates);
    }

    // 리사이즈 종료 시 섹션 자동 캡처/릴리즈 (depth=0인 섹션만 대상)
    if (!section.parentSectionId) {
      const allSections = useBoardStore.getState().sections;
      const sectionUpdates: { id: string; changes: Partial<Section> }[] = [];

      allSections.forEach((s) => {
        if (s.id === section.id) return;
        if (s.depth !== 0) return; // 이미 자식인 섹션은 대상 아님

        const sCenterX = s.x + s.width / 2;
        const sCenterY = s.y + s.height / 2;
        const isInside =
          sCenterX >= secX &&
          sCenterX <= secX + finalWidth &&
          sCenterY >= secY &&
          sCenterY <= secY + finalHeight;

        if (isInside && s.parentSectionId !== section.id) {
          sectionUpdates.push({
            id: s.id,
            changes: { parentSectionId: section.id, depth: 1 },
          });
        }
      });

      // 기존 자식 중 범위를 벗어난 것은 릴리즈
      allSections.forEach((s) => {
        if (s.parentSectionId !== section.id) return;
        const sCenterX = s.x + s.width / 2;
        const sCenterY = s.y + s.height / 2;
        const isStillInside =
          sCenterX >= secX &&
          sCenterX <= secX + finalWidth &&
          sCenterY >= secY &&
          sCenterY <= secY + finalHeight;

        if (!isStillInside) {
          sectionUpdates.push({
            id: s.id,
            changes: { parentSectionId: null, depth: 0 },
          });
        }
      });

      sectionUpdates.forEach(({ id, changes }) => {
        updateSection(id, changes);
        fetch(`/api/kanban/sections/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes),
        }).catch((err) => console.error('Failed to update section nesting:', err));
      });
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    // 1. 잠금 확인
    const childNoteIds = notes.filter((n) => n.sectionId === section.id).map((n) => n.id);

    if (
      lockedSections &&
      lockedSections[section.id] &&
      lockedSections[section.id].socketId !== socketClient.socket?.id
    ) {
      await alert('삭제 불가', '다른 사용자가 이 섹션을 편집 중입니다.');
      return;
    }

    const lockedChildNotes = childNoteIds.filter((id) => {
      const lock = lockedNotes && lockedNotes[id];
      return lock && lock.socketId !== socketClient.socket?.id;
    });

    if (lockedChildNotes.length > 0) {
      await alert(
        '삭제 불가',
        `섹션 내에 다른 사용자가 편집 중인 노트가 ${lockedChildNotes.length}개 있습니다.\n삭제할 수 없습니다.`
      );
      return;
    }

    // 1단계: 노트 포함 전체 삭제 여부 확인
    const isDeleteAll = await confirm(
      '섹션 삭제',
      `섹션과 내부 노트(${childNoteIds.length}개)를 모두 삭제할까요?`,
      {
        confirmText: '모두 삭제',
        cancelText: '취소',
        isDestructive: true,
        closeOnBackdropClick: false,
      }
    );

    if (isDeleteAll === true) {
      // [모두 삭제] 클릭 시: 섹션과 내부 노트 전부 삭제
      if (childNoteIds.length > 0) {
        removeNotes(childNoteIds);
      }
      removeSection(section.id);
      await fetch(`/api/kanban/sections/${section.id}?deleteNotes=false`, { method: 'DELETE' });
      return;
    }

    // 2단계: 섹션만 삭제할지 확인 (노트는 보드에 유지)
    const isSectionOnly = await confirm('섹션만 삭제', '섹션만 삭제하고 노트는 보드에 남길까요?', {
      confirmText: '섹션만 삭제',
      cancelText: '취소',
      closeOnBackdropClick: false,
    });

    if (isSectionOnly === true) {
      removeSection(section.id);
      const res = await fetch(`/api/kanban/sections/${section.id}?deleteNotes=false`, {
        method: 'DELETE',
      });
      const resJson = await res.json();

      // 자식 섹션들 최상위 승격 (store 업데이트)
      const promotedChildIds: string[] = resJson.promotedChildIds || [];
      promotedChildIds.forEach((childId) => {
        updateSection(childId, { parentSectionId: null, depth: 0 });
      });

      const childNotes = notes.filter((n) => n.sectionId === section.id);
      if (childNotes.length > 0) {
        const updates = childNotes.map((n) => ({
          id: n.id,
          changes: { sectionId: null },
        }));
        updateNotes(updates);
      }
    }
  };

  return (
    <div
      ref={visualRef}
      data-section-item-id={section.id}
      style={{
        position: 'absolute',
        transform: `translate3d(${section.x}px, ${section.y}px, 0)`,
        width: section.width,
        height: section.height,
        zIndex: section.zIndex || 0,
        display: 'flex',
        flexDirection: 'column',
        border: isLockedByOther
          ? `3px solid ${lockedColor}`
          : `2px dashed ${section.color || '#E5E7EB'}`,
        borderRadius: 16,
        backgroundColor: 'rgba(243, 244, 243, 0.2)',
        opacity: readOnly ? 0.4 : 1,
        pointerEvents: readOnly ? 'none' : 'auto',
      }}
    >
      {/* Lock Indicator */}
      {isLockedByOther && (
        <div
          style={{
            position: 'absolute',
            top: -24,
            left: 0,
            background: lockedColor,
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '4px 4px 4px 0',
            zIndex: 100,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {lockedByName}
        </div>
      )}

      {/* Header (Drag Handle) */}
      <div
        onPointerDown={onPointerDownHeader}
        onPointerMove={onPointerMoveHeader}
        onPointerUp={onPointerUpHeader}
        onDoubleClick={startEditTitle}
        style={{
          height: 40,
          background: 'transparent',
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          cursor: isLockedByOther ? 'not-allowed' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid black',
              outline: 'none',
              fontSize: 16,
              fontWeight: 'bold',
              width: '100%',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: readOnly ? '#9CA3AF' : getSectionTitleColor(section.color),
              textDecoration: readOnly ? 'line-through' : 'none',
            }}
          >
            {readOnly && '✅ '}
            {section.title}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* 색상 변경 버튼 */}
          <div ref={colorRef} style={{ position: 'relative' }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLockedByOther) setIsColorOpen(!isColorOpen);
              }}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: section.color || '#E5E7EB',
                border: '2px solid rgba(255,255,255,0.8)',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                opacity: isLockedByOther ? 0.5 : 1,
                pointerEvents: isLockedByOther ? 'none' : 'auto',
              }}
              title="섹션 색상 변경"
            />
            {isColorOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 0,
                  background: 'white',
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid #F3F4F6',
                  display: 'flex',
                  gap: 6,
                  zIndex: 50,
                }}
              >
                {SECTION_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSection(section.id, { color: c.value });
                      setIsColorOpen(false);
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: c.value,
                      border:
                        c.value === section.color
                          ? '2px solid #3B82F6'
                          : '1px solid rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 삭제 버튼 */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLockedByOther) handleDelete();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#9CA3AF',
              opacity: isLockedByOther ? 0.5 : 1,
              pointerEvents: isLockedByOther ? 'none' : 'auto',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = '#6B7280';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = '#9CA3AF';
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body (Container) */}
      <div
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          pointerEvents: 'none',
        }}
      />

      {/* Resize Handle */}
      <div
        onPointerDown={onPointerDownResize}
        onPointerMove={onPointerMoveResize}
        onPointerUp={onPointerUpResize}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          cursor: isLockedByOther ? 'default' : 'nwse-resize',
          touchAction: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLockedByOther ? 0 : 1,
          pointerEvents: isLockedByOther ? 'none' : 'auto',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#CBD5E1">
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
        </svg>
      </div>
    </div>
  );
}
