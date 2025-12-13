import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github/client';
import { GET_USER_STATS } from '@/lib/github/queries';
import { calculateGitHubStats, GitHubStats } from '@/lib/github/utils';
import { GitHubUserResponse } from '@/lib/github/types';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const data = await githubClient.request<GitHubUserResponse>(GET_USER_STATS, { username });
        const stats: GitHubStats = calculateGitHubStats(data);

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('GitHub API Error Details:', JSON.stringify(error, null, 2));
        console.log('Token Status:', process.env.GITHUB_ACCESS_TOKEN ? 'Present' : 'Missing');
        return NextResponse.json(
            { error: 'Failed to fetch GitHub stats', details: error.message },
            { status: 500 }
        );
    }
}
