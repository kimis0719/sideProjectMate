export interface GitHubUserResponse {
    user: {
        avatarUrl: string;
        bio: string;
        contributionsCollection: {
            totalCommitContributions: number;
            totalPullRequestContributions: number;
            totalPullRequestReviewContributions: number;
            totalIssueContributions: number;
            contributionCalendar: {
                totalContributions: number;
                weeks: {
                    contributionDays: {
                        contributionCount: number;
                        date: string;
                    }[];
                }[];
            };
            commitContributionsByRepository: {
                contributions: {
                    totalCount: number;
                };
                repository: {
                    name: string;
                    stargazerCount: number;
                    primaryLanguage: {
                        name: string;
                        color: string;
                    } | null;
                    repositoryTopics: {
                        nodes: {
                            topic: {
                                name: string;
                            };
                        }[];
                    };
                    object: {
                        text?: string;
                    } | null;
                };
            }[];
        };
        pullRequests: {
            nodes: {
                additions: number;
                deletions: number;
                state: string;
                mergedAt: string;
            }[];
        };
    };
}
