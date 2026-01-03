import User from '@/lib/models/User';
import { githubClient } from '@/lib/github/client';
import { GET_USER_STATS } from '@/lib/github/queries';
import { calculateGitHubStats } from '@/lib/github/utils';

/**
 * 사용자의 GitHub 통계 및 기술 스택을 업데이트합니다.
 * @param userId DB 유저 ID
 * @param githubUrl 깃허브 프로필 URL (예: https://github.com/username)
 */
export async function updateUserGithubStats(userId: string, githubUrl: string): Promise<boolean> {
    try {
        if (!githubUrl) return false;

        const cleanUrl = githubUrl.replace(/\/$/, ''); // Trailing slash 제거
        const username = cleanUrl.split('/').pop();

        if (!username) {
            console.warn(`[GitHub Service] Invalid GitHub URL: ${githubUrl}`);
            return false;
        }

        console.log(`[GitHub Service] Syncing stats for: ${username} (User: ${userId})`);

        // GitHub API 호출
        const data = await githubClient.request<any>(GET_USER_STATS, { username });
        const stats = calculateGitHubStats(data);

        if (!stats) {
            console.warn(`[GitHub Service] Failed to calculate stats for: ${username}`);
            return false;
        }

        // 통합 기술 스택 추출 (Language + Topic/Lib)
        const techStackFromStats = [
            ...stats.techTiers.map(t => t.language),
            ...stats.envTiers.map(t => t.topic)
        ];

        // DB 업데이트
        const user = await User.findById(userId);
        if (!user) {
            console.warn(`[GitHub Service] User not found: ${userId}`);
            return false;
        }

        user.githubStats = {
            followers: 0, // 기본값 0 (API 미지원)
            following: 0,
            totalStars: 0,
            totalCommits: stats.activity.totalCommits,
            totalPRs: stats.activity.totalPRs,
            totalIssues: stats.activity.totalIssues,
            contributions: stats.activity.totalCommits, // 근사치
            techStack: techStackFromStats
        };

        // 기술 스택 병합 (기존 태그 유지 + 새 스택 추가)
        if (techStackFromStats.length > 0) {
            user.techTags = Array.from(new Set([...(user.techTags || []), ...techStackFromStats]));
        }

        // 레벨 업데이트 (계산된 레벨 사용)
        user.level = stats.level.value;

        await user.save();
        console.log(`[GitHub Service] Successfully updated stats for ${username}`);
        return true;

    } catch (error) {
        console.error(`[GitHub Service] Error updating stats:`, error);
        return false;
    }
}
