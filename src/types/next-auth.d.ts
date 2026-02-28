import 'next-auth';

declare module 'next-auth' {
  /**
   * `session` 콜백에서 반환되며, `useSession` 또는 `getServerSession`에서 사용됩니다.
   */
  interface Session {
    user?: {
      _id?: string | null;
      memberType?: 'user' | 'admin';
    } & DefaultSession['user'];
  }

  /**
   * `jwt` 콜백의 `user` 파라미터 타입입니다.
   */
  interface User {
    _id?: string;
    memberType?: 'user' | 'admin';
  }
}
