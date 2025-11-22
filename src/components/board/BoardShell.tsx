'use client';

import React from 'react';
import { useBoardStore } from '@/store/boardStore';
import NoteItem from '@/components/board/NoteItem';

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
    zoom,
    pan,
    addNote,
    selectedNoteIds,
    removeNote,
    selectNote,
    selectNotes,
    setOpenPaletteNoteId,
    initBoard,
    setZoom,
    setPan,
    fitToContent,
  } = useBoardStore((s) => ({
    notes: s.notes,
    zoom: s.zoom,
    pan: s.pan,
    addNote: s.addNote,
    selectedNoteIds: s.selectedNoteIds,
    removeNote: s.removeNote,
    selectNote: s.selectNote,
    selectNotes: s.selectNotes, // 다중 선택 액션
    setOpenPaletteNoteId: s.setOpenPaletteNoteId,
    initBoard: s.initBoard,
    setZoom: s.setZoom,
    setPan: s.setPan,
    fitToContent: s.fitToContent,
  }));
  const notesCount = notes.length;

  // 현재 보드의 ID를 결정합니다. pid가 유효하면 해당 pid를, 그렇지 않으면 임시 ID를 사용합니다.
  const boardPid = pid || TEMP_PUBLIC_PID;

  // 컴포넌트 마운트 시 또는 boardPid가 변경될 때 서버에서 보드와 노트 데이터를 불러옵니다.
  React.useEffect(() => {
    // initBoard 함수는 zustand 스토어에 정의되어 있으며,
    // 주어진 pid에 해당하는 보드 정보를 찾거나 생성하고, 해당 보드의 노트들을 불러옵니다.
    initBoard(boardPid);
  }, [boardPid, initBoard]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // 키보드 이벤트를 처리하는 useEffect 훅
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스가 있을 때는 동작하지 않도록 합니다.
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // 'Delete' 또는 'Backspace' 키를 누르면 선택된 노트를 삭제합니다.
      // 임시 노트(아직 서버에 저장되지 않은 노트)는 삭제 API를 호출하지 않습니다.
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 다중 선택된 노트들 삭제
        if (selectedNoteIds.length > 0) {
          selectedNoteIds.forEach((id) => {
            if (!id.startsWith('temp-')) {
              removeNote(id);
            }
          });
        }
      }

      // Shift + 1: 전체 보기 (Fit to Content)
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

  // 보드 배경 클릭 시 모든 노트의 선택을 해제합니다.
  const handleBackgroundClick = () => {
    selectNote(null);
    setOpenPaletteNoteId(null);
  };

  // --- Pan & Zoom & Selection Logic ---
  const [isPanning, setIsPanning] = React.useState(false);
  const [isSelecting, setIsSelecting] = React.useState(false); // 영역 선택 모드 여부
  const [selectionBox, setSelectionBox] = React.useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const lastPanRef = React.useRef({ x: 0, y: 0 });
  // const containerRef = React.useRef<HTMLDivElement>(null); // Moved up for access in useEffect
  const isDragOccurred = React.useRef(false); // 드래그 발생 여부 체크

  // 휠 이벤트 핸들러: Alt 키를 누른 상태에서 휠을 돌리면 줌을 조절합니다.
  // React의 onWheel은 Passive Event Listener 문제로 preventDefault가 동작하지 않을 수 있으므로,
  // ref를 통해 native event listener를 { passive: false }로 등록합니다.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const ZOOM_SENSITIVITY = 0.001;
        // e.deltaY는 휠의 이동량입니다.
        // setState를 함수형 업데이트로 사용하여 최신 zoom 값을 참조하지 않아도 되게 하거나,
        // zoom을 의존성에 넣어야 합니다. 여기서는 store의 setZoom을 사용하므로 zoom 값을 직접 참조해야 합니다.
        // 하지만 useEffect 안에서 zoom을 의존성에 넣으면 리스너가 계속 재등록되므로,
        // store에서 zoom을 가져오는 방식(getState)이 없으므로, zoom을 의존성에 넣습니다.
        // 성능 최적화를 위해 zoom을 ref로 관리하거나 store의 get()을 쓸 수 있지만,
        // zustand의 useBoardStore.getState()를 쓰면 더 깔끔합니다.
        const currentZoom = useBoardStore.getState().zoom;
        const newZoom = currentZoom - e.deltaY * ZOOM_SENSITIVITY;
        setZoom(newZoom);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [setZoom]);

  // 배경 드래그 시작 (Pan or Selection)
  const handlePointerDown = (e: React.PointerEvent) => {
    // 노트 위에서 발생한 이벤트는 버블링으로 올라오지만,
    // 노트 자체에서 stopPropagation을 하므로 여기 도달하지 않아야 합니다.
    // 다만, NoteItem이 편집 모드일 때 등 일부 상황에서 버블링될 수 있으므로
    // 입력 요소나 버튼 등에서의 클릭은 무시합니다.
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;

    // 브라우저 기본 드래그 동작 방지
    e.preventDefault();

    if (e.shiftKey) {
      // Shift 키가 눌려있으면 영역 선택 모드 시작
      setIsSelecting(true);
      // 현재 마우스 좌표 (화면 기준)를 저장.
      // Selection Box는 화면 좌표 기준으로 그립니다. (줌/팬 영향 안 받는 오버레이)
      // 하지만 노트 선택 로직을 위해서는 나중에 변환이 필요할 수 있음.
      // 여기서는 clientX, clientY를 사용하여 오버레이를 그립니다.
      // 단, containerRef 내부에서의 상대 좌표가 필요할 수 있으므로 getBoundingClientRect 사용 고려.
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setSelectionBox({ startX, startY, currentX: startX, currentY: startY });
      }
    } else {
      // 아니면 Pan 모드 시작
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }

    isDragOccurred.current = false; // 드래그 상태 초기화
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // 배경 드래그 중 (Pan or Selection)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isSelecting && selectionBox) {
      // 영역 선택 중
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        setSelectionBox({ ...selectionBox, currentX, currentY });
        isDragOccurred.current = true;
      }
    } else if (isPanning) {
      // Pan 중
      e.preventDefault(); // 추가적인 안전장치
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;

      // 움직임이 발생하면 드래그로 간주
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        isDragOccurred.current = true;
      }

      setPan(pan.x + dx, pan.y + dy);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  // 배경 드래그 종료 (Pan or Selection)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isSelecting && selectionBox) {
      // 영역 선택 종료: 박스 안에 있는 노트들을 찾아 선택
      if (isDragOccurred.current) {
        // 1. Selection Box의 좌표 (컨테이너 기준)
        const left = Math.min(selectionBox.startX, selectionBox.currentX);
        const top = Math.min(selectionBox.startY, selectionBox.currentY);
        const right = Math.max(selectionBox.startX, selectionBox.currentX);
        const bottom = Math.max(selectionBox.startY, selectionBox.currentY);

        // 2. 좌표 변환: 화면 좌표 -> 보드 내부 좌표 (줌/팬 역연산)
        // 보드 좌표 x = (화면좌표 x - pan.x) / zoom
        const toBoardX = (screenX: number) => (screenX - pan.x) / zoom;
        const toBoardY = (screenY: number) => (screenY - pan.y) / zoom;

        const boxLeft = toBoardX(left);
        const boxTop = toBoardY(top);
        const boxRight = toBoardX(right);
        const boxBottom = toBoardY(bottom);

        // 3. 노트 교차 판별
        // NoteItem 크기: 200 x 140 (하드코딩, 추후 상수로 관리 필요)
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;

        const selectedIds = notes
          .filter((n) => {
            const nRight = n.x + NOTE_WIDTH;
            const nBottom = n.y + NOTE_HEIGHT;
            // 교차 검사 (AABB)
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
        // 드래그 없이 클릭만 한 경우 (Shift+Click on Background) -> 선택 해제?
        // 보통 배경 Shift+Click은 아무 동작 안하거나 선택 해제. 여기선 선택 해제.
        handleBackgroundClick();
      }
      setIsSelecting(false);
      setSelectionBox(null);
    } else if (isPanning) {
      // Pan 종료
      // 드래그가 발생하지 않았다면(제자리 클릭), 배경 클릭으로 처리하여 선택 해제
      if (!isDragOccurred.current) {
        handleBackgroundClick();
      }
      setIsPanning(false);
    }

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };
  // ------------------------

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-10">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {/* pid가 있을 경우 'Project Board', 없을 경우 'Public Board'로 표시 */}
          {pid ? `Project Board: ${pid}` : `Public Board (Temp)`}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
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
            className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            title="Fit to Content (Shift + 1)"
          >
            Fit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addNote();
            }}
            className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            새 노트 추가
          </button>
        </div>
      </header>

      <main
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 select-none"
        aria-label="화이트보드"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: isPanning ? 'grabbing' : 'default', touchAction: 'none' }}
      >
        {/* 
          Board Content Wrapper 
          줌과 팬을 적용하는 컨테이너입니다.
          transform-origin을 0 0으로 설정하여 좌상단 기준으로 확대/축소되게 합니다.
          (필요 시 마우스 포인터 기준 줌으로 고도화 가능)
        */}
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
        // onClick={handleBackgroundClick} // PointerUp에서 처리하므로 제거
        >
          {/* 배경에 격자무늬를 그립니다. */}
          {/* 격자 패턴도 줌에 따라 커지도록 이 안에 배치합니다. */}
          <div
            className="absolute inset-[-10000px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] pointer-events-none"
            style={{ opacity: 0.5 }}
          />

          {/* 노트들을 렌더링하는 컨테이너 */}
          <div className="absolute inset-0 touch-none">
            {notes.map((n) => (
              <NoteItem key={n.id} id={n.id} x={n.x} y={n.y} text={n.text} color={n.color} />
            ))}
          </div>
        </div>

        {/* Selection Box Overlay */}
        {isSelecting && selectionBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-200/30 pointer-events-none z-50"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.currentX),
              top: Math.min(selectionBox.startY, selectionBox.currentY),
              width: Math.abs(selectionBox.currentX - selectionBox.startX),
              height: Math.abs(selectionBox.currentY - selectionBox.startY),
            }}
          />
        )}

        {/* 노트가 없을 때 표시되는 메시지 (UI 고정) */}
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500 text-sm bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
              노트를 추가해보세요!
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BoardShell;
