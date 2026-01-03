'use client';

import { useEffect, useState, useRef } from 'react';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Task } from '@/store/wbsStore';
import { drawDependencyLines, getTaskPositions, highlightDependencies, clearHighlightDependencies, debugDependencyInfo } from '@/lib/utils/wbs/drawDependencies';

interface GanttChartProps {
  tasks: Task[];
  viewMode: 'Day' | 'Week' | 'Month';
  onTaskClick?: (task: Task) => void;
  onDateChange?: (task: Task, start: Date, end: Date) => void;
  dateRangeMonths?: number;  // 표시할 기간 (개월 수)
}

/**
 * GanttChart 컴포넌트
 * 
 * 주요 기능:
 * - 작업을 간트차트 형태로 시각화
 * - milestone 속성이 true인 작업은 다이아몬드 모양으로 표시
 * - phase를 통해 작업 그룹화 (같은 phase의 작업들이 함께 표시)
 * - 드래그로 작업 날짜 변경 가능
 */
export default function GanttChart({ tasks, viewMode, onTaskClick, onDateChange, dateRangeMonths = 12 }: GanttChartProps) {
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(0);

  // 드래그 추적
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DRAG_THRESHOLD = 5; // 5px 이상 드래그되면 드래그로 간주
  const CLICK_DELAY = 300; // 300ms (단순 클릭 판단 대기 시간)

  useEffect(() => {
    if (tasks.length === 0) {
      setGanttTasks([]);
      return;
    }

    const newGanttTasks: GanttTask[] = tasks.map((task) => ({
      start: new Date(task.startDate),
      end: new Date(task.endDate),
      name: task.title,
      id: task.id,
      type: task.milestone ? 'milestone' : 'task',
      progress: task.progress,
      isDisabled: false,
      styles: {
        progressColor: task.status === 'done' ? '#10b981' : task.milestone ? '#eab308' : '#3b82f6',
        progressSelectedColor: task.status === 'done' ? '#059669' : task.milestone ? '#ca8a04' : '#2563eb',
        backgroundColor: task.status === 'done' ? '#d1fae5' : task.milestone ? '#fef3c7' : '#dbeafe',
        backgroundSelectedColor: task.status === 'done' ? '#a7f3d0' : task.milestone ? '#fde68a' : '#bfdbfe',
      },
      project: task.pid.toString(),
      // dependencies를 문자열 배열로 변환
      dependencies: task.dependencies?.map(dep => {
        if (typeof dep === 'string') return dep;
        if (typeof dep === 'object' && dep.taskId) return dep.taskId.toString();
        return '';
      }).filter(Boolean) as string[],
    }));

    // 기간별 범위 강제 확장을 위한 투명 더미 작업 추가
    // 시작일: 현재 월의 1일
    const today = new Date();
    const startBoundary = new Date(today.getFullYear(), today.getMonth(), 1);

    // 종료일: 현재 월 기준 dateRangeMonths개월 후 말일
    const endBoundary = new Date(today.getFullYear(), today.getMonth() + dateRangeMonths, 0);

    // 범위 시작 더미
    newGanttTasks.push({
      start: startBoundary,
      end: new Date(startBoundary.getTime() + 86400000),
      name: "",
      id: "ghost-start",
      type: 'task',
      progress: 0,
      isDisabled: true,
      hideChildren: false,
      styles: {
        progressColor: 'transparent',
        progressSelectedColor: 'transparent',
        backgroundColor: 'transparent',
        backgroundSelectedColor: 'transparent',
      },
      project: "ghost",
    });

    // 범위 끝 더미
    newGanttTasks.push({
      start: endBoundary,
      end: new Date(endBoundary.getTime() + 86400000),
      name: "",
      id: "ghost-end",
      type: 'task',
      progress: 0,
      isDisabled: true,
      hideChildren: false,
      styles: {
        progressColor: 'transparent',
        progressSelectedColor: 'transparent',
        backgroundColor: 'transparent',
        backgroundSelectedColor: 'transparent',
      },
      project: "ghost",
    });

    setGanttTasks(newGanttTasks);

    // 차트 너비 계산 (스크롤 강제)
    const columnWidth = 60;
    const days = (endBoundary.getTime() - startBoundary.getTime()) / (1000 * 60 * 60 * 24);
    let estimatedWidth = 0;

    if (viewMode === 'Day') {
      estimatedWidth = days * columnWidth;
    } else if (viewMode === 'Week') {
      estimatedWidth = (days / 7) * columnWidth;
    } else if (viewMode === 'Month') {
      estimatedWidth = (days / 30) * columnWidth;
    }

    // 최소 너비 보장 (화면보다 작으면 100% 사용)
    setChartWidth(Math.max(estimatedWidth + 200, 1200)); // 여유분 추가

  }, [tasks, viewMode, dateRangeMonths]);

  const handleTaskChange = (task: GanttTask) => {
    const originalTask = tasks.find((t) => t.id === task.id);
    if (originalTask && onDateChange) {
      onDateChange(originalTask, task.start, task.end);
    }
  };

  const handleSelect = (task: GanttTask, isSelected: boolean) => {
    // 클릭이 선택된 경우만 처리
    if (!isSelected) return;

    // 이미 대기중인 타이머가 있으면 취소
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    // 드래그가 이미 발생된 경우 처리 무시
    if (isDraggingRef.current) {
      return;
    }

    // 300ms 대기 후, 드래그가 아닌 단순 클릭만 실행
    clickTimeoutRef.current = setTimeout(() => {
      // 300ms 동안 드래그가 발생하지 않았으면 클릭 이벤트 발생
      if (!isDraggingRef.current && onTaskClick) {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask) {
          onTaskClick(originalTask);
        }
      }
      clickTimeoutRef.current = null;
    }, CLICK_DELAY);
  };

  const getGanttViewMode = (mode: 'Day' | 'Week' | 'Month'): ViewMode => {
    switch (mode) {
      case 'Day': return ViewMode.Day;
      case 'Week': return ViewMode.Week;
      case 'Month': return ViewMode.Month;
      default: return ViewMode.Day;
    }
  };

  // 클릭과 드래그 구분 로직
  useEffect(() => {
    const ganttContainer = wrapperRef.current;
    if (!ganttContainer) return;

    const handleMouseDown = (e: MouseEvent) => {
      dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);

      // 5px 이상 드래그되면, 드래그 개시
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        isDraggingRef.current = true;

        // 드래그 중에 대기되지 않은 타이머 취소
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      // 초기화 시점 (0.3초 대기로 단순 클릭 판단)
      isDraggingRef.current = false;
    };

    ganttContainer.addEventListener('mousedown', handleMouseDown);
    ganttContainer.addEventListener('mousemove', handleMouseMove);
    ganttContainer.addEventListener('mouseup', handleMouseUp);
    ganttContainer.addEventListener('mouseleave', handleMouseUp);

    return () => {
      ganttContainer.removeEventListener('mousedown', handleMouseDown);
      ganttContainer.removeEventListener('mousemove', handleMouseMove);
      ganttContainer.removeEventListener('mouseup', handleMouseUp);
      ganttContainer.removeEventListener('mouseleave', handleMouseUp);

      // 정리 시간에 대기된 타이머 취소
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [onTaskClick, tasks]);

  // 중복 동작 방지 useEffect
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // 의존관계 연결선 그리기
  useEffect(() => {
    const ganttContainer = wrapperRef.current;
    if (!ganttContainer || ganttTasks.length === 0) return;

    // 약간의 지연을 주어 DOM이 완전히 렌더링되도록
    const drawTimer = setTimeout(() => {
      // 작업 맵 생성
      const taskMap = new Map(tasks.map((task) => [task.id, task]));

      // 작업 위치 정보 추출
      const positions = getTaskPositions(ganttContainer);

      // 디버그 정보 출력
      debugDependencyInfo(ganttContainer, taskMap, positions);

      // 의존관계 연결선 그리기
      const isDarkMode = document.documentElement.classList.contains('dark');
      drawDependencyLines(ganttContainer, taskMap, positions, isDarkMode);
    }, 500);

    return () => clearTimeout(drawTimer);
  }, [ganttTasks, tasks]);

  // 작업명 텍스트 색상 및 위치 조정
  useEffect(() => {
    const ganttContainer = wrapperRef.current;
    if (!ganttContainer || ganttTasks.length === 0) return;

    const adjustTextStyling = () => {
      const svg = ganttContainer.querySelector('svg');
      if (!svg) return;

      const taskGroups = svg.querySelectorAll('g[data-id]');

      taskGroups.forEach((group, index) => {
        const dataId = group.getAttribute('data-id');

        // 더미 작업 제외
        if (dataId === 'ghost-start' || dataId === 'ghost-end') return;

        const rect = group.querySelector('rect.bar');
        const text = group.querySelector('text');

        if (!rect || !text) return;

        try {
          const x = parseFloat(rect.getAttribute('x') || '0');
          const y = parseFloat(rect.getAttribute('y') || '0');
          const width = parseFloat(rect.getAttribute('width') || '0');
          const height = parseFloat(rect.getAttribute('height') || '0');

          // 첫 3개 작업의 디버그 로그
          if (index < 3) {
            console.log(`[${index}] Task ${dataId}:`, {
              rect: { x, y, width, height },
              before: {
                x: text.getAttribute('x'),
                y: text.getAttribute('y'),
                textContent: text.textContent,
              }
            });
          }

          // 새로운 text 요소 생성 (라이브러리 간섭 제거)
          const newText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          const textContent = text.textContent || '';

          const centerX = x + width / 2;
          const centerY = y + height / 2;

          newText.setAttribute('x', String(centerX));
          newText.setAttribute('y', String(centerY));
          newText.setAttribute('text-anchor', 'middle');
          newText.setAttribute('dominant-baseline', 'central');
          newText.setAttribute('fill', 'currentColor');
          newText.classList.add('text-foreground');
          newText.setAttribute('font-weight', '500');
          newText.setAttribute('font-size', '12px');
          newText.setAttribute('pointer-events', 'none');
          newText.textContent = textContent;

          // 기존 text 요소 제거하고 새 요소 추가
          text.replaceWith(newText);

          if (index < 3) {
            console.log(`[${index}] Task ${dataId} after:`, {
              newX: newText.getAttribute('x'),
              newY: newText.getAttribute('y'),
            });
          }
        } catch (e) {
          console.error('Error adjusting text styling:', e);
        }
      });
    };

    // 초기 조정
    const timer = setTimeout(adjustTextStyling, 150);

    // 주기적으로 조정 (드래그 등으로 리렌더링될 때)
    const interval = setInterval(adjustTextStyling, 800);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [ganttTasks]);

  // 다크모드 변경 감지 시 다시 그리기
  useEffect(() => {
    const ganttContainer = wrapperRef.current;
    if (!ganttContainer || ganttTasks.length === 0) return;

    const observer = new MutationObserver(() => {
      const taskMap = new Map(tasks.map((task) => [task.id, task]));
      const positions = getTaskPositions(ganttContainer);
      const isDarkMode = document.documentElement.classList.contains('dark');
      drawDependencyLines(ganttContainer, taskMap, positions, isDarkMode);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [ganttTasks, tasks]);

  // 3단 헤더 구현을 위한 DOM 조작
  useEffect(() => {
    const formatHeader = () => {
      const ganttContainer = wrapperRef.current;
      if (!ganttContainer) return;

      const svg = ganttContainer.querySelector('svg');
      if (!svg) return;

      // calendarTop 그룹의 text 처리
      const calendarTopGroups = svg.querySelectorAll('g.calendarTop');
      
      calendarTopGroups.forEach((group: any) => {
        const texts = group.querySelectorAll('text');
        texts.forEach((text: any) => {
          const content = text.textContent || '';
          const monthYearMatch = content.match(/(\d+)월,\s*(\d{4})/);
          
          if (monthYearMatch) {
            const month = monthYearMatch[1];
            const year = monthYearMatch[2];
            
            // viewMode에 따라 다른 헤더 표기
            if (viewMode === 'Day') {
              // 일 구분: 월 표기
              text.textContent = month + '월';
            } else if (viewMode === 'Week') {
              // 주 구분: 헤더 제거
              text.textContent = '';
            } else if (viewMode === 'Month') {
              // 월 구분: 연도 표기
              text.textContent = year + '년';
            } else {
              text.textContent = '';
            }
          }
        });
      });

      // calendar 그룹 찾기 (주/일이 표시되는 곳)
      const calendarGroup = svg.querySelector('g.calendar');
      if (!calendarGroup) return;

      const allTexts = Array.from(calendarGroup.querySelectorAll('text'));

      // 하단 헤더 (y >= 90): 주/일 표시 부분 -> 월/일로 변환
      const weekTexts = allTexts.filter(text => {
        const y = parseFloat(text.getAttribute('y') || '0');
        return y >= 90;
      });

      weekTexts.forEach((text: any) => {
        const content = text.textContent || '';
        const weekMatch = content.match(/W(\d+)/i);
        
        if (weekMatch) {
          const weekNumber = parseInt(weekMatch[1]);
          
          // 현재 연도 기반 주 계산
          const today = new Date();
          const year = today.getFullYear();
          const jan1 = new Date(year, 0, 1);
          const jan1Day = jan1.getDay();
          
          // 첫 번째 월요일 찾기 (0 = Sunday, 1 = Monday)
          let firstMonday = new Date(jan1);
          if (jan1Day === 0) {
            firstMonday.setDate(2);
          } else if (jan1Day === 1) {
            // 그대로
          } else {
            firstMonday.setDate(jan1.getDate() + (8 - jan1Day));
          }
          
          // 해당 주의 월요일 계산
          const targetMonday = new Date(firstMonday);
          targetMonday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
          
          // 날짜 포맷팅 (예: "1월 5일")
          const month = targetMonday.getMonth() + 1;
          const date = targetMonday.getDate();
          const dateStr = `${month}월 ${date}일`;
          
          text.textContent = dateStr;
        }
      });
    };

    // 더 자주 업데이트하도록 설정 (100ms)
    const timer = setInterval(formatHeader, 100);
    formatHeader(); // 즉시 첫 실행

    return () => clearInterval(timer);
  }, [ganttTasks, viewMode]);

  return (
    <div className="gantt-chart-wrapper h-[600px] overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-card">
      <div ref={wrapperRef} style={{ width: chartWidth > 0 ? `${chartWidth}px` : '100%', height: '100%', position: 'relative' }}>
        {ganttTasks.length > 0 ? (
          <Gantt
            tasks={ganttTasks}
            viewMode={getGanttViewMode(viewMode)}
            onDateChange={handleTaskChange}
            onSelect={handleSelect}
            listCellWidth=""
            columnWidth={60}
            headerHeight={120}
            barCornerRadius={4}
            barFill={60}
            ganttHeight={550}
            locale="ko"
            fontFamily="inherit"
            fontSize="12px"
            rowHeight={40}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>작업이 없습니다. 새 작업을 추가해보세요!</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .gantt-chart-wrapper .gantt-task-react-header {
          height: 120px !important;
        }
        
        /* 월 구분 선 제거 */
        .gantt-chart-wrapper g.calendarTop line {
          display: none !important;
        }
        
        /* 모든 작업 텍스트를 검은색으로 설정 */
        .gantt-chart-wrapper svg text {
          fill: currentColor !important;
          font-weight: 500 !important;
          text-anchor: middle !important;
          dominant-baseline: central !important;
        }
        
        /* 작업 바 내부 텍스트 - 위치 강제 설정 */
        .gantt-chart-wrapper g[data-id] text {
          text-anchor: middle !important;
          dominant-baseline: central !important;
          fill: currentColor !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          pointer-events: none !important;
          x: auto !important;
          y: auto !important;
        }
        
        /* tspan 초기화 */
        .gantt-chart-wrapper g[data-id] text tspan {
          x: auto !important;
          y: auto !important;
          dx: 0 !important;
          dy: 0 !important;
        }
        
        .dark .gantt-chart-wrapper line {
          stroke: #374151 !important;
        }
        
        /* 텍스트 색상 - 다크모드 대응 */
        .gantt-chart-wrapper text {
            fill: #111827; /* gray-900 */
        }
        .dark .gantt-chart-wrapper text {
            fill: #f3f4f6 !important; /* gray-100 */
        }
      `}</style>
    </div>
  );
}
