import { NextAuthOptions } from 'next-auth';
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
      }
    })
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
            try {
              const { updateUserGithubStats } = await import('@/lib/github/service');
              await updateUserGithubStats(dbUser._id.toString(), dbUser.socialLinks.github);
            } catch (serviceError) {
              console.error('[NextAuth] GitHub Stats Service Error:', serviceError);
            }
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

    async jwt({ token, user, account }) {
      // ── OAuth 첫 로그인: DB에서 _id·memberType 가져와 토큰에 주입
      if (account?.type === 'oauth') {
        await dbConnect();
        const dbUser = await User.findOne({ authorEmail: token.email?.toLowerCase() });
        if (dbUser) {
          return {
            ...token,
            _id: dbUser._id.toString(),
            memberType: dbUser.memberType,
            name: dbUser.nName || token.name,
            image: dbUser.avatarUrl || token.picture,
          };
        }
        return token;
      }

      // ── Credentials 로그인 (기존 로직)
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
