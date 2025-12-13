/**
 * 간트차트에서 작업 간 의존관계 연결선을 그리는 유틸리티
 */

export interface TaskPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * SVG에 곡선 경로를 생성하는 함수
 * Bezier 곡선으로 매끄러운 연결선 생성
 */
export const createCurvePath = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  taskHeight: number
): string => {
  const midX = (fromX + toX) / 2;
  const fromYMid = fromY + taskHeight / 2;
  const toYMid = toY + taskHeight / 2;

  return `M ${fromX} ${fromYMid} 
          C ${midX} ${fromYMid}, 
            ${midX} ${toYMid}, 
            ${toX} ${toYMid}`;
};

/**
 * 작업 위치 정보 추출
 * gantt-task-react의 SVG 구조를 분석하여 각 작업의 위치를 추출
 */
export const getTaskPositions = (ganttContainer: HTMLElement): Map<string, TaskPosition> => {
  const positions = new Map<string, TaskPosition>();
  
  const svg = ganttContainer.querySelector('svg') as SVGSVGElement | null;
  if (!svg) return positions;

  // gantt-task-react는 각 작업을 g[data-id] 로 감싸고, 그 안에 rect를 포함
  // 작업 그룹 찾기: <g data-id="taskId">
  const groups = svg.querySelectorAll('g[data-id]');
  
  groups.forEach((group) => {
    const taskId = group.getAttribute('data-id');
    if (!taskId) return;

    // 그룹 내 첫 번째 rect 찾기 (작업 바)
    const rect = group.querySelector('rect');
    if (!rect) return;

    const x = parseFloat(rect.getAttribute('x') || '0');
    const y = parseFloat(rect.getAttribute('y') || '0');
    const width = parseFloat(rect.getAttribute('width') || '0');
    const height = parseFloat(rect.getAttribute('height') || '0');

    // 유효한 작업 바만 처리 (최소 크기 검사)
    if (width > 5 && height > 2) {
      positions.set(taskId, {
        id: taskId,
        x: x + width, // 우측 끝점
        y: y + height / 2, // 중앙 높이
        width,
        height,
      });
    }
  });

  return positions;
};

/**
 * 간트차트에 의존관계 연결선 그리기
 */
export const drawDependencyLines = (
  ganttContainer: HTMLElement,
  taskMap: Map<string, any>,
  taskPositions: Map<string, TaskPosition>,
  isDarkMode: boolean
) => {
  // 기존 의존관계 그래픽 제거
  const existingSvg = ganttContainer.querySelector('#dependency-lines-svg');
  if (existingSvg) {
    existingSvg.remove();
  }

  if (taskPositions.size === 0) {
    return;
  }

  // 메인 SVG 찾기
  const mainSvg = ganttContainer.querySelector('svg') as SVGSVGElement | null;
  if (!mainSvg) return;

  // 의존관계 정보 수집
  const dependencyLinks: Array<{ from: string; to: string; fromPos: TaskPosition; toPos: TaskPosition }> = [];

  taskMap.forEach((task) => {
    if (!task.dependencies || task.dependencies.length === 0) return;

    const toPosition = taskPositions.get(task.id);
    if (!toPosition) return;

    task.dependencies.forEach((dep: any) => {
      // dependencies 형식이 다양할 수 있으므로 정확히 처리
      let depTaskId = '';
      if (typeof dep === 'string') {
        depTaskId = dep;
      } else if (typeof dep === 'object' && dep !== null) {
        depTaskId = dep.taskId || dep._id || '';
      }

      if (!depTaskId) return;

      const fromPosition = taskPositions.get(depTaskId);
      if (!fromPosition) return;

      dependencyLinks.push({
        from: depTaskId,
        to: task.id,
        fromPos: fromPosition,
        toPos: toPosition,
      });
    });
  });

  if (dependencyLinks.length === 0) {
    return;
  }

  // 오버레이 SVG 생성
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'dependency-lines-svg';
  
  // viewBox 설정 (메인 SVG와 동일하게)
  const viewBox = mainSvg.getAttribute('viewBox');
  if (viewBox) {
    svg.setAttribute('viewBox', viewBox);
  }
  
  const width = mainSvg.getAttribute('width');
  const height = mainSvg.getAttribute('height');
  if (width) svg.setAttribute('width', width);
  if (height) svg.setAttribute('height', height);
  
  svg.setAttribute('style', 'position: absolute; top: 0; left: 0; pointer-events: none; z-index: 1;');
  svg.setAttribute('class', 'dependency-lines');

  // Defs에 화살표 마커 추가
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', 'arrow-marker');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill', isDarkMode ? '#9ca3af' : '#6b7280');

  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // 연결선 그리기
  dependencyLinks.forEach(({ from, to, fromPos, toPos }) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = createCurvePath(fromPos.x, fromPos.y, toPos.x, toPos.y, toPos.height);

    path.setAttribute('d', d);
    path.setAttribute('stroke', isDarkMode ? '#9ca3af' : '#9ca3af');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrow-marker)');
    path.setAttribute('stroke-dasharray', '5,5');
    path.setAttribute('opacity', '0.7');
    path.setAttribute('class', `dep-line dep-from-${from} dep-to-${to}`);

    svg.appendChild(path);
  });

  // SVG를 컨테이너에 추가
  ganttContainer.style.position = 'relative';
  ganttContainer.appendChild(svg);

  return svg;
};

/**
 * 특정 작업의 의존관계 강조
 */
export const highlightDependencies = (
  ganttContainer: HTMLElement,
  taskId: string,
  type: 'from' | 'to' | 'both' = 'both'
) => {
  const lines = ganttContainer.querySelectorAll('.dependency-line');
  
  lines.forEach((line) => {
    const className = line.getAttribute('class') || '';
    const isFrom = className.includes(`dependency-from-${taskId}`);
    const isTo = className.includes(`dependency-to-${taskId}`);

    if (type === 'both' && (isFrom || isTo)) {
      (line as SVGPathElement).setAttribute('stroke-width', '3');
      (line as SVGPathElement).setAttribute('opacity', '1');
      (line as SVGPathElement).setAttribute('stroke', '#3b82f6');
    } else if (type === 'from' && isFrom) {
      (line as SVGPathElement).setAttribute('stroke-width', '3');
      (line as SVGPathElement).setAttribute('opacity', '1');
      (line as SVGPathElement).setAttribute('stroke', '#10b981');
    } else if (type === 'to' && isTo) {
      (line as SVGPathElement).setAttribute('stroke-width', '3');
      (line as SVGPathElement).setAttribute('opacity', '1');
      (line as SVGPathElement).setAttribute('stroke', '#ef4444');
    } else {
      (line as SVGPathElement).setAttribute('stroke-width', '2');
      (line as SVGPathElement).setAttribute('opacity', '0.3');
      (line as SVGPathElement).setAttribute('stroke', '#9ca3af');
    }
  });
};

/**
 * 의존관계 연결선 디버그 정보 출력
 */
export const debugDependencyInfo = (
  ganttContainer: HTMLElement,
  taskMap: Map<string, any>,
  taskPositions: Map<string, TaskPosition>
) => {
  console.group('🔗 Dependency Line Debug Info');
  
  // Task 정보 출력
  const taskInfo = Array.from(taskMap.entries()).map(([id, task]) => {
    const deps = task.dependencies || [];
    return {
      id,
      title: task.title,
      dependenciesRaw: deps,
      dependenciesCount: deps.length,
      // 의존관계를 정확히 추출
      dependencyIds: deps.map((dep: any) => {
        if (typeof dep === 'string') return dep;
        if (typeof dep === 'object' && dep.taskId) return dep.taskId;
        return '(unknown)';
      }),
    };
  });

  console.log('📊 Task Map:', {
    total: taskMap.size,
    tasks: taskInfo,
  });

  console.log('📍 Task Positions Found:', {
    total: taskPositions.size,
    ids: Array.from(taskPositions.keys()),
  });

  // 의존관계 연결 가능 여부 검증
  const linkValidation: any[] = [];
  taskMap.forEach((task) => {
    if (!task.dependencies || task.dependencies.length === 0) return;

    task.dependencies.forEach((dep: any) => {
      const depId = typeof dep === 'string' ? dep : (typeof dep === 'object' ? dep.taskId : null);
      if (!depId) return;

      const hasFrom = taskPositions.has(depId);
      const hasTo = taskPositions.has(task.id);

      linkValidation.push({
        from: depId,
        to: task.id,
        fromFound: hasFrom,
        toFound: hasTo,
        canDraw: hasFrom && hasTo,
      });
    });
  });

  console.log('🔍 Dependency Links:', {
    total: linkValidation.length,
    drawable: linkValidation.filter(l => l.canDraw).length,
    issues: linkValidation.filter(l => !l.canDraw),
  });

  console.groupEnd();
};

/**
 * 의존관계 강조 해제
 */
export const clearHighlightDependencies = (ganttContainer: HTMLElement) => {
  const lines = ganttContainer.querySelectorAll('.dep-line');
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  lines.forEach((line) => {
    (line as SVGPathElement).setAttribute('stroke-width', '2');
    (line as SVGPathElement).setAttribute('opacity', '0.7');
    (line as SVGPathElement).setAttribute('stroke', isDarkMode ? '#9ca3af' : '#9ca3af');
  });
};

