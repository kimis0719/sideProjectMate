import { gql } from 'graphql-request';

export const GET_USER_STATS = gql`
  query GetUserStats($username: String!) {
    user(login: $username) {
      avatarUrl
      bio
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          contributions {
            totalCount
          }
          repository {
            name
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
      pullRequests(first: 100, states: MERGED, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          additions
          deletions
          state
          mergedAt
        }
      }
    }
  }
`;
