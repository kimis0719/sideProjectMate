import { NextAuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // 비공개 이메일도 수집할 수 있도록 scope 명시
      authorization: { params: { scope: 'read:user user:email' } },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        authorEmail: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<'authorEmail' | 'password', string> | undefined) {
        if (!credentials) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        await dbConnect();
        const user = await User.findOne({ authorEmail: credentials.authorEmail });

        if (user && (await user.comparePassword(credentials.password))) {
          if (user.delYn === true) {
            throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
          }
          return {
            id: user._id.toString(),
            _id: user._id.toString(),
            email: user.authorEmail,
            name: user.nName,
            image: user.avatarUrl,
            memberType: user.memberType,
          };
        } else {
          throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
        }
      },
    }),
    // 테스트 전용: 비밀번호 없이 이메일만으로 로그인 (local/test 환경 전용)
    CredentialsProvider({
      id: 'test-login',
      name: 'TestLogin',
      credentials: {
        authorEmail: { label: 'Email', type: 'text' },
      },
      async authorize(credentials: Record<'authorEmail', string> | undefined) {
        const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
        if (appEnv !== 'local' && appEnv !== 'test' && process.env.NODE_ENV !== 'development') {
          throw new Error('테스트 로그인은 개발/테스트 환경에서만 사용할 수 있습니다.');
        }

        if (!credentials?.authorEmail) {
          throw new Error('이메일을 입력해주세요.');
        }

        await dbConnect();
        const user = await User.findOne({ authorEmail: credentials.authorEmail });

        if (!user) {
          throw new Error('존재하지 않는 계정입니다.');
        }
        if (user.delYn === true) {
          throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
        }

        return {
          id: user._id.toString(),
          _id: user._id.toString(),
          email: user.authorEmail,
          name: user.nName,
          image: user.avatarUrl,
          memberType: user.memberType,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // ── Credentials 로그인: GitHub 통계 업데이트 (기존 로직)
      if (account?.type === 'credentials') {
        try {
          if (!user.email) return true;

          await dbConnect();
          const dbUser = await User.findOne({ authorEmail: user.email });

          if (dbUser?.socialLinks?.github) {
            // fire-and-forget: 로그인 블로킹 제거
            import('@/lib/github/service')
              .then(({ updateUserGithubStats }) =>
                updateUserGithubStats(dbUser._id.toString(), dbUser.socialLinks.github)
              )
              .catch((serviceError) =>
                console.error('[NextAuth] GitHub Stats Service Error:', serviceError)
              );
          }
        } catch (error) {
          console.error('[NextAuth] Failed to update GitHub stats during sign-in:', error);
        }
        return true;
      }

      // ── OAuth 로그인 (GitHub, Google)
      if (account?.type === 'oauth') {
        try {
          await dbConnect();

          // 이메일이 없으면 로그인 거부 (GitHub 이메일 비공개 + scope 미취득 등)
          if (!user.email) {
            console.error('[OAuth] 이메일 정보를 가져올 수 없습니다. provider:', account.provider);
            return false;
          }

          const email = user.email.toLowerCase();
          const existingUser = await User.findOne({ authorEmail: email });

          if (!existingUser) {
            // 신규 OAuth 사용자 생성
            const Counter = (await import('@/lib/models/Counter')).default;
            const counter = await Counter.findOneAndUpdate(
              { _id: 'member_uid' },
              { $inc: { seq: 1 } },
              { new: true, upsert: true }
            );

            const newUserData: Record<string, unknown> = {
              authorEmail: email,
              password: '', // OAuth 사용자는 비밀번호 없음
              nName: user.name || `user_${counter.seq}`,
              uid: counter.seq,
              memberType: 'user',
              avatarUrl: user.image || '',
              providers: [account.provider],
            };

            // GitHub 로그인: GitHub 사용자명 자동 연동
            if (account.provider === 'github' && (profile as { login?: string })?.login) {
              newUserData.socialLinks = {
                github: (profile as { login: string }).login,
              };
            }

            await User.create(newUserData);
          } else {
            // 기존 사용자: provider 추가 (중복 방지)
            const updates: Record<string, unknown> = {
              $addToSet: { providers: account.provider },
            };

            // GitHub 로그인 시 github 아이디가 없으면 자동 세팅
            if (
              account.provider === 'github' &&
              (profile as { login?: string })?.login &&
              !existingUser.socialLinks?.github
            ) {
              updates.$set = { 'socialLinks.github': (profile as { login: string }).login };
            }

            await User.updateOne({ _id: existingUser._id }, updates);
          }

          return true;
        } catch (error) {
          console.error('[OAuth] signIn 오류:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session: updateData }) {
      // ── 세션 업데이트 요청 (onboardingStep 갱신 등)
      if (trigger === 'update' && updateData) {
        return { ...token, ...updateData };
      }

      // ── OAuth 첫 로그인: DB에서 _id·memberType·onboardingStep 가져와 토큰에 주입
      if (account?.type === 'oauth') {
        await dbConnect();
        const dbUser = (await User.findOne({ authorEmail: token.email?.toLowerCase() })
          .select('_id nName memberType avatarUrl onboardingStep')
          .lean()) as {
          _id: { toString(): string };
          nName?: string;
          memberType?: string;
          avatarUrl?: string;
          onboardingStep?: number;
        } | null;
        if (dbUser) {
          return {
            ...token,
            _id: dbUser._id.toString(),
            memberType: dbUser.memberType,
            onboardingStep: dbUser.onboardingStep ?? 0,
            name: dbUser.nName || token.name,
            image: dbUser.avatarUrl || token.picture,
          };
        }
        return token;
      }

      // ── Credentials 로그인: DB에서 onboardingStep 가져오기
      if (user) {
        await dbConnect();
        const dbUser = (await User.findOne({ _id: user._id }).select('onboardingStep').lean()) as {
          onboardingStep?: number;
        } | null;
        return {
          ...token,
          ...user,
          onboardingStep: dbUser?.onboardingStep ?? 0,
        };
      }

      // ── 기존 세션: onboardingStep이 없으면 DB에서 한 번 가져와 토큰에 주입
      if (token._id && token.onboardingStep === undefined) {
        try {
          await dbConnect();
          const dbUser = (await User.findOne({ _id: token._id })
            .select('onboardingStep')
            .lean()) as { onboardingStep?: number } | null;
          token.onboardingStep = dbUser?.onboardingStep ?? 4; // DB에도 없으면 온보딩 완료로 간주
        } catch {
          token.onboardingStep = 4; // DB 조회 실패 시 온보딩 완료로 간주 (redirect 루프 방지)
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        _id: token._id,
        memberType: token.memberType,
        onboardingStep: token.onboardingStep,
        name: token.name,
        email: token.email,
        image: token.picture,
      } as Session['user'];
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
