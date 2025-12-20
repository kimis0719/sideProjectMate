'use client';

import React from 'react';
import { useBoardStore } from '@/store/boardStore';
import NoteItem from '@/components/board/NoteItem';
import SectionItem from '@/components/board/SectionItem';
import Minimap from '@/components/board/Minimap';
import ShortcutHandler from '@/components/board/ShortcutHandler';

/**
 * 임시로 사용할 공용 보드의 프로젝트 ID.
 * 유효한 프로젝트 ID가 없을 경우 이 ID를 사용하여 보드 데이터를 초기화합니다.
 */
const TEMP_PUBLIC_PID = 999999999;

type Props = {
  pid: number | undefined; // Project ID. undefined일 경우 임시 보드를 사용합니다.
};

/**
 * BoardShell 컴포넌트
 * 칸반 보드의 전체 UI와 상호작용을 담당하는 메인 컴포넌트입니다.
 * 헤더, 노트 목록, 배경 등을 렌더링합니다.
 * @param pid - 프로젝트 ID. 이 ID를 기준으로 보드 데이터를 불러옵니다.
 */
const BoardShell: React.FC<Props> = ({ pid }) => {
  const {
    notes,
    sections,
    zoom,
    pan,
    addNote,
    addSection,
    selectedNoteIds,
    removeNote,
    selectNote,
    selectNotes,
    setOpenPaletteNoteId,
    initBoard,
    setZoom,
    setPan,
    fitToContent,
    alignmentGuides,
  } = useBoardStore((s) => ({
    notes: s.notes,
    sections: s.sections,
    zoom: s.zoom,
    pan: s.pan,
    addNote: s.addNote,
    addSection: s.addSection,
    selectedNoteIds: s.selectedNoteIds,
    removeNote: s.removeNote,
    selectNote: s.selectNote,
    selectNotes: s.selectNotes,
    setOpenPaletteNoteId: s.setOpenPaletteNoteId,
    initBoard: s.initBoard,
    setZoom: s.setZoom,
    setPan: s.setPan,
    fitToContent: s.fitToContent,
    alignmentGuides: s.alignmentGuides,
  }));
  const notesCount = notes.length;

  // 현재 보드의 ID를 결정합니다. pid가 유효하면 해당 pid를, 그렇지 않으면 임시 ID를 사용합니다.
  const boardPid = pid || TEMP_PUBLIC_PID;

  const containerRef = React.useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 시 또는 boardPid가 변경될 때 서버에서 보드와 노트 데이터를 불러옵니다.
  React.useEffect(() => {
    initBoard(boardPid).then(() => {
      if (containerRef.current) {
        fitToContent(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    });
  }, [boardPid, initBoard, fitToContent]);

  // 키보드 이벤트를 처리하는 useEffect 훅
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteIds.length > 0) {
          // Temp 노트와 실제 노트를 구분
          const realNoteIds = selectedNoteIds.filter(id => !id.startsWith('temp-'));

          if (realNoteIds.length > 0) {
            // Batch Delete Action 호출
            useBoardStore.getState().removeNotes(realNoteIds);
          }

          // Temp 노트는 로컬에서만 삭제 (이미 removeNotes에서 처리되지만 명시적으로)
          // removeNotes는 로컬 상태도 업데이트하므로 별도 처리 불필요
        }
      }

      if (e.shiftKey && e.key === '!') { // Shift + 1 is '!'
        e.preventDefault();
        if (containerRef.current) {
          fitToContent(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteIds, removeNote, fitToContent]);

  // --- Pan & Zoom Logic ---
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const ZOOM_SENSITIVITY = 0.001;
        const currentZoom = useBoardStore.getState().zoom;
        let newZoom = currentZoom - e.deltaY * ZOOM_SENSITIVITY;
        if (newZoom <= 0.1) newZoom = 0.1;
        if (newZoom >= 1.5) newZoom = 1.5;
        setZoom(newZoom);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  const [isPanning, setIsPanning] = React.useState(false);
  const lastPanRef = React.useRef({ x: 0, y: 0 });
  const isDragOccurred = React.useRef(false);

  // --- Selection Box Logic ---
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectionBox, setSelectionBox] = React.useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const handleBackgroundClick = () => {
    selectNote(null);
    setOpenPaletteNoteId(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;

    e.preventDefault();

    if (e.shiftKey) {
      setIsSelecting(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
      }
    } else {
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }

    isDragOccurred.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSelecting && selectionBox) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        setSelectionBox({ ...selectionBox, currentX, currentY });
        isDragOccurred.current = true;
      }
    } else if (isPanning) {
      e.preventDefault();
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;

      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        isDragOccurred.current = true;
      }

      setPan(pan.x + dx, pan.y + dy);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isSelecting && selectionBox) {
      if (isDragOccurred.current) {
        const left = Math.min(selectionBox.startX, selectionBox.currentX);
        const top = Math.min(selectionBox.startY, selectionBox.currentY);
        const right = Math.max(selectionBox.startX, selectionBox.currentX);
        const bottom = Math.max(selectionBox.startY, selectionBox.currentY);

        const toBoardX = (screenX: number) => (screenX - pan.x) / zoom;
        const toBoardY = (screenY: number) => (screenY - pan.y) / zoom;

        const boxLeft = toBoardX(left);
        const boxTop = toBoardY(top);
        const boxRight = toBoardX(right);
        const boxBottom = toBoardY(bottom);

        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;

        const selectedIds = notes
          .filter((n) => {
            const nRight = n.x + NOTE_WIDTH;
            const nBottom = n.y + NOTE_HEIGHT;
            return (
              n.x < boxRight &&
              nRight > boxLeft &&
              n.y < boxBottom &&
              nBottom > boxTop
            );
          })
          .map((n) => n.id);

        selectNotes(selectedIds);
      } else {
        handleBackgroundClick();
      }
      setIsSelecting(false);
      setSelectionBox(null);
    } else if (isPanning) {
      if (!isDragOccurred.current) {
        handleBackgroundClick();
      }
      setIsPanning(false);
    }

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // --- Section Creation ---
  const handleAddSection = async () => {
    const { boardId, pan, zoom } = useBoardStore.getState();
    if (!boardId) return;

    const viewportCenterX = -pan.x / zoom + (window.innerWidth / 2) / zoom;
    const viewportCenterY = -pan.y / zoom + (window.innerHeight / 2) / zoom;

    const newSection = {
      boardId: boardId as any,
      title: '새 섹션',
      x: viewportCenterX - 150,
      y: viewportCenterY - 150,
      width: 300,
      height: 300,
      color: '#E5E7EB',
      zIndex: 10,
    };

    try {
      const response = await fetch('/api/kanban/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSection),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addSection({ id: data.data._id, ...data.data });

          // Auto-Capture 결과 반영: 캡처된 노트들의 sectionId 업데이트
          if (data.capturedNoteIds && data.capturedNoteIds.length > 0) {
            const updates = data.capturedNoteIds.map((noteId: string) => ({
              id: noteId,
              changes: { sectionId: data.data._id }
            }));
            // updateNotes 액션을 사용하여 로컬 상태 업데이트 (서버는 이미 반영됨)
            // updateNotes는 내부적으로 PATCH 요청을 보내지만, 여기서는 로컬 상태만 바꾸고 싶음.
            // 하지만 updateNotes는 서버 요청도 보냄. 
            // 1. updateNotes를 수정하거나 
            // 2. 그냥 updateNotes를 쓰고 서버 응답은 무시 (서버 상태와 일치하므로 문제 없음, 다만 불필요한 트래픽)
            // 3. 로컬 상태만 바꾸는 액션을 추가

            // 여기서는 간단히 updateNotes를 사용하되, 서버 부하를 줄이려면 'setNotes' 같은 액션이 필요함.
            // 현재 store에 'updateNote'는 있지만 'updateNotes'는 서버 요청을 보냄.
            // 임시로 updateNotes를 사용. (서버값이랑 같아서 덮어써도 무방)
            // 더 좋은 방법: useBoardStore.setState((state) => ...) 직접 호출? (권장되지 않음)

            // 가장 깔끔한 방법: updateNotes가 'optimistic only' 옵션을 받도록 수정하거나,
            // 그냥 서버 요청 보내게 둠 (어차피 값 같음).
            // 여기서는 불필요한 트래픽 방지를 위해 store에 'localUpdateNotes' 같은 걸 추가하는게 좋지만,
            // 일단은 useBoardStore의 setState를 활용하거나, 
            // 기존 updateNotes를 사용하되 불필요한 요청 감수.

            // -> updateNotes 사용.
            useBoardStore.getState().updateNotes(updates);
          }
        }
      }
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <header className="flex items-center justify-between p-4 border-b border-border bg-background z-10">
        <div className="text-sm text-foreground">
          {pid ? `Project Board: ${pid}` : `Public Board (Temp)`}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="text-xs text-gray-500 mr-2">
            (Alt + Wheel to Zoom, Drag BG to Pan, Shift+Drag to Select)
          </span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Notes: {notesCount}</span>
          <button
            onClick={() => {
              if (containerRef.current) {
                fitToContent(containerRef.current.clientWidth, containerRef.current.clientHeight);
              }
            }}
            className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80"
            title="Fit to Content (Shift + 1)"
          >
            Fit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (containerRef.current) {
                addNote(containerRef.current.clientWidth, containerRef.current.clientHeight);
              } else {
                addNote();
              }
            }}
            className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            + 노트 추가
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddSection();
            }}
            className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500"
          >
            + 섹션 추가
          </button>
        </div>
      </header>

      <ShortcutHandler />

      <main
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-background select-none"
        aria-label="화이트보드"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: isPanning ? 'grabbing' : 'default', touchAction: 'none' }}
      >
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <div
            className="absolute inset-[-10000px] bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
            style={{ opacity: 0.5 }}
          />

          {/* Sections (Render First) */}
          {sections.map((section) => (
            <SectionItem key={section.id} section={section} />
          ))}

          {/* Notes */}
          {notes.length === 0 && sections.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-muted-foreground text-sm bg-card/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm border border-border">
                노트나 섹션을 추가해보세요!
              </div>
            </div>
          ) : (
            notes.map((note) => {
              // Z-Index Calculation
              let zIndex = 1; // Orphan (Default)
              if (note.sectionId) {
                const section = sections.find((s) => s.id === note.sectionId);
                if (section) {
                  zIndex = (section.zIndex || 10) + 1;
                }
              }

              return (
                <NoteItem
                  key={note.id}
                  id={note.id}
                  x={note.x}
                  y={note.y}
                  text={note.text}
                  color={note.color}
                  zIndex={zIndex}
                  width={note.width}
                  height={note.height}
                  creatorId={note.creatorId}
                  updaterId={note.updaterId}
                  assigneeId={note.assigneeId}
                  dueDate={note.dueDate}
                />
              );
            })
          )}
        </div>

        {/* Selection Box Overlay */}
        {isSelecting && selectionBox && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
              border: '1px solid rgba(59, 130, 246, 0.5)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          />
        )}

        {/* Alignment Guides Overlay */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 999,
            overflow: 'visible',
          }}
        >
          {alignmentGuides.map((guide, i) => {
            if (guide.type === 'vertical' && guide.x !== undefined) {
              const screenX = guide.x * zoom + pan.x;
              return (
                <line
                  key={i}
                  x1={screenX}
                  y1={0}
                  x2={screenX}
                  y2="100%"
                  stroke="#EF4444"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
              );
            }
            if (guide.type === 'horizontal' && guide.y !== undefined) {
              const screenY = guide.y * zoom + pan.y;
              return (
                <line
                  key={i}
                  x1={0}
                  y1={screenY}
                  x2="100%"
                  y2={screenY}
                  stroke="#EF4444"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
              );
            }
            return null;
          })}
        </svg>

        {/* 미니맵 */}
        <div className="absolute bottom-4 right-4 z-50">
          <Minimap
            notes={notes}
            sections={sections}
            pan={pan}
            zoom={zoom}
            containerWidth={containerRef.current?.clientWidth || 0}
            containerHeight={containerRef.current?.clientHeight || 0}
            setPan={setPan}
          />
        </div>

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <button
            className="bg-white p-2 rounded shadow hover:bg-gray-50 text-gray-700"
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
          >
            -
          </button>
          <span className="bg-white p-2 rounded shadow min-w-[60px] text-center text-gray-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="bg-white p-2 rounded shadow hover:bg-gray-50 text-gray-700"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            +
          </button>
          <button
            className="bg-white p-2 rounded shadow hover:bg-gray-50 ml-2 text-gray-700"
            onClick={() => {
              if (containerRef.current) {
                fitToContent(containerRef.current.clientWidth, containerRef.current.clientHeight);
              }
            }}
          >
            Fit
          </button>
        </div>
      </main>
    </div>
  );
};

export default BoardShell;
