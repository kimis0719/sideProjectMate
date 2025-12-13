import { GitHubUserResponse } from './types';

export interface GitHubStats {
    level: {
        value: number;
        label: string;
    };
    techTiers: {
        language: string;
        grade: string;
        color: string;
        score: number;
    }[];
    activity: {
        totalCommits: number;
        totalPRs: number;
        totalReviews: number;
        totalIssues: number;
        recentPRLines: number;
    };
}

export function calculateGitHubStats(data: GitHubUserResponse): GitHubStats {
    const user = data.user;
    const contribution = user.contributionsCollection;

    // 1. Calculate Activity Score (Dev Level)
    const totalCommits = contribution.totalCommitContributions;
    const totalPRs = contribution.totalPullRequestContributions;
    const totalReviews = contribution.totalPullRequestReviewContributions;
    const totalIssues = contribution.totalIssueContributions;

    // Recent PR analysis (additions)
    const recentPRLines = user.pullRequests.nodes.reduce((acc, pr) => acc + pr.additions, 0);

    // Score Formula
    // Base: Commits(10), PRs(50), Reviews(100), Issues(20)
    // Quality: PR Lines * 0.1 (100 lines = 10 pts = 1 commit equivalent)
    const baseScore =
        (totalCommits * 10) +
        (totalPRs * 50) +
        (totalReviews * 100) +
        (totalIssues * 20);

    const qualityScore = Math.min(recentPRLines * 0.1, 10000); // Cap quality score to prevent distortion by massive auto-generated files

    const totalScore = baseScore + qualityScore;
    const level = calculateLevel(totalScore);

    // 2. Calculate Tech Tiers
    const languageScores: Record<string, { score: number; color: string }> = {};

    contribution.commitContributionsByRepository.forEach((repoContrib) => {
        const lang = repoContrib.repository.primaryLanguage;
        if (!lang) return;

        const commits = repoContrib.contributions.totalCount;
        const stars = repoContrib.repository.stargazerCount;

        // Weight: Commits * (1 + Stars/10) -> High stars give huge boost
        // e.g. 10 commits to 1000 star repo = 10 * 101 = 1010 pts
        // e.g. 10 commits to 0 star repo = 10 * 1 = 10 pts
        const weight = 1 + (Math.log10(stars + 1)); // Log scale for stars to be less aggressive: 0->1, 10->2, 100->3, 1000->4
        const score = commits * weight; // actually let's use the log scale. 0 stars = x1, 100 stars = x3. Reasonable.

        if (!languageScores[lang.name]) {
            languageScores[lang.name] = { score: 0, color: lang.color };
        }
        languageScores[lang.name].score += score;
    });

    const techTiers = Object.entries(languageScores)
        .map(([lang, { score, color }]) => ({
            language: lang,
            score,
            color,
            grade: calculateGrade(score),
        }))
        .sort((a, b) => b.score - a.score);

    return {
        level,
        techTiers,
        activity: {
            totalCommits,
            totalPRs,
            totalReviews,
            totalIssues,
            recentPRLines,
        },
    };
}

function calculateLevel(score: number): { value: number; label: string } {
    // Simple sqrt curve or tiered? 
    // Lv 1: 0
    // Lv 10: 1000
    // Lv 20: 5000
    // Lv 50: 50000
    // Let's use sqrt: Lv = sqrt(score / 20)
    const lv = Math.floor(Math.sqrt(score / 15));
    let label = 'Novice';
    if (lv >= 50) label = 'Grandmaster';
    else if (lv >= 40) label = 'Code Architect';
    else if (lv >= 30) label = 'Senior Contributor';
    else if (lv >= 20) label = 'Active Developer';
    else if (lv >= 10) label = 'Junior Developer';

    return { value: Math.max(1, lv), label };
}

function calculateGrade(score: number): string {
    // Score depends on commits * star_weight.
    // 100 commits on personal projects = 100 pts.
    // 30 commits on major project (1k stars, x4) = 120 pts.

    if (score >= 2000) return 'A+'; // ~2000 commits or ~500 commits on huge projects
    if (score >= 1000) return 'A';
    if (score >= 500) return 'B+';
    if (score >= 200) return 'B';
    if (score >= 100) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 20) return 'D';
    if (score >= 5) return 'E';
    return 'F';
}
