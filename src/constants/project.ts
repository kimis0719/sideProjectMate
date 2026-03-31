export const PROJECT_STAGES = ['idea', 'prototype', 'mvp', 'beta', 'launched'] as const;
export const PROJECT_STATUSES = ['recruiting', 'in_progress', 'completed', 'paused'] as const;
export const EXECUTION_STYLES = ['ai_heavy', 'balanced', 'traditional'] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ExecutionStyle = (typeof EXECUTION_STYLES)[number];

export const STAGE_LABELS: Record<ProjectStage, string> = {
  idea: '아이디어',
  prototype: '프로토타입',
  mvp: 'MVP',
  beta: '베타',
  launched: '런칭 완료',
};

export const STYLE_LABELS: Record<ExecutionStyle, string> = {
  ai_heavy: 'AI 중심',
  balanced: '밸런스',
  traditional: '전통적',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  recruiting: '모집 중',
  in_progress: '진행 중',
  completed: '완료',
  paused: '일시 중지',
};
