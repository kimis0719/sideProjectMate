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
  envTiers: {
    topic: string;
    grade: string;
    score: number;
  }[];
  activity: {
    totalCommits: number;
    totalPRs: number;
    totalReviews: number;
    totalIssues: number;
    recentPRLines: number;
  };
  contributionCalendar: {
    totalContributions: number;
    weeks: {
      contributionDays: {
        contributionCount: number;
        date: string;
      }[];
    }[];
  };
  topRepos: {
    name: string;
    stars: number;
    contributions: number;
  }[];
}

export function calculateGitHubStats(data: GitHubUserResponse): GitHubStats {
  const user = data.user;
  const contribution = user.contributionsCollection;

  // 1. 활동 점수 (Activity Score) 계산
  // 개발자의 전반적인 활동량을 측정합니다.
  const totalCommits = contribution.totalCommitContributions;
  const totalPRs = contribution.totalPullRequestContributions;
  const totalReviews = contribution.totalPullRequestReviewContributions;
  const totalIssues = contribution.totalIssueContributions;

  // PR 분석: 최근 기여한 코드 라인 수 (Auto-generated 파일 등의 왜곡 방지를 위해 사용)
  const recentPRLines = user.pullRequests.nodes.reduce((acc, pr) => acc + pr.additions, 0);

  // 🧮 활동 점수 공식 (Score Formula)
  // - Commit: 10점 (가장 기본적인 기여)
  // - PR: 50점 (코드 리뷰를 거치는 의미 있는 기여)
  // - Review: 100점 (타인의 코드를 검증하는 높은 수준의 기여)
  // - Issue: 20점 (문제 정의 및 소통)
  const baseScore = totalCommits * 10 + totalPRs * 50 + totalReviews * 100 + totalIssues * 20;

  // 품질 점수 (Quality Score)
  // 무지성 커밋을 방지하기 위해 PR의 코드 라인 수 반영 (최대 10,000점 제한)
  // Line * 0.1점 (100줄 = 10점 = 1커밋과 동등)
  const qualityScore = Math.min(recentPRLines * 0.1, 10000);

  const totalScore = baseScore + qualityScore;
  const level = calculateLevel(totalScore);

  // 2. Calculate Tech Tiers
  const languageScores: Record<string, { score: number; color: string }> = {};
  const topicScores: Record<string, number> = {};
  const displayNameMap: Record<string, string> = {};

  const normalizeKey = (key: string) => key.toLowerCase().replace(/[\.\-_]/g, '');

  // Contribution by Repo Analysis
  const repoStats = contribution.commitContributionsByRepository
    .map((repoContrib) => {
      return {
        name: repoContrib.repository.name,
        stars: repoContrib.repository.stargazerCount,
        contributions: repoContrib.contributions.totalCount,
      };
    })
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 3);

  contribution.commitContributionsByRepository.forEach((repoContrib) => {
    const lang = repoContrib.repository.primaryLanguage;
    const topics = repoContrib.repository.repositoryTopics.nodes;

    // Debug Log
    if (topics.length > 0) {
      // console.log(`Repo: ${repoContrib.repository.name}, Topics:`, topics.map(t => t.topic.name));
    }

    // 2. 기술 스택 & 환경 점수 계산 (Tech & Env Score)
    const commits = repoContrib.contributions.totalCount;
    const stars = repoContrib.repository.stargazerCount;

    // ⚖️ 리포지토리 가중치 (Weight)
    // 스타가 많은 유명 프로젝트에 기여할수록 더 높은 점수를 부여합니다.
    // 공식: 1 + log10(Stars + 1)
    // - Star 0개: 가중치 1 (1배)
    // - Star 10개: 가중치 2 (2배)
    // - Star 100개: 가중치 3 (3배)
    // - Star 1,000개: 가중치 4 (4배)
    const weight = 1 + Math.log10(stars + 1);
    const score = commits * weight;

    // Language Score
    if (lang) {
      if (!languageScores[lang.name]) {
        languageScores[lang.name] = { score: 0, color: lang.color };
      }
      languageScores[lang.name].score += score;
    }

    // Topic (Environment) Score
    topics.forEach((node) => {
      const rawName = node.topic.name;
      const normKey = normalizeKey(rawName);

      if (!topicScores[normKey]) {
        topicScores[normKey] = 0;
      }
      topicScores[normKey] += score;

      // Preserve display name (prefer longer/capitalized ones if possible, but topics are usually lowercase)
      if (!displayNameMap[normKey]) {
        displayNameMap[normKey] = rawName;
      }
    });

    // Dependency Analysis (package.json)
    const packageJsonText = repoContrib.repository.object?.text;
    if (packageJsonText) {
      try {
        const pkg = JSON.parse(packageJsonText);
        const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

        // Library Mapping
        const libMapping: Record<string, string> = {
          react: 'React',
          vue: 'Vue.js',
          next: 'Next.js',
          nuxt: 'Nuxt.js',
          svelte: 'Svelte',
          angular: 'Angular',
          tailwindcss: 'TailwindCSS',
          'styled-components': 'Styled Components',
          express: 'Express.js',
          nestjs: 'NestJS',
          django: 'Django',
          flask: 'Flask',
          'spring-boot': 'Spring Boot',
          laravel: 'Laravel',
          flutter: 'Flutter',
          'react-native': 'React Native',
          docker: 'Docker',
          kubernetes: 'Kubernetes',
          tensorflow: 'TensorFlow',
          pytorch: 'PyTorch',
          pandas: 'Pandas',
          three: 'Three.js',
          mongoose: 'Mongoose',
          prisma: 'Prisma',
          supabase: 'Supabase',
          firebase: 'Firebase',
          'socket.io': 'Socket.io',
          redux: 'Redux',
          mobx: 'MobX',
          zustand: 'Zustand',
          graphql: 'GraphQL',
          'apollo-client': 'Apollo',
        };

        Object.keys(dependencies).forEach((dep) => {
          // Exact match or scoped match (e.g. @nestjs/core)
          let matchedEnv = libMapping[dep];

          // Handle scoped packages (simple heuristic)
          if (!matchedEnv) {
            if (dep.includes('nestjs')) matchedEnv = 'NestJS';
            else if (dep.includes('angular')) matchedEnv = 'Angular';
            else if (dep.includes('emotion')) matchedEnv = 'Emotion';
          }

          if (matchedEnv) {
            const normKey = normalizeKey(matchedEnv); // Use normalized key
            if (!topicScores[normKey]) topicScores[normKey] = 0;
            topicScores[normKey] += score;

            // Update display name (Library Mapping usually has better formatting than topics)
            displayNameMap[normKey] = matchedEnv;
          }
        });
      } catch (e) {
        // Ignore parse errors (invalid json in repo)
      }
    }
  });

  const techTiers = Object.entries(languageScores)
    .map(([lang, { score, color }]) => ({
      language: lang,
      score: Math.round(score),
      color,
      grade: calculateGrade(score),
    }))
    .sort((a, b) => b.score - a.score);

  // Filter meaningful frameworks/tools (whitelist approach could be better, but let's take top ones)
  // For now, take top 10 topics that are not just generic words
  const envTiers = Object.entries(topicScores)
    .map(([key, score]) => {
      return {
        topic: displayNameMap[key] || key, // Use stored display name
        score: Math.round(score),
        grade: calculateGrade(score),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 environments

  return {
    level,
    techTiers,
    envTiers,
    activity: {
      totalCommits,
      totalPRs,
      totalReviews,
      totalIssues,
      recentPRLines,
    },
    contributionCalendar: contribution.contributionCalendar,
    topRepos: repoStats,
  };
}

// 📊 개발자 레벨 계산 로직
function calculateLevel(score: number): { value: number; label: string } {
  // 점수 산정 방식: 제곱근 곡선 사용
  // 단순 선형 비례가 아니라, 레벨이 오를수록 더 많은 점수가 필요하도록 설정함.
  // 공식: Level = sqrt(Total Score / 15)

  // 예시 점수별 레벨:
  // - 0점 -> Lv.0
  // - 1,500점 -> Lv.10
  // - 6,000점 -> Lv.20
  // - 37,500점 -> Lv.50
  const lv = Math.floor(Math.sqrt(score / 15));

  let label = 'Novice';
  if (lv >= 50)
    label = 'Grandmaster'; // 상위 1% (엄청난 기여도)
  else if (lv >= 40)
    label = 'Code Architect'; // 숙련된 아키텍트 수준
  else if (lv >= 30)
    label = 'Senior Contributor'; // 시니어 레벨
  else if (lv >= 20)
    label = 'Active Developer'; // 꾸준한 활동가
  else if (lv >= 10) label = 'Junior Developer'; // 성장하는 주니어

  return { value: Math.max(1, lv), label };
}

// 🏆 기술 스택 등급(Tier) 계산 로직
function calculateGrade(score: number): string {
  // 점수는 (커밋 수 * 리포지토리 가중치)로 계산됨.
  // 리포지토리 가중치 = 1 + log10(스타 수 + 1)
  // 예: 스타 0개 리포지토리에 100커밋 = 100점
  // 예: 스타 1000개(Star Weight=4) 리포지토리에 25커밋 = 100점

  if (score >= 2000) return 'A+'; // 상위 5% (해당 기술의 마스터)
  if (score >= 1000) return 'A'; // 매우 능숙함
  if (score >= 500) return 'B+'; // 실무 레벨 상급
  if (score >= 200) return 'B'; // 실무 레벨 중급
  if (score >= 100) return 'C+'; // 기초가 탄탄함
  if (score >= 50) return 'C'; // 기본적인 사용 가능
  if (score >= 20) return 'D'; // 입문 단계
  if (score >= 5) return 'E'; // 찍먹 단계
  return 'F'; // 경험 없음
}
