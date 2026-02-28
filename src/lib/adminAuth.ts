import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * API Route에서 관리자 권한을 검사합니다.
 * - 비로그인: 401
 * - 비관리자: 403
 * - 관리자: session 반환
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return {
      error: NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      ),
    };
  }

  if (session.user.memberType !== 'admin') {
    return {
      error: NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 }
      ),
    };
  }

  return { session };
}
