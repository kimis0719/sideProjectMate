export const LAUNCH_STYLES = ['quick', 'thorough'] as const;
export type LaunchStyle = (typeof LAUNCH_STYLES)[number];

export const WORK_STYLES = [
  'ai_heavy',
  'fast_launch',
  'quality_first',
  'async_first',
  'sync_preferred',
] as const;
export type WorkStyle = (typeof WORK_STYLES)[number];

// @deprecated — Phase 1에서 UserModel role 필드 optional 처리 예정
export const USER_ROLES = ['프론트엔드', '백엔드', '디자이너', '기획'] as const;
export type UserRole = (typeof USER_ROLES)[number];
