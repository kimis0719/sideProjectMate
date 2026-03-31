import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      _id?: string | null;
      memberType?: 'user' | 'admin';
      onboardingStep?: number;
    } & DefaultSession['user'];
  }

  interface User {
    _id?: string;
    memberType?: 'user' | 'admin';
    onboardingStep?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    _id?: string;
    memberType?: 'user' | 'admin';
    onboardingStep?: number;
  }
}
