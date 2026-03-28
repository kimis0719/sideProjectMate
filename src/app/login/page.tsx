'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    authorEmail: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        authorEmail: formData.authorEmail,
        password: formData.password,
      });

      if (result?.ok) {
        router.push('/');
      } else {
        setError(result?.error || '이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setIsSocialLoading(provider);
    setError('');
    try {
      // 로그인 성공 후 /profile로 이동 → OnboardingWizard 자동 트리거
      await signIn(provider, { callbackUrl: '/profile' });
    } catch {
      setError('소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── 좌측: 브랜드 패널 (md 이상에서 표시) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary via-brand to-indigo-800 relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        {/* 배경 장식 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-sm">
          {/* 로고 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
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
            <span className="text-2xl font-bold">Side Project Mate</span>
          </div>

          <h1 className="text-3xl font-bold mb-4 leading-snug">
            함께 만드는
            <br />
            즐거운 사이드 프로젝트
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            디자이너, 기획자, 개발자가 모여
            <br />
            아이디어를 현실로 만들어가는 공간
          </p>

          {/* 특징 아이콘 */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: '🤝', label: '팀 매칭' },
              { icon: '📋', label: '칸반 보드' },
              { icon: '📊', label: 'WBS 관리' },
            ].map((feat) => (
              <div key={feat.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{feat.icon}</span>
                <span className="text-xs text-white/70">{feat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 우측: 로그인 폼 */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm">
          {/* 모바일용 로고 */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-foreground"
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
            <span className="font-bold text-foreground">Side Project Mate</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">로그인</h2>
          <p className="text-sm text-muted-foreground mb-8">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              회원가입
            </Link>
          </p>

          {/* ── 소셜 로그인 버튼 */}
          <div className="space-y-3 mb-6">
            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={isSocialLoading !== null || isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#24292e] text-white text-sm font-medium hover:bg-[#1a1e22] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSocialLoading === 'github' ? (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
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
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              )}
              GitHub로 계속하기
            </button>

            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={isSocialLoading !== null || isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-background border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSocialLoading === 'google' ? (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
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
              Google로 계속하기
            </button>
          </div>

          {/* ── 구분선 */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">또는 이메일로 로그인</span>
            </div>
          </div>

          {/* ── 이메일/비밀번호 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label htmlFor="authorEmail" className="form-label">
                이메일
              </label>
              <input
                id="authorEmail"
                name="authorEmail"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="name@example.com"
                value={formData.authorEmail}
                onChange={handleChange}
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="form-label">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pr-10"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading || isSocialLoading !== null}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {isLoading ? (
                <>
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
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
