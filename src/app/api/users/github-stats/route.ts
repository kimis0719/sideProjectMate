import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github/client';
import { GET_USER_STATS } from '@/lib/github/queries';
import { calculateGitHubStats, GitHubStats } from '@/lib/github/utils';
import { GitHubUserResponse } from '@/lib/github/types';

// [핵심] 연결 안 된 경우 보여줄 '0점' 짜리 기본 데이터 정의
const EMPTY_STATS: GitHubStats = {
    level: { value: 0, label: 'Novice' },
    techTiers: [],
    envTiers: [],
    activity: {
        totalCommits: 0,
        totalPRs: 0,
        totalReviews: 0,
        totalIssues: 0,
        recentPRLines: 0,
    },
    contributionCalendar: {
        totalContributions: 0,
        weeks: []
    },
    topRepos: []
};

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get('username');

    // 1. 유저네임이 아예 없거나 비어있으면 => 에러 내지 말고 '빈 데이터' 반환
    if (!username || username.trim() === '') {
        return NextResponse.json(EMPTY_STATS);
    }

    try {
        const data = await githubClient.request<GitHubUserResponse>(GET_USER_STATS, { username });
        const stats: GitHubStats = calculateGitHubStats(data);

        return NextResponse.json(stats);
    } catch (error: any) {
        // 2. API 호출 실패 시 (유저가 없거나, 토큰 문제 등) => 로그만 남기고 '빈 데이터' 반환
        console.error('GitHub API Error:', error?.message || 'Unknown error');
        // 개발 중 디버깅을 위해 토큰 상태는 로그에 남겨둠
        // console.log('Token Status:', process.env.GITHUB_ACCESS_TOKEN ? 'Present' : 'Missing');

        // 프론트엔드가 터지지 않도록 빈 통계를 줌
        return NextResponse.json(EMPTY_STATS);
    }
}