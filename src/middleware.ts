import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ONBOARDING_BYPASS = [
  '/onboarding',
  '/api/',
  '/login',
  '/register',
  '/admin',
  '/_next/',
  '/favicon.ico',
  '/images/',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 예외 경로는 온보딩 체크 안 함
  if (ONBOARDING_BYPASS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // 미로그인 사용자는 통과 (next-auth가 별도로 처리)
  if (!token) {
    return NextResponse.next();
  }

  // 온보딩 미완료 시 redirect
  // onboardingStep이 명시적으로 숫자인 경우만 체크 (기존 세션에 없으면 통과)
  const onboardingStep = token.onboardingStep;
  if (typeof onboardingStep === 'number' && onboardingStep < 4) {
    const onboardingUrl = new URL('/onboarding', request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|api/socket/).*)'],
};
