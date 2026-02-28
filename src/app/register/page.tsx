'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    authorEmail: '',
    password: '',
    confirmPassword: '',
    nName: '',
    mblNo: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isNicknameLoading, setIsNicknameLoading] = useState(false);

  // 유효성 상태
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'위험' | '보통' | '안전' | ''>('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const router = useRouter();

  // 랜덤 닉네임 생성
  const generateRandomNickname = async () => {
    try {
      const response = await fetch('https://www.rivestsoft.com/nickname/getRandomNickname.ajax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: 'ko' }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      return data.data as string;
    } catch {
      const rand = Math.random().toString(36).substring(2, 8);
      return `user_${rand}`.substring(0, 32);
    }
  };

  // 마운트 시 닉네임 자동 생성
  useEffect(() => {
    generateRandomNickname().then((nick) =>
      setFormData((prev) => ({ ...prev, nName: nick }))
    );
  }, []);

  // 닉네임 재생성 버튼
  const handleRefreshNickname = async () => {
    setIsNicknameLoading(true);
    const nick = await generateRandomNickname();
    setFormData((prev) => ({ ...prev, nName: nick }));
    setIsNicknameLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 이메일 유효성
  useEffect(() => {
    const email = formData.authorEmail.trim();
    if (!email) { setEmailError(''); setIsEmailValid(false); return; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailError(ok ? '' : '유효한 이메일 형식이 아닙니다. 예: user@example.com');
    setIsEmailValid(ok);
  }, [formData.authorEmail]);

  // 비밀번호 유효성
  useEffect(() => {
    const pw = formData.password;
    if (!pw) { setPasswordError(''); setIsPasswordValid(false); setPasswordStrength(''); return; }
    const checks = [/[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)];
    const passed = checks.filter(Boolean).length;
    if (pw.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.');
      setIsPasswordValid(false);
      setPasswordStrength('위험');
      return;
    }
    if (passed < 3) {
      setPasswordError('소문자, 대문자, 숫자, 특수문자 중 최소 3가지를 포함해야 합니다.');
      setIsPasswordValid(false);
      setPasswordStrength(passed <= 1 ? '위험' : '보통');
      return;
    }
    setPasswordError('');
    setIsPasswordValid(true);
    setPasswordStrength(passed === 4 ? '안전' : '보통');
  }, [formData.password]);

  // 전화번호 유효성
  useEffect(() => {
    const raw = formData.mblNo;
    if (!raw) { setPhoneError(''); setIsPhoneValid(false); return; }
    const ok = /^(?:\+?82-?|0)(?:10|(?:2|3[1-3]|4[1-4]|5[1-5]|6[1-4]))-?\d{3,4}-?\d{4}$/.test(raw);
    setPhoneError(ok ? '' : '올바른 전화번호 형식을 입력해주세요. 예: 010-1234-5678');
    setIsPhoneValid(ok);
  }, [formData.mblNo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }
    if (!isPasswordValid) { setError('유효한 비밀번호를 입력하세요.'); setIsLoading(false); return; }
    if (!isEmailValid) { setError('유효한 이메일을 입력하세요.'); setIsLoading(false); return; }
    if (formData.mblNo && !isPhoneValid) { setError('휴대폰 번호 형식이 올바르지 않습니다.'); setIsLoading(false); return; }

    try {
      const nNameToSend = formData.nName?.trim() || await generateRandomNickname();
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: formData.authorEmail,
          password: formData.password,
          nName: nNameToSend,
          mblNo: formData.mblNo,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 강도 색상
  const strengthColor = {
    '': 'bg-muted',
    위험: 'bg-destructive',
    보통: 'bg-yellow-400',
    안전: 'bg-green-500',
  };
  const strengthTextColor = {
    '': '',
    위험: 'text-destructive',
    보통: 'text-yellow-600 dark:text-yellow-400',
    안전: 'text-green-600 dark:text-green-400',
  };

  return (
    <div className="min-h-screen flex">
      {/* ── 좌측: 브랜드 패널 */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary via-brand to-indigo-800 relative overflow-hidden flex-col items-center justify-center p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Side Project Mate</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 leading-snug">
            당신의 아이디어를<br />팀과 함께 실현하세요
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            지금 가입하고 다양한 사이드 프로젝트의<br />팀원을 만나보세요
          </p>
        </div>
      </div>

      {/* ── 우측: 회원가입 폼 */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* 모바일 로고 */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-foreground">Side Project Mate</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">회원가입</h2>
          <p className="text-sm text-muted-foreground mb-8">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              로그인
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 에러/성공 메시지 */}
            {error && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* 1. 이메일 */}
            <div>
              <label htmlFor="authorEmail" className="form-label">이메일 <span className="text-destructive">*</span></label>
              <input
                id="authorEmail"
                name="authorEmail"
                type="email"
                autoComplete="email"
                required
                className={`form-input ${!isEmailValid && formData.authorEmail ? 'border-destructive focus:ring-destructive' : ''}`}
                placeholder="name@example.com"
                value={formData.authorEmail}
                onChange={handleChange}
              />
              {emailError && <p className="mt-1 text-xs text-destructive">{emailError}</p>}
            </div>

            {/* 2. 비밀번호 */}
            <div>
              <label htmlFor="password" className="form-label">비밀번호 <span className="text-destructive">*</span></label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`form-input pr-10 ${!isPasswordValid && formData.password ? 'border-destructive focus:ring-destructive' : ''}`}
                  placeholder="최소 8자, 3종 이상 조합"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}>
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* 비밀번호 강도 바 */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {(['위험', '보통', '안전'] as const).map((level, i) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength === '위험' && i === 0 ? strengthColor['위험'] :
                          passwordStrength === '보통' && i <= 1 ? strengthColor['보통'] :
                            passwordStrength === '안전' ? strengthColor['안전'] :
                              'bg-muted'
                        }`} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    {passwordError
                      ? <p className="text-xs text-destructive">{passwordError}</p>
                      : <span />
                    }
                    {passwordStrength && (
                      <span className={`text-xs font-semibold ml-auto ${strengthTextColor[passwordStrength]}`}>
                        {passwordStrength}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">비밀번호 확인 <span className="text-destructive">*</span></label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`form-input pr-10 ${formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-destructive focus:ring-destructive' : ''
                    }`}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 표시'}>
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {/* 4. 닉네임 */}
            <div>
              <label htmlFor="nName" className="form-label">
                닉네임 <span className="text-muted-foreground font-normal">(선택)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="nName"
                  name="nName"
                  type="text"
                  autoComplete="nickname"
                  className="form-input"
                  placeholder="닉네임을 입력하세요"
                  maxLength={32}
                  value={formData.nName}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={handleRefreshNickname}
                  disabled={isNicknameLoading}
                  className="btn-secondary px-3 shrink-0"
                  aria-label="닉네임 재생성"
                  title="랜덤 닉네임 재생성"
                >
                  <svg className={`w-4 h-4 ${isNicknameLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground text-right">
                {formData.nName.length}/32
              </p>
            </div>

            {/* 5. 전화번호 (선택) */}
            <div>
              <label htmlFor="mblNo" className="form-label">
                휴대폰 번호 <span className="text-muted-foreground font-normal">(선택)</span>
              </label>
              <input
                id="mblNo"
                name="mblNo"
                type="tel"
                autoComplete="tel"
                className={`form-input ${phoneError ? 'border-destructive focus:ring-destructive' : ''}`}
                placeholder="010-1234-5678"
                value={formData.mblNo}
                onChange={handleChange}
              />
              {phoneError && <p className="mt-1 text-xs text-destructive">{phoneError}</p>}
            </div>

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !isPasswordValid}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  가입 처리 중...
                </>
              ) : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
