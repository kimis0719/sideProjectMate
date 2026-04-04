'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

const isTestEnv =
  process.env.NEXT_PUBLIC_APP_ENV === 'local' || process.env.NEXT_PUBLIC_APP_ENV === 'test';

export default function RegisterPage() {
  const [isSocialLoading, setIsSocialLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  // 테스트 회원가입 상태
  const [testId, setTestId] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState('');

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setIsSocialLoading(provider);
    setError('');
    try {
      await signIn(provider, { callbackUrl: '/profile' });
    } catch {
      setError('소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setIsSocialLoading(null);
    }
  };

  const handleTestRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testId.trim()) return;
    setIsTestLoading(true);
    setError('');
    setTestSuccess('');

    try {
      const email = `${testId.trim()}@test.com`;
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: email,
          password: '1234',
          nName: testId.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTestSuccess('테스트 계정이 생성되었습니다. 로그인 페이지로 이동합니다...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || '테스트 계정 생성에 실패했습니다.');
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* 좌측: 브랜딩 */}
      <section className="hidden lg:flex flex-col justify-between p-16 bg-[linear-gradient(135deg,#004ac6_0%,#2563eb_100%)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-container/20 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-headline font-bold text-xl tracking-tight text-white">
              Side Project Mate
            </span>
          </div>
          <h1 className="font-headline text-4xl font-bold leading-tight text-white mb-6">
            아이디어를
            <br />
            실현으로 바꾸는 공간.
          </h1>
          <p className="font-body text-lg text-white/80 max-w-md">
            함께할 팀원을 찾고 AI 기반 로드맵으로 프로젝트를 체계적으로 관리하세요.
          </p>
        </div>

        <div className="relative z-10 mt-auto">
          <p className="font-body text-sm font-medium text-white/90">
            수많은 메이커가 함께하고 있습니다.
          </p>
        </div>
      </section>

      {/* 우측: 회원가입 */}
      <section className="flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-surface">
        <div className="w-full max-w-md">
          {/* 모바일 로고 */}
          <div className="lg:hidden mb-12 flex justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-on-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-headline font-bold text-xl text-on-surface">SPM</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-headline font-semibold text-2xl text-on-surface mb-2">회원가입</h2>
            <p className="font-body text-on-surface-variant">
              지금 바로 크리에이터와 빌더들의 생태계에 합류하세요.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-container/40 text-on-error-container px-4 py-3 rounded-lg text-sm mb-6">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0">warning</span>
              <span>{error}</span>
            </div>
          )}
          {testSuccess && (
            <div className="flex items-start gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                check_circle
              </span>
              <span>{testSuccess}</span>
            </div>
          )}

          {/* 소셜 회원가입 */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isSocialLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-lowest rounded-lg font-medium text-on-surface hover:bg-surface-bright transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isSocialLoading === 'google' ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span className="text-sm font-semibold">Google로 시작하기</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={isSocialLoading !== null}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#24292e] rounded-lg font-medium text-white hover:bg-[#1a1e22] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isSocialLoading === 'github' ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              )}
              <span className="text-sm font-semibold">GitHub로 시작하기</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-on-surface-variant leading-relaxed">
            가입 시{' '}
            <Link
              href="/terms"
              target="_blank"
              className="text-primary font-semibold hover:underline"
            >
              이용약관
            </Link>{' '}
            및{' '}
            <Link
              href="/privacy"
              target="_blank"
              className="text-primary font-semibold hover:underline"
            >
              개인정보 처리방침
            </Link>
            에 동의하는 것으로 간주합니다.
          </p>

          {/* 테스트 회원가입 (local/test 환경에서만) */}
          {isTestEnv && (
            <>
              <div className="relative flex items-center my-8">
                <div className="flex-grow h-px bg-surface-container-high" />
                <span className="px-4 text-xs font-semibold text-outline tracking-widest uppercase">
                  테스트 전용
                </span>
                <div className="flex-grow h-px bg-surface-container-high" />
              </div>
              <form onSubmit={handleTestRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="testId"
                    className="block text-[11px] font-bold text-outline tracking-wider uppercase ml-1"
                  >
                    테스트 계정
                  </label>
                  <div className="flex items-center gap-0">
                    <input
                      id="testId"
                      type="text"
                      required
                      className="flex-1 px-5 py-3.5 bg-surface-container-low rounded-l-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-none placeholder:text-outline/50"
                      placeholder="admin"
                      value={testId}
                      onChange={(e) => setTestId(e.target.value)}
                    />
                    <span className="px-4 py-3.5 bg-surface-container-high rounded-r-lg text-on-surface-variant text-sm font-medium select-none">
                      @test.com
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isTestLoading || !testId.trim()}
                  className="w-full py-3.5 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isTestLoading ? '생성 중...' : '테스트 계정 생성'}
                </button>
              </form>
            </>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm text-on-surface-variant">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="ml-1 font-bold text-primary hover:text-surface-tint underline decoration-primary/30 underline-offset-4"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-auto pt-12 flex gap-6">
          <Link
            href="/terms"
            className="text-[10px] font-bold text-outline tracking-widest uppercase hover:text-on-surface transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="text-[10px] font-bold text-outline tracking-widest uppercase hover:text-on-surface transition-colors"
          >
            개인정보처리방침
          </Link>
        </div>
      </section>
    </main>
  );
}
