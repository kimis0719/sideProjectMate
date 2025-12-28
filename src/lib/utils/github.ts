import { gql, GraphQLClient } from 'graphql-request';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

// GitHub Personal Access Token (시스템 공용 토큰)
// .env.local에 GITHUB_ACCESS_TOKEN=ghp_... 형태로 설정 필요
const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

// GraphQL 클라이언트 생성
const graphQLClient = new GraphQLClient(GITHUB_GRAPHQL_API, {
  headers: {
    authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
  },
});

// 유저 통계 쿼리
const USER_STATS_QUERY = gql`
  query getUserStats($login: String!) {
    user(login: $login) {
      name
      company
      location
      bio
      followers {
        totalCount
      }
      following {
        totalCount
      }
      starredRepositories {
        totalCount
      }
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
        totalCount
        nodes {
          primaryLanguage {
            name
          }
          stargazerCount
        }
      }
      pullRequests {
        totalCount
      }
      issues {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
      }
    }
  }
`;

export interface GitHubStats {
  followers: number;
  following: number;
  totalStars: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  contributions: number;
  techStack: string[];
}

/**
 * GitHub 사용자 통계 가져오기
 * @param username GitHub 사용자명
 * @returns 통계 객체 또는 null (실패 시)
 */
export async function fetchGitHubStats(username: string): Promise<GitHubStats | null> {
  if (!GITHUB_ACCESS_TOKEN) {
    console.warn('GITHUB_ACCESS_TOKEN is missing. Skipping GitHub fetch.');
    return null;
  }

  try {
    const data: any = await graphQLClient.request(USER_STATS_QUERY, { login: username });
    const user = data.user;

    // 언어 통계 계산 (상위 5개)
    const languageMap = new Map<string, number>();
    user.repositories.nodes.forEach((repo: any) => {
      if (repo.primaryLanguage) {
        const lang = repo.primaryLanguage.name;
        languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
      }
    });

    // 많이 쓰인 순으로 정렬하여 Top 5 추출
    const sortedLanguages = Array.from(languageMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    // 총 스타 수 계산
    const totalStars = user.repositories.nodes.reduce((acc: number, repo: any) => acc + repo.stargazerCount, 0);

    return {
      followers: user.followers.totalCount,
      following: user.following.totalCount,
      totalStars: totalStars,
      totalCommits: user.contributionsCollection.totalCommitContributions + user.contributionsCollection.restrictedContributionsCount,
      totalPRs: user.pullRequests.totalCount,
      totalIssues: user.issues.totalCount,
      contributions: user.contributionsCollection.totalCommitContributions,
      techStack: sortedLanguages,
    };
  } catch (error) {
    console.error(`Failed to fetch GitHub stats for ${username}:`, error);
    return null;
  }
}
