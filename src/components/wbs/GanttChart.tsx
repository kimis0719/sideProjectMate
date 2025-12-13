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

      const texts = Array.from(ganttContainer.querySelectorAll('svg > text'));
      const allTexts = Array.from(ganttContainer.querySelectorAll('text'));

      const headerTexts = allTexts.filter(text => {
        const y = text.getAttribute('y');
        return y && parseFloat(y) < 120;
      });

      const topTexts = headerTexts.filter(text => {
        const y = parseFloat(text.getAttribute('y') || '0');
        return y < 60;
      });

      const bottomTexts = headerTexts.filter(text => {
        const y = parseFloat(text.getAttribute('y') || '0');
        return y >= 60;
      });

      topTexts.forEach((text: any) => {
        if (text.classList.contains('formatted-year')) return;

        const content = text.textContent || '';
        let year = '';
        let month = '';

        if (content.match(/\d{4}년/)) {
          year = content.match(/(\d{4}년)/)?.[0] || '';
          month = content.replace(year, '').trim();
        } else if (content.match(/\d{4}-\d{2}/)) {
          const parts = content.split('-');
          year = parts[0] + '년';
          month = parts[1] + '월';
        } else {
          year = content;
        }

        if (year) {
          text.textContent = year;
          text.setAttribute('y', '30');
          text.setAttribute('dominant-baseline', 'central');
          text.classList.add('formatted-year');
          text.style.fontSize = '14px';
          text.style.fontWeight = 'bold';
          text.style.fill = '#1f2937';

          if (month) {
            const nextSibling = text.nextSibling;
            if (nextSibling && nextSibling.classList?.contains('formatted-month')) {
              nextSibling.textContent = month;
            } else {
              const monthText = text.cloneNode(true);
              monthText.textContent = month;
              monthText.setAttribute('y', '70');
              monthText.classList.remove('formatted-year');
              monthText.classList.add('formatted-month');
              monthText.style.fontSize = '13px';
              monthText.style.fontWeight = 'normal';
              monthText.style.fill = '#4b5563';
              text.parentNode?.insertBefore(monthText, text.nextSibling);
            }
          }
        }
      });

      bottomTexts.forEach((text: any) => {
        text.setAttribute('y', '105');
        text.setAttribute('dominant-baseline', 'central');
        text.style.fill = '#6b7280';
        text.style.fontSize = '12px';
      });

      let linesGroup = svg.querySelector('#custom-header-lines');
      if (!linesGroup) {
        linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        linesGroup.id = 'custom-header-lines';
        svg.insertBefore(linesGroup, svg.firstChild);
      }

      linesGroup.innerHTML = '';

      const createLine = (y: string) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', '0');
        line.setAttribute('y1', y);
        line.setAttribute('x2', '100%');
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#e5e7eb');
        line.setAttribute('stroke-width', '1');
        return line;
      };

      linesGroup.appendChild(createLine('40'));
      linesGroup.appendChild(createLine('80'));
    };

    const timer = setInterval(formatHeader, 500);
    setTimeout(formatHeader, 100);

    return () => clearInterval(timer);
  }, [ganttTasks, viewMode]);

  return (
    <div className="gantt-chart-wrapper h-[600px] overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>작업이 없습니다. 새 작업을 추가해보세요!</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .gantt-chart-wrapper .gantt-task-react-header {
          height: 120px !important;
        }
        .dark .gantt-chart-wrapper text {
          fill: #e5e7eb !important;
        }
        .dark .gantt-chart-wrapper line {
          stroke: #374151 !important;
        }
      `}</style>
    </div>
  );
}
