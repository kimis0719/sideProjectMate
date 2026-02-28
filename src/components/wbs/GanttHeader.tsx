'use client';

interface GanttHeaderProps {
  timelineStart: Date;
  pixelsPerDay: number;
  viewMode: 'Day' | 'Week' | 'Month';
  width: number;
  height: number; // total header height (rendered as 2 rows of height/2 each)
}

function dateToX(date: Date, start: Date, pxPerDay: number): number {
  return ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay;
}

/**
 * GanttHeader 컴포넌트
 * 간트차트 상단 날짜 헤더. 일/주/월 뷰 모드에 따라 2행 헤더를 SVG로 렌더링합니다.
 */
export default function GanttHeader({
  timelineStart,
  pixelsPerDay,
  viewMode,
  width,
  height,
}: GanttHeaderProps) {
  const rowH = height / 2;

  // 상단 행 intervals 생성 (월 뷰 → 연도, 나머지 → 월)
  const topIntervals: { label: string; x: number; w: number }[] = [];
  // 하단 행 intervals 생성 (일 뷰 → 일, 주 뷰 → 주 시작일, 월 뷰 → 월)
  const bottomIntervals: { label: string; x: number; w: number }[] = [];

  if (viewMode === 'Day') {
    // 상단: 월 레이블
    const cur = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
    while (dateToX(cur, timelineStart, pixelsPerDay) < width) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const x1 = Math.max(0, dateToX(cur, timelineStart, pixelsPerDay));
      const x2 = Math.min(width, dateToX(next, timelineStart, pixelsPerDay));
      if (x2 > x1) {
        topIntervals.push({
          label: `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`,
          x: x1,
          w: x2 - x1,
        });
      }
      cur.setMonth(cur.getMonth() + 1);
    }

    // 하단: 일 레이블
    const day = new Date(timelineStart);
    day.setHours(0, 0, 0, 0);
    while (dateToX(day, timelineStart, pixelsPerDay) < width) {
      bottomIntervals.push({
        label: String(day.getDate()),
        x: dateToX(day, timelineStart, pixelsPerDay),
        w: pixelsPerDay,
      });
      day.setDate(day.getDate() + 1);
    }
  } else if (viewMode === 'Week') {
    // 상단: 월 레이블
    const cur = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
    while (dateToX(cur, timelineStart, pixelsPerDay) < width) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      const x1 = Math.max(0, dateToX(cur, timelineStart, pixelsPerDay));
      const x2 = Math.min(width, dateToX(next, timelineStart, pixelsPerDay));
      if (x2 > x1) {
        topIntervals.push({
          label: `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`,
          x: x1,
          w: x2 - x1,
        });
      }
      cur.setMonth(cur.getMonth() + 1);
    }

    // 하단: 주 시작일 (월요일 기준)
    const week = new Date(timelineStart);
    week.setHours(0, 0, 0, 0);
    const dayOfWeek = week.getDay();
    // 직전 월요일로 이동 (일요일=0 이면 6일 전, 월요일=1 이면 0일 전, ...)
    week.setDate(week.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    while (dateToX(week, timelineStart, pixelsPerDay) < width) {
      const x = dateToX(week, timelineStart, pixelsPerDay);
      const w = pixelsPerDay * 7;
      bottomIntervals.push({
        label: `${week.getMonth() + 1}/${week.getDate()}`,
        x: Math.max(0, x),
        w,
      });
      week.setDate(week.getDate() + 7);
    }
  } else {
    // Month 뷰

    // 상단: 연도 레이블
    const yearCur = new Date(timelineStart.getFullYear(), 0, 1);
    while (dateToX(yearCur, timelineStart, pixelsPerDay) < width) {
      const next = new Date(yearCur.getFullYear() + 1, 0, 1);
      const x1 = Math.max(0, dateToX(yearCur, timelineStart, pixelsPerDay));
      const x2 = Math.min(width, dateToX(next, timelineStart, pixelsPerDay));
      if (x2 > x1) {
        topIntervals.push({
          label: `${yearCur.getFullYear()}년`,
          x: x1,
          w: x2 - x1,
        });
      }
      yearCur.setFullYear(yearCur.getFullYear() + 1);
    }

    // 하단: 월 레이블
    const monthCur = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
    while (dateToX(monthCur, timelineStart, pixelsPerDay) < width) {
      const next = new Date(monthCur.getFullYear(), monthCur.getMonth() + 1, 1);
      const x1 = Math.max(0, dateToX(monthCur, timelineStart, pixelsPerDay));
      const x2 = Math.min(width, dateToX(next, timelineStart, pixelsPerDay));
      if (x2 > x1) {
        bottomIntervals.push({
          label: `${monthCur.getMonth() + 1}월`,
          x: x1,
          w: x2 - x1,
        });
      }
      monthCur.setMonth(monthCur.getMonth() + 1);
    }
  }

  return (
    <g className="gantt-header">
      {/* 배경 */}
      <rect x={0} y={0} width={width} height={height} style={{ fill: 'var(--muted)' }} />

      {/* 상단/하단 구분선 */}
      <line
        x1={0} y1={rowH} x2={width} y2={rowH}
        style={{ stroke: 'var(--border)', strokeWidth: 1 }}
      />

      {/* 상단 행 */}
      {topIntervals.map((interval, i) => (
        <g key={`top-${i}`}>
          <line
            x1={interval.x} y1={0} x2={interval.x} y2={rowH}
            style={{ stroke: 'var(--border)', strokeWidth: 1 }}
          />
          {interval.w > 24 && (
            <text
              x={interval.x + interval.w / 2}
              y={rowH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: '11px', fill: 'var(--muted-foreground)', fontWeight: '600' }}
            >
              {interval.label}
            </text>
          )}
        </g>
      ))}

      {/* 하단 행 */}
      {bottomIntervals.map((interval, i) => (
        <g key={`bot-${i}`}>
          <line
            x1={interval.x} y1={rowH} x2={interval.x} y2={height}
            style={{ stroke: 'var(--border)', strokeWidth: 0.5 }}
          />
          {interval.w > 14 && (
            <text
              x={interval.x + interval.w / 2}
              y={rowH + rowH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: '10px', fill: 'var(--muted-foreground)' }}
            >
              {interval.label}
            </text>
          )}
        </g>
      ))}

      {/* 하단 경계선 */}
      <line
        x1={0} y1={height} x2={width} y2={height}
        style={{ stroke: 'var(--border)', strokeWidth: 1 }}
      />
    </g>
  );
}
