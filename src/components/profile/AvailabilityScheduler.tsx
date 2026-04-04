'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TimeRange {
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  timeRanges: TimeRange[];
}

interface AvailabilitySchedulerProps {
  initialSchedule?: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const BLOCKS = [
  { key: 'morning', label: '아침', sub: '06-12', start: '06:00', end: '12:00' },
  { key: 'afternoon', label: '점심', sub: '12-18', start: '12:00', end: '18:00' },
  { key: 'evening', label: '저녁', sub: '18-24', start: '18:00', end: '00:00' },
  { key: 'latenight', label: '심야', sub: '00-06', start: '00:00', end: '06:00' },
];

// 4블록 기준 시간 범위
const BLOCK_RANGES: Record<string, { startHour: number; endHour: number }> = {
  morning: { startHour: 6, endHour: 12 },
  afternoon: { startHour: 12, endHour: 18 },
  evening: { startHour: 18, endHour: 24 },
  latenight: { startHour: 0, endHour: 6 },
};

export default function AvailabilityScheduler({
  initialSchedule = [],
  onChange,
}: AvailabilitySchedulerProps) {
  // grid[dayIndex][blockIndex] = true/false
  const [grid, setGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 7 }, () => Array(4).fill(false))
  );

  const isInternalUpdate = useRef(false);

  // initialSchedule → grid 변환
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (!initialSchedule || initialSchedule.length === 0) return;

    const newGrid = Array.from({ length: 7 }, () => Array(4).fill(false));

    initialSchedule.forEach((daySch) => {
      const dayIdx = DAYS.findIndex((d) => d.key === daySch.day);
      if (dayIdx === -1) return;

      daySch.timeRanges.forEach((range) => {
        const startHour = parseInt(range.start.split(':')[0]);
        const endHour = parseInt(range.end.split(':')[0]) || 24;

        BLOCKS.forEach((block, blockIdx) => {
          const br = BLOCK_RANGES[block.key];
          // 해당 블록 시간대에 1시간이라도 포함되면 활성
          if (startHour < br.endHour && endHour > br.startHour) {
            newGrid[dayIdx][blockIdx] = true;
          }
        });
      });
    });

    setGrid(newGrid);
  }, [initialSchedule]);

  // grid 변경 시 부모에 DaySchedule[] 전달 (useEffect로 분리하여 렌더 중 setState 방지)
  useEffect(() => {
    const schedule: DaySchedule[] = [];
    grid.forEach((dayBlocks, dayIdx) => {
      const timeRanges: TimeRange[] = [];
      dayBlocks.forEach((active, blockIdx) => {
        if (active) {
          timeRanges.push({
            start: BLOCKS[blockIdx].start,
            end: BLOCKS[blockIdx].end,
          });
        }
      });
      if (timeRanges.length > 0) {
        schedule.push({ day: DAYS[dayIdx].key, timeRanges });
      }
    });

    isInternalUpdate.current = true;
    onChange(schedule);
  }, [grid, onChange]);

  const toggleCell = (dayIdx: number, blockIdx: number) => {
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[dayIdx][blockIdx] = !newGrid[dayIdx][blockIdx];
      return newGrid;
    });
  };

  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-[4.5rem_repeat(7,1fr)] gap-[4px]">
        {/* 헤더 행 */}
        <div className="h-8" />
        {DAYS.map((day) => (
          <div
            key={day.key}
            className={`text-[10px] font-bold text-center uppercase flex items-center justify-center ${
              day.key === 'saturday' || day.key === 'sunday'
                ? 'text-primary'
                : 'text-on-surface-variant'
            }`}
          >
            {day.label}
          </div>
        ))}

        {/* 4블록 행 */}
        {BLOCKS.map((block, blockIdx) => (
          <React.Fragment key={block.key}>
            {/* 행 라벨 */}
            <div className="text-[9px] font-bold text-outline text-right pr-3 flex items-center justify-end h-10 leading-none">
              {block.label}
              <br />
              <span className="text-[8px] font-normal opacity-70">{block.sub}</span>
            </div>
            {/* 7일 셀 */}
            {DAYS.map((day, dayIdx) => {
              const isActive = grid[dayIdx][blockIdx];
              return (
                <button
                  key={`${day.key}-${block.key}`}
                  type="button"
                  onClick={() => toggleCell(dayIdx, blockIdx)}
                  className={`h-10 rounded-md transition-colors cursor-pointer ${
                    isActive ? 'bg-primary shadow-sm' : 'bg-[#F3F4F6] hover:bg-[#F3F4F6]/80'
                  }`}
                  aria-label={`${day.label} ${block.label} ${isActive ? '활성' : '비활성'}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <p className="mt-6 text-[10px] text-on-surface-variant italic leading-relaxed text-center">
        * 클릭하여 가용 가능한 시간대를 선택해 주세요.
      </p>
    </div>
  );
}
