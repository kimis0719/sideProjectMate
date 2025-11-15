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
        password: {  label: "Password", type: "password" }
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
