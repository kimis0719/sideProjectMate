'use client';

import { Task } from '@/store/wbsStore';

// 상태별 색상
const STATUS_COLORS: Record<string, { bg: string; progress: string; text: string }> = {
  todo: { bg: '#bfdbfe', progress: '#3b82f6', text: '#1e40af' },
  'in-progress': { bg: '#93c5fd', progress: '#2563eb', text: '#ffffff' },
  done: { bg: '#a7f3d0', progress: '#10b981', text: '#065f46' },
};

interface GanttBarProps {
  task: Task;
  x: number;            // 바 왼쪽 끝 X
  rowY: number;         // 행 Y (SVG body 기준)
  barWidth: number;     // 바 너비 (px)
  rowHeight: number;    // 행 높이
  barHeight: number;    // 바 높이
  hasConflict: boolean;
  dragOffsetPx: number; // 드래그 중 이동량 (px)
  onBarMouseDown: (e: React.MouseEvent) => void;
  onResizeLeftMouseDown: (e: React.MouseEvent) => void;
  onResizeRightMouseDown: (e: React.MouseEvent) => void;
}

const RESIZE_HANDLE_W = 8;

/**
 * GanttBar 컴포넌트
 * 간트차트 내 단일 작업 바를 SVG로 렌더링합니다.
 * - 마일스톤: 다이아몬드 형태
 * - 일반 작업: 직사각형 바 + 진행률 오버레이
 * - 충돌 표시: 주황색 테두리 + ⚠ 아이콘
 * - 좌우 resize 핸들
 */
export default function GanttBar({
  task,
  x,
  rowY,
  barWidth,
  rowHeight,
  barHeight,
  hasConflict,
  dragOffsetPx,
  onBarMouseDown,
  onResizeLeftMouseDown,
  onResizeRightMouseDown,
}: GanttBarProps) {
  const bx = x + dragOffsetPx;
  const by = rowY + (rowHeight - barHeight) / 2;
  const bw = Math.max(barWidth, 4);
  const colors = STATUS_COLORS[task.status] || STATUS_COLORS['todo'];

  const clipId = `gc-clip-${task.id}`;

  // ── 마일스톤: 다이아몬드 ──
  if (task.milestone) {
    const cx = bx + bw / 2;
    const cy = by + barHeight / 2;
    const half = barHeight / 2;

    return (
      <g cursor="pointer" onMouseDown={onBarMouseDown}>
        <polygon
          points={`${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`}
          style={{
            fill: hasConflict ? '#f97316' : '#eab308',
            stroke: hasConflict ? '#ea580c' : '#ca8a04',
            strokeWidth: 1.5,
          }}
        />
        {hasConflict && (
          <text
            x={cx}
            y={cy - half - 4}
            textAnchor="middle"
            style={{ fontSize: '9px', fill: '#ea580c' }}
          >
            ⚠
          </text>
        )}
        <title>
          {task.title}
          {hasConflict ? ' ⚠ 일정 충돌' : ''}
          {` · 마일스톤 (${new Date(task.startDate).toLocaleDateString('ko-KR')})`}
        </title>
      </g>
    );
  }

  // ── 일반 작업 바 ──
  const progressW = Math.max(bw * (task.progress / 100), 0);
  const showTitle = bw > 32;

  return (
    <g>
      {/* clipPath for text */}
      <defs>
        <clipPath id={clipId}>
          <rect x={bx + RESIZE_HANDLE_W} y={by} width={Math.max(bw - RESIZE_HANDLE_W * 2, 0)} height={barHeight} />
        </clipPath>
      </defs>

      {/* 배경 바 */}
      <rect
        x={bx}
        y={by}
        width={bw}
        height={barHeight}
        rx={4}
        style={{
          fill: colors.bg,
          stroke: hasConflict ? '#f97316' : 'none',
          strokeWidth: hasConflict ? 2 : 0,
          cursor: 'grab',
        }}
        onMouseDown={onBarMouseDown}
      />

      {/* 진행률 오버레이 */}
      {progressW > 0 && (
        <rect
          x={bx}
          y={by}
          width={progressW}
          height={barHeight}
          rx={4}
          style={{ fill: colors.progress, opacity: 0.85, pointerEvents: 'none' }}
        />
      )}

      {/* 작업명 텍스트 */}
      {showTitle && (
        <text
          x={bx + RESIZE_HANDLE_W + 4}
          y={by + barHeight / 2}
          dominantBaseline="central"
          clipPath={`url(#${clipId})`}
          style={{
            fontSize: '11px',
            fill: task.progress > 50 ? '#ffffff' : colors.text,
            fontWeight: '500',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {task.title}
        </text>
      )}

      {/* 충돌 경고 아이콘 */}
      {hasConflict && (
        <text
          x={bx + bw - 4}
          y={by + barHeight / 2}
          textAnchor="end"
          dominantBaseline="central"
          style={{ fontSize: '10px', fill: '#ea580c', pointerEvents: 'none' }}
        >
          ⚠
        </text>
      )}

      {/* 왼쪽 resize 핸들 */}
      <rect
        x={bx}
        y={by}
        width={RESIZE_HANDLE_W}
        height={barHeight}
        rx={4}
        style={{ fill: 'transparent', cursor: 'ew-resize' }}
        onMouseDown={onResizeLeftMouseDown}
      />

      {/* 오른쪽 resize 핸들 */}
      <rect
        x={bx + bw - RESIZE_HANDLE_W}
        y={by}
        width={RESIZE_HANDLE_W}
        height={barHeight}
        style={{ fill: 'transparent', cursor: 'ew-resize' }}
        onMouseDown={onResizeRightMouseDown}
      />

      <title>
        {task.title}
        {hasConflict ? ' ⚠ 일정 충돌' : ''}
        {` · ${task.progress}% · ${new Date(task.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(task.endDate).toLocaleDateString('ko-KR')}`}
      </title>
    </g>
  );
}
