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
      // 로그인 시 GitHub 통계 업데이트 (비동기 시도)
      try {
        if (!user.email) return true;

        await dbConnect();
        // user.email은 NextAuth User 객체의 email
        // 실제 DB User 모델과 매칭 (provider: Credentials이므로 이미 DB에 존재)
        // 하지만 여기서 한번 더 조회하여 업데이트 수행
        const dbUser = await User.findOne({ authorEmail: user.email });

        if (dbUser) {
          // GitHub 통계 업데이트 (Service 사용)
          if (dbUser.socialLinks?.github) {
            try {
              const { updateUserGithubStats } = await import('@/lib/github/service');
              await updateUserGithubStats(dbUser._id.toString(), dbUser.socialLinks.github);
            } catch (serviceError) {
              console.error('[NextAuth] GitHub Stats Service Error:', serviceError);
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
