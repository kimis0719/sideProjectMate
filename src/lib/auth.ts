import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        authorEmail: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Record<"authorEmail" | "password", string> | undefined) {
        if (!credentials) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        await dbConnect();
        const user = await User.findOne({ authorEmail: credentials.authorEmail });

        if (user && (await user.comparePassword(credentials.password))) {
          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.authorEmail,
            name: user.nName,
          };
        } else {
          throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 로그인 시 GitHub 통계 업데이트 (비동기 시도)
      try {
        if (!user.email) return true;

        await dbConnect();
        // user.email은 NextAuth User 객체의 email
        // 실제 DB User 모델과 매칭 (provider: Credentials이므로 이미 DB에 존재)
        // 하지만 여기서 한번 더 조회하여 업데이트 수행
        const dbUser = await User.findOne({ authorEmail: user.email });

        if (dbUser && dbUser.socialLinks?.github) {
          // GitHub URL에서 username 추출 (https://github.com/username)
          const githubUrl = dbUser.socialLinks.github;
          const cleanUrl = githubUrl.replace(/\/$/, ''); // Trailing slash 제거
          const username = cleanUrl.split('/').pop();

          console.log(`[NextAuth] Attempting to sync GitHub stats for: ${username}`);

          if (username) {
            // [Fix] 기존의 잘 작동하는 Rich GitHub Client 사용 (Framework/Library 포함)
            try {
              const { githubClient } = await import('@/lib/github/client');
              const { GET_USER_STATS } = await import('@/lib/github/queries');
              const { calculateGitHubStats } = await import('@/lib/github/utils');
              // const { GitHubUserResponse } = await import('@/lib/github/types'); // 필요시 import

              const data = await githubClient.request<any>(GET_USER_STATS, { username: username });
              const stats = calculateGitHubStats(data);

              if (stats) {
                // calculateGitHubStats는 techStack 배열을 직접 반환하지 않고 techTiers 등을 반환함
                // 따라서 여기서 통합 리스트를 추출해야 함 (Language + Topic/Lib)
                const techStackFromStats = [
                  ...stats.techTiers.map(t => t.language),
                  ...stats.envTiers.map(t => t.topic)
                ];

                dbUser.githubStats = {
                  followers: 0,
                  following: 0,
                  totalStars: 0,
                  // 매핑 보정:
                  totalCommits: stats.activity.totalCommits,
                  totalPRs: stats.activity.totalPRs,
                  totalIssues: stats.activity.totalIssues,
                  contributions: stats.activity.totalCommits, // 근사치 사용
                  techStack: techStackFromStats
                };

                // 기술 스택 병합 업데이트
                if (techStackFromStats.length > 0) {
                  dbUser.techTags = Array.from(new Set([...(dbUser.techTags || []), ...techStackFromStats]));
                }

                // 레벨 업데이트 (이미 계산된 레벨 사용)
                dbUser.level = stats.level.value;

                await dbUser.save();
                console.log(`[NextAuth] GitHub stats & rich skills updated for ${username}`);
              }
            } catch (innerError) {
              console.error(`[NextAuth] Failed to fetch via githubClient:`, innerError);
            }
          }
        }
      } catch (error) {
        console.error('[NextAuth] Failed to update GitHub stats during sign-in:', error);
        // 통계 업데이트 실패해도 로그인은 성공시켜야 함
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          ...user,
        };
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token as any;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
