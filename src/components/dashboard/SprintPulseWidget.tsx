'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NoteItem {
  _id: string;
  sectionId?: string | null;
}

interface SprintPulseWidgetProps {
  pid: string;
}

interface PulseData {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

// --- 도넛 차트 SVG ---
function DonutChart({ todo, inProgress, done, total }: PulseData) {
  const size = 120;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-container-low"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-on-surface-variant/50 text-xs"
        >
          0
        </text>
      </svg>
    );
  }

  const donePercent = done / total;
  const inProgressPercent = inProgress / total;
  const todoPercent = todo / total;

  // 각 세그먼트의 offset (12시 방향 시작 = -90도 회전)
  const doneOffset = 0;
  const inProgressOffset = donePercent * circumference;
  const todoOffset = (donePercent + inProgressPercent) * circumference;

  const segments = [
    { percent: donePercent, offset: doneOffset, color: '#34d399' }, // emerald-400
    { percent: inProgressPercent, offset: inProgressOffset, color: '#fbbf24' }, // amber-400
    { percent: todoPercent, offset: todoOffset, color: '#93b4f1' }, // primary-container 근사
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* 배경 트랙 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-surface-container-low"
      />
      {/* 세그먼트들 */}
      {segments.map(
        (seg, i) =>
          seg.percent > 0 && (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${seg.percent * circumference} ${circumference}`}
              strokeDashoffset={-seg.offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-500"
            />
          )
      )}
      {/* 중앙 텍스트 */}
      <text
        x="50%"
        y="44%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-on-surface text-2xl font-bold"
        style={{ fontSize: '24px', fontWeight: 700 }}
      >
        {total}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-on-surface-variant/60"
        style={{ fontSize: '10px' }}
      >
        총 노트
      </text>
    </svg>
  );
}

export default function SprintPulseWidget({ pid }: SprintPulseWidgetProps) {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pid) return;

    const fetchPulse = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const boardRes = await fetch(`/api/kanban/boards?pid=${pid}`);
        const boardData = await boardRes.json();
        if (!boardData.success) throw new Error(boardData.message);
        const boardId = boardData.data._id;

        const [activeRes, doneRes] = await Promise.all([
          fetch(`/api/kanban/notes?boardId=${boardId}&status=active`),
          fetch(`/api/kanban/notes?boardId=${boardId}&status=done`),
        ]);
        const [activeData, doneData] = await Promise.all([activeRes.json(), doneRes.json()]);

        if (!activeData.success || !doneData.success) {
          throw new Error('노트 데이터를 불러올 수 없습니다.');
        }

        const activeNotes: NoteItem[] = activeData.data;
        const doneNotes: NoteItem[] = doneData.data;

        const todo = activeNotes.filter((n) => !n.sectionId).length;
        const inProgress = activeNotes.filter((n) => !!n.sectionId).length;
        const done = doneNotes.length;

        setPulse({ todo, inProgress, done, total: todo + inProgress + done });
      } catch (err) {
        console.error('[SprintPulse] 에러:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPulse();
  }, [pid]);

  const getPercent = (count: number) => {
    if (!pulse || pulse.total === 0) return 0;
    return Math.round((count / pulse.total) * 100);
  };

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full md:min-h-[320px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 w-28 bg-surface-container-low rounded animate-pulse" />
          <div className="h-4 w-24 bg-surface-container-low rounded animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-[120px] h-[120px] bg-surface-container-low rounded-full animate-pulse shrink-0" />
          <div className="flex-1 w-full space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-surface-container-low rounded animate-pulse" />
                <div className="h-1.5 bg-surface-container-low rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full md:min-h-[320px] flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[20px] text-error">error</span>
          <h3 className="text-base font-bold font-headline text-on-surface">Sprint Pulse</h3>
        </div>
        <p className="text-sm text-on-surface-variant">{error}</p>
      </div>
    );
  }

  const isEmpty = !pulse || pulse.total === 0;

  const bars = [
    {
      label: '할 일',
      count: pulse?.todo ?? 0,
      color: 'bg-[#93b4f1]',
      track: 'bg-[#93b4f1]/20',
      dot: 'bg-[#93b4f1]',
    },
    {
      label: '진행 중',
      count: pulse?.inProgress ?? 0,
      color: 'bg-amber-400',
      track: 'bg-amber-400/20',
      dot: 'bg-amber-400',
    },
    {
      label: '완료',
      count: pulse?.done ?? 0,
      color: 'bg-emerald-400',
      track: 'bg-emerald-400/20',
      dot: 'bg-emerald-400',
    },
  ];

  const donePercent = getPercent(pulse?.done ?? 0);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full md:min-h-[320px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-base font-bold font-headline text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">sprint</span>
          Sprint Pulse
        </h3>
        <Link
          href={`/dashboard/${pid}/kanban`}
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
        >
          칸반 보드 보기
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2">
            task_alt
          </span>
          <p className="text-sm text-on-surface-variant/60">아직 노트가 없습니다</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col sm:flex-row gap-6 items-center">
          {/* 좌측(모바일: 상단) — 도넛 차트 */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <DonutChart
              todo={pulse?.todo ?? 0}
              inProgress={pulse?.inProgress ?? 0}
              done={pulse?.done ?? 0}
              total={pulse?.total ?? 0}
            />
            <p className="text-xs text-on-surface-variant/60">
              완료율 <span className="font-bold text-on-surface">{donePercent}%</span>
            </p>
          </div>

          {/* 우측(모바일: 하단) — 프로그레스 바 */}
          <div className="flex-1 w-full space-y-4">
            {bars.map((bar) => {
              const percent = getPercent(bar.count);
              return (
                <div key={bar.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-on-surface-variant font-medium flex items-center gap-1.5">
                      <span className={`inline-block w-2 h-2 rounded-full ${bar.dot}`} />
                      {bar.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface tabular-nums">
                        {bar.count}
                      </span>
                      <span className="text-xs text-on-surface-variant/60 tabular-nums w-9 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-1.5 rounded-full ${bar.track}`}>
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
