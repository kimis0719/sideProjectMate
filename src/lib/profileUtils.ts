export interface ProfileCompletenessParams {
    avatarUrl?: string;
    position?: string;
    career?: string;
    introduction?: string;
    techTags?: string[];
    socialLinks?: {
        github?: string;
        blog?: string;
        solvedAc?: string;
    };
    portfolioLinks?: string[];
    schedule?: any[];
}

/**
 * 사용자 프로필 데이터를 기반으로 완성도 점수(0~100)를 계산합니다.
 * @param user 
 */
export function calculateProfileCompleteness(user: ProfileCompletenessParams): number {
    let score = 0;

    // 1. Basic Info (30%)
    if (user.avatarUrl) score += 15;
    if (user.position && user.position.length > 0) score += 10;
    if (user.career && user.career.length > 0) score += 5;

    // 2. Content (40%)
    if (user.introduction && user.introduction.length > 10) score += 20;
    if (user.techTags && user.techTags.length > 0) score += 20;

    // 3. Activity & Links (30%)
    const socialCount = [
        user.socialLinks?.github,
        user.socialLinks?.blog,
        user.socialLinks?.solvedAc,
        ...(user.portfolioLinks || [])
    ].filter(Boolean).length;

    if (socialCount > 0) score += 15;

    if (user.schedule && user.schedule.length > 0) score += 15;

    return Math.min(score, 100);
}
