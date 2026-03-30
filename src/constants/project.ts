export const PROJECT_STAGES = ['idea', 'prototype', 'mvp', 'beta', 'launched'] as const;
export const PROJECT_STATUSES = ['recruiting', 'in_progress', 'completed', 'paused'] as const;
export const EXECUTION_STYLES = ['ai_heavy', 'balanced', 'traditional'] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ExecutionStyle = (typeof EXECUTION_STYLES)[number];
