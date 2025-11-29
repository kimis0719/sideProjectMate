'use client';

import { useEffect, useState, useRef } from 'react';
import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Task } from '@/store/wbsStore';

interface GanttChartProps {
  tasks: Task[];
  viewMode: 'Day' | 'Week' | 'Month';
  onTaskClick?: (task: Task) => void;
  onDateChange?: (task: Task, start: Date, end: Date) => void;
}

export default function GanttChart({ tasks, viewMode, onTaskClick, onDateChange }: GanttChartProps) {
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(0);

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
      type: 'task',
      progress: task.progress,
      isDisabled: false,
      styles: {
        progressColor: task.status === 'done' ? '#10b981' : '#3b82f6',
        progressSelectedColor: task.status === 'done' ? '#059669' : '#2563eb',
        backgroundColor: task.status === 'done' ? '#d1fae5' : '#dbeafe',
        backgroundSelectedColor: task.status === 'done' ? '#a7f3d0' : '#bfdbfe',
      },
      project: task.pid.toString(),
      dependencies: task.dependencies?.map(dep => dep.toString()),
    }));

    // 1년 범위 강제 확장을 위한 투명 더미 작업 추가
    const today = new Date();
    const startBoundary = new Date(today);
    startBoundary.setMonth(today.getMonth() - 6);
    const endBoundary = new Date(today);
    endBoundary.setMonth(today.getMonth() + 6);

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

  }, [tasks, viewMode]);

  const handleTaskChange = (task: GanttTask) => {
    const originalTask = tasks.find((t) => t.id === task.id);
    if (originalTask && onDateChange) {
      onDateChange(originalTask, task.start, task.end);
    }
  };

  const handleSelect = (task: GanttTask, isSelected: boolean) => {
    if (isSelected && onTaskClick) {
      const originalTask = tasks.find((t) => t.id === task.id);
      if (originalTask) {
        onTaskClick(originalTask);
      }
    }
  };

  const getGanttViewMode = (mode: 'Day' | 'Week' | 'Month'): ViewMode => {
    switch (mode) {
      case 'Day': return ViewMode.Day;
      case 'Week': return ViewMode.Week;
      case 'Month': return ViewMode.Month;
      default: return ViewMode.Day;
    }
  };

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
      <div ref={wrapperRef} style={{ width: chartWidth > 0 ? `${chartWidth}px` : '100%', height: '100%' }}>
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
