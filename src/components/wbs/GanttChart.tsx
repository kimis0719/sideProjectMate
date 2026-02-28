'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { Task } from '@/store/wbsStore';
import { checkAllScheduleConflicts } from '@/lib/utils/wbs/scheduleConflict';
import GanttHeader from './GanttHeader';
import GanttBar from './GanttBar';
import GanttArrows, { TaskBarPosition } from './GanttArrows';

// ─────────────────────────────────────────
// 레이아웃 상수
// ─────────────────────────────────────────
const LEFT_PANEL_WIDTH = 220;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 56; // 2행 × 28px
const BAR_HEIGHT = 26;

/** 뷰 모드별 1일 픽셀 환산 */
const PX_PER_DAY: Record<'Day' | 'Week' | 'Month', number> = {
  Day: 30,
  Week: 14,
  Month: 5,
};

// ─────────────────────────────────────────
// 좌표 유틸리티
// ─────────────────────────────────────────
function dateToX(date: Date, start: Date, pxPerDay: number): number {
  return ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay;
}

// ─────────────────────────────────────────
// 드래그 상태 타입
// ─────────────────────────────────────────
interface DragState {
  taskId: string;
  type: 'move' | 'resize-left' | 'resize-right';
  startClientX: number;
  originalStart: Date;
  originalEnd: Date;
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────
interface GanttChartProps {
  tasks: Task[];
  viewMode: 'Day' | 'Week' | 'Month';
  onTaskClick?: (task: Task) => void;
  onDateChange?: (task: Task, start: Date, end: Date) => void;
}

/**
 * GanttChart 컴포넌트 (커스텀 SVG 구현)
 *
 * 레이아웃:
 *   ┌──────────────────────┬──────────────────────────┐
 *   │ 작업명 (sticky left) │ 날짜 헤더 SVG             │ ← sticky top
 *   ├──────────────────────┼──────────────────────────┤
 *   │ 작업명 목록           │ 타임라인 SVG              │
 *   │ (sticky left)        │ (바, 화살표, 오늘선 등)   │
 *   └──────────────────────┴──────────────────────────┘
 *
 * 전체 컨테이너를 overflow-auto로 감싸 수평/수직 스크롤 지원.
 * 좌측 패널은 sticky left-0, 헤더는 sticky top-0 처리.
 */
export default function GanttChart({
  tasks,
  viewMode,
  onTaskClick,
  onDateChange,
}: GanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragDeltaDays, setDragDeltaDays] = useState(0);

  const pxPerDay = PX_PER_DAY[viewMode];

  // ── 타임라인 범위 계산 ──────────────────
  const { timelineStart, timelineEnd } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start: Date, end: Date;

    if (tasks.length === 0) {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 12, 0);
    } else {
      const allDates = tasks.flatMap((t) => [new Date(t.startDate), new Date(t.endDate)]);
      const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

      start = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1);
      end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 3, 0);
    }

    return { timelineStart: start, timelineEnd: end };
  }, [tasks]);

  const svgWidth = useMemo(
    () => Math.max(dateToX(timelineEnd, timelineStart, pxPerDay) + 120, 800),
    [timelineStart, timelineEnd, pxPerDay]
  );

  const svgBodyHeight = Math.max(tasks.length * ROW_HEIGHT, 200);

  // ── 충돌 작업 ID 집합 ───────────────────
  const conflictTaskIds = useMemo(() => {
    const ids = new Set<string>();
    const conflictMap = checkAllScheduleConflicts(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        assignee: { _id: t.assignee._id, nName: t.assignee.nName },
      }))
    );
    for (const conflicts of Array.from(conflictMap.values())) {
      for (const conflict of conflicts) {
        for (const ct of conflict.conflictingTasks) {
          ids.add(ct.id);
        }
      }
    }
    return ids;
  }, [tasks]);

  // ── 오늘 X 좌표 ────────────────────────
  const todayX = dateToX(new Date(), timelineStart, pxPerDay);

  // ── 수직 그리드 선 ──────────────────────
  const gridLines = useMemo(() => {
    const lines: { x: number; major: boolean }[] = [];
    const cur = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);

    while (dateToX(cur, timelineStart, pxPerDay) < svgWidth) {
      lines.push({ x: dateToX(cur, timelineStart, pxPerDay), major: true });

      if (viewMode === 'Week' || viewMode === 'Day') {
        // 주 단위 보조선
        const weekCur = new Date(cur);
        weekCur.setDate(weekCur.getDate() + 7);
        while (weekCur.getMonth() === cur.getMonth()) {
          const wx = dateToX(weekCur, timelineStart, pxPerDay);
          if (wx < svgWidth) lines.push({ x: wx, major: false });
          weekCur.setDate(weekCur.getDate() + 7);
        }
      }

      cur.setMonth(cur.getMonth() + 1);
    }

    return lines;
  }, [timelineStart, pxPerDay, svgWidth, viewMode]);

  // ── 드래그 핸들러 ───────────────────────
  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent, task: Task, type: DragState['type']) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        taskId: task.id,
        type,
        startClientX: e.clientX,
        originalStart: new Date(task.startDate),
        originalEnd: new Date(task.endDate),
      });
      setDragDeltaDays(0);
    },
    []
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return;
      const deltaX = e.clientX - dragState.startClientX;
      const newDeltaDays = Math.round(deltaX / pxPerDay);
      if (newDeltaDays !== dragDeltaDays) setDragDeltaDays(newDeltaDays);
    },
    [dragState, pxPerDay, dragDeltaDays]
  );

  const handleSvgMouseUp = useCallback(() => {
    if (!dragState) return;

    if (dragDeltaDays !== 0 && onDateChange) {
      const task = tasks.find((t) => t.id === dragState.taskId);
      if (task) {
        const newStart = new Date(dragState.originalStart);
        const newEnd = new Date(dragState.originalEnd);

        if (dragState.type === 'move') {
          newStart.setDate(newStart.getDate() + dragDeltaDays);
          newEnd.setDate(newEnd.getDate() + dragDeltaDays);
        } else if (dragState.type === 'resize-right') {
          newEnd.setDate(newEnd.getDate() + dragDeltaDays);
        } else {
          newStart.setDate(newStart.getDate() + dragDeltaDays);
        }

        if (newEnd > newStart) {
          onDateChange(task, newStart, newEnd);
        }
      }
    } else if (dragDeltaDays === 0) {
      // 클릭 (드래그 없음)
      const task = tasks.find((t) => t.id === dragState.taskId);
      if (task) onTaskClick?.(task);
    }

    setDragState(null);
    setDragDeltaDays(0);
  }, [dragState, dragDeltaDays, tasks, onDateChange, onTaskClick]);

  // ── 바 위치 맵 (화살표용) ───────────────
  const positionMap = useMemo<Map<string, TaskBarPosition>>(() => {
    return new Map(
      tasks.map((task, i) => {
        const bx = dateToX(new Date(task.startDate), timelineStart, pxPerDay);
        const ex = dateToX(new Date(task.endDate), timelineStart, pxPerDay);
        const dragOffset = dragState?.taskId === task.id ? dragDeltaDays * pxPerDay : 0;
        return [
          task.id,
          {
            x: bx + dragOffset,
            rowY: i * ROW_HEIGHT,
            width: Math.max(ex - bx, 4),
            barHeight: BAR_HEIGHT,
            rowHeight: ROW_HEIGHT,
          },
        ];
      })
    );
  }, [tasks, timelineStart, pxPerDay, dragState, dragDeltaDays]);

  // ── 렌더 ────────────────────────────────
  return (
    <div
      className="relative border border-border rounded-lg overflow-auto bg-card"
      style={{ height: 600 }}
    >
      {/* ── 내부 래퍼 (전체 너비 확보) ── */}
      <div style={{ minWidth: LEFT_PANEL_WIDTH + svgWidth }}>

        {/* ── 헤더 행 (sticky top) ── */}
        {/*
          z-index 계층:
            코너 셀 (z-40) > 헤더 행 (z-20) > 바디 좌측 패널 (z-10)
          - 헤더 행(z-20)은 바디가 스크롤 시 덮이지 않도록 상위 z-index 유지.
          - 코너 셀(z-40)은 헤더 행의 stacking context 내부에서 날짜 헤더 SVG보다 위에 렌더.
          - 코너 셀 배경은 완전 불투명(bg-muted)으로 설정, 수평 스크롤 시 날짜 SVG가 비치지 않도록 함.
        */}
        <div
          className="flex sticky top-0 bg-card border-b border-border"
          style={{ height: HEADER_HEIGHT, zIndex: 20 }}
        >
          {/* 왼쪽 코너 셀 — top-0 + left-0 동시 sticky, 완전 불투명 배경 */}
          <div
            className="sticky top-0 left-0 flex items-center px-4 border-r border-border bg-muted flex-shrink-0"
            style={{ width: LEFT_PANEL_WIDTH, height: HEADER_HEIGHT, zIndex: 40 }}
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              작업명
            </span>
          </div>

          {/* 날짜 헤더 SVG */}
          <div style={{ width: svgWidth, flexShrink: 0 }}>
            <svg width={svgWidth} height={HEADER_HEIGHT}>
              <GanttHeader
                timelineStart={timelineStart}
                pixelsPerDay={pxPerDay}
                viewMode={viewMode}
                width={svgWidth}
                height={HEADER_HEIGHT}
              />
            </svg>
          </div>
        </div>

        {/* ── 바디 ── */}
        {tasks.length === 0 ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: 200 }}
          >
            작업이 없습니다. [+ 작업 추가] 버튼을 눌러 시작하세요.
          </div>
        ) : (
          <div className="flex">
            {/* ── 좌측 작업명 패널 (sticky left) ── */}
            <div
              className="sticky left-0 z-10 bg-card border-r border-border flex-shrink-0"
              style={{ width: LEFT_PANEL_WIDTH }}
            >
              {tasks.map((task) => {
                const hasConflict = conflictTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className={`flex items-center gap-2 px-3 border-b border-border cursor-pointer transition-colors truncate ${
                      hasConflict
                        ? 'hover:bg-orange-50 dark:hover:bg-orange-900/10'
                        : 'hover:bg-muted/50'
                    }`}
                    style={{ height: ROW_HEIGHT }}
                    title={task.title}
                  >
                    {task.milestone && (
                      <span className="text-yellow-500 flex-shrink-0 text-xs">◆</span>
                    )}
                    {hasConflict && (
                      <span className="text-orange-500 flex-shrink-0 text-xs" title="일정 충돌">⚠</span>
                    )}
                    <span className="text-sm text-foreground truncate">{task.title}</span>
                  </div>
                );
              })}
            </div>

            {/* ── 타임라인 SVG ── */}
            <div style={{ width: svgWidth, flexShrink: 0 }}>
              <svg
                ref={svgRef}
                width={svgWidth}
                height={svgBodyHeight}
                style={{
                  display: 'block',
                  cursor: dragState ? 'grabbing' : 'default',
                  userSelect: 'none',
                }}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
              >
                {/* 행 배경 교대 색상 */}
                {tasks.map((task, i) => (
                  <rect
                    key={`row-bg-${task.id}`}
                    x={0}
                    y={i * ROW_HEIGHT}
                    width={svgWidth}
                    height={ROW_HEIGHT}
                    style={{
                      fill: i % 2 === 0 ? 'transparent' : 'var(--muted)',
                      opacity: 0.3,
                    }}
                  />
                ))}

                {/* 행 구분선 */}
                {tasks.map((_, i) => (
                  <line
                    key={`row-line-${i}`}
                    x1={0}
                    y1={(i + 1) * ROW_HEIGHT}
                    x2={svgWidth}
                    y2={(i + 1) * ROW_HEIGHT}
                    style={{ stroke: 'var(--border)', strokeWidth: 0.5, opacity: 0.5 }}
                  />
                ))}

                {/* 수직 그리드 선 */}
                {gridLines.map((line, i) => (
                  <line
                    key={`grid-${i}`}
                    x1={line.x}
                    y1={0}
                    x2={line.x}
                    y2={svgBodyHeight}
                    style={{
                      stroke: 'var(--border)',
                      strokeWidth: line.major ? 1 : 0.5,
                      opacity: line.major ? 0.6 : 0.25,
                    }}
                  />
                ))}

                {/* 오늘 날짜 세로선 */}
                {todayX >= 0 && todayX <= svgWidth && (
                  <line
                    x1={todayX}
                    y1={0}
                    x2={todayX}
                    y2={svgBodyHeight}
                    strokeDasharray="4 3"
                    style={{ stroke: '#ef4444', strokeWidth: 1.5, opacity: 0.7 }}
                  />
                )}

                {/* 의존관계 화살표 (바 아래에 렌더) */}
                <GanttArrows tasks={tasks} positionMap={positionMap} />

                {/* 작업 바 */}
                {tasks.map((task, i) => {
                  const bx = dateToX(new Date(task.startDate), timelineStart, pxPerDay);
                  const ex = dateToX(new Date(task.endDate), timelineStart, pxPerDay);
                  const bw = Math.max(ex - bx, 4);
                  const isDraggingThis = dragState?.taskId === task.id;

                  return (
                    <GanttBar
                      key={task.id}
                      task={task}
                      x={bx}
                      rowY={i * ROW_HEIGHT}
                      barWidth={bw}
                      rowHeight={ROW_HEIGHT}
                      barHeight={BAR_HEIGHT}
                      hasConflict={conflictTaskIds.has(task.id)}
                      dragOffsetPx={isDraggingThis ? dragDeltaDays * pxPerDay : 0}
                      onBarMouseDown={(e) => handleBarMouseDown(e, task, 'move')}
                      onResizeLeftMouseDown={(e) => handleBarMouseDown(e, task, 'resize-left')}
                      onResizeRightMouseDown={(e) => handleBarMouseDown(e, task, 'resize-right')}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
