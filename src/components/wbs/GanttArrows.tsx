'use client';

import { Task } from '@/store/wbsStore';

export interface TaskBarPosition {
  x: number;       // 바 왼쪽 X
  rowY: number;    // 행 Y (SVG body 기준)
  width: number;   // 바 너비
  barHeight: number;
  rowHeight: number;
}

interface GanttArrowsProps {
  tasks: Task[];
  positionMap: Map<string, TaskBarPosition>;
}

const ARROW_COLOR = '#94a3b8';
const ARROW_SIZE = 6;

/**
 * GanttArrows 컴포넌트
 * 의존관계 화살표를 SVG path로 렌더링합니다.
 *
 * FS (Finish-to-Start): 선행 작업 끝 → 후속 작업 시작
 * SS (Start-to-Start): 선행 작업 시작 → 후속 작업 시작
 * FF (Finish-to-Finish): 선행 작업 끝 → 후속 작업 끝
 */
export default function GanttArrows({ tasks, positionMap }: GanttArrowsProps) {
  const elements: React.ReactNode[] = [];

  tasks.forEach((task) => {
    if (!task.dependencies || task.dependencies.length === 0) return;

    const toPos = positionMap.get(task.id);
    if (!toPos) return;

    task.dependencies.forEach((dep, idx) => {
      const depId = typeof dep === 'string' ? dep : String(dep.taskId);
      const depType = typeof dep === 'object' && dep !== null ? dep.type : 'FS';
      const fromPos = positionMap.get(depId);

      if (!fromPos) return;

      const toCenterY = toPos.rowY + toPos.rowHeight / 2;
      const fromCenterY = fromPos.rowY + fromPos.rowHeight / 2;

      let fromX: number, fromY: number, toX: number, toY: number;

      if (depType === 'FS') {
        // 선행 작업 끝 → 후속 작업 시작
        fromX = fromPos.x + fromPos.width;
        fromY = fromCenterY;
        toX = toPos.x;
        toY = toCenterY;
      } else if (depType === 'SS') {
        // 선행 작업 시작 → 후속 작업 시작
        fromX = fromPos.x;
        fromY = fromCenterY;
        toX = toPos.x;
        toY = toCenterY;
      } else {
        // FF: 선행 작업 끝 → 후속 작업 끝
        fromX = fromPos.x + fromPos.width;
        fromY = fromCenterY;
        toX = toPos.x + toPos.width;
        toY = toCenterY;
      }

      const arrowHeadDir = depType === 'FF' ? 1 : -1; // FF는 왼쪽 방향 화살촉이 아닌 오른쪽

      // 경로 생성: elbow 형태
      let pathD: string;

      if (fromX + 4 <= toX - ARROW_SIZE) {
        // 앞방향: 수평 → 수직 → 수평
        const midX = fromX + Math.max((toX - fromX) * 0.5, 8);
        pathD = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX - ARROW_SIZE} ${toY}`;
      } else {
        // 역방향(후퇴): 아래로 우회
        const bypassY = Math.max(fromY, toY) + toPos.rowHeight * 0.6;
        const cornerX = Math.min(fromPos.x, toPos.x) - 16;
        pathD = [
          `M ${fromX} ${fromY}`,
          `L ${fromX + 10} ${fromY}`,
          `L ${fromX + 10} ${bypassY}`,
          `L ${cornerX} ${bypassY}`,
          `L ${cornerX} ${toY}`,
          `L ${toX - ARROW_SIZE} ${toY}`,
        ].join(' ');
      }

      // FF는 오른쪽 방향 화살촉
      const arrowTip = depType === 'FF'
        ? `${toX},${toY} ${toX - ARROW_SIZE},${toY - ARROW_SIZE / 2} ${toX - ARROW_SIZE},${toY + ARROW_SIZE / 2}`
        : `${toX},${toY} ${toX - ARROW_SIZE},${toY - ARROW_SIZE / 2} ${toX - ARROW_SIZE},${toY + ARROW_SIZE / 2}`;

      elements.push(
        <g key={`arrow-${task.id}-${depId}-${idx}`}>
          <path
            d={pathD}
            fill="none"
            style={{ stroke: ARROW_COLOR, strokeWidth: 1.5, opacity: 0.75 }}
          />
          <polygon
            points={arrowTip}
            style={{ fill: ARROW_COLOR, opacity: 0.75 }}
          />
        </g>
      );
    });
  });

  return <g className="gantt-arrows">{elements}</g>;
}
