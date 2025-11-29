'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [emailError, setEmailError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  // 컴포넌트 마운트 시 랜덤 닉네임 생성
  useEffect(() => {
    const initializeRandomNickname = async () => {
      try {
        const randomNick = await generateRandomNickname();
        setFormData(prev => ({ ...prev, nName: randomNick }));
      } catch (error) {
        console.error('초기 닉네임 생성 실패:', error);
      }
    };

    initializeRandomNickname();
  }, []);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'위험' | '보통' | '안전' | ''>('');
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // 이메일 유효성 검사: 간단한 정규식 사용
  useEffect(() => {
    const email = formData.authorEmail.trim();
    if (!email) {
      setEmailError('');
      setIsEmailValid(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      setEmailError('');
      setIsEmailValid(true);
    } else {
      setEmailError('유효한 이메일 형식이 아닙니다. 예: user@example.com');
      setIsEmailValid(false);
    }
  }, [formData.authorEmail]);

  // 비밀번호 복잡성 검사: 최소 길이 및 문자 종류(소문자, 대문자, 숫자, 특수문자) 중 최소 3개 포함
  useEffect(() => {
    const pw = formData.password || '';
    const minLength = 8; // 가정: 최소 8자

    if (!pw) {
      setPasswordError('');
      setIsPasswordValid(false);
      return;
    }

    const checks = [/[a-z]/.test(pw), /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)];
    const passed = checks.filter(Boolean).length;

    if (pw.length < minLength) {
      setPasswordError(`비밀번호는 최소 ${minLength}자 이상이어야 합니다.`);
      setIsPasswordValid(false);
      return;
    }

    if (passed < 3) {
      setPasswordError('비밀번호는 소문자, 대문자, 숫자, 특수문자 중 최소 3가지를 포함해야 합니다.');
      setIsPasswordValid(false);
      return;
    }

    setPasswordError('');
    setIsPasswordValid(true);
    // 비밀번호 강도 계산 (기존에 계산한 `passed` 재사용)
    if (!pw) {
      setPasswordStrength('');
    } else if (passed <= 2 || pw.length < minLength) {
      setPasswordStrength('위험');
    } else if (passed === 3) {
      setPasswordStrength('보통');
    } else {
      setPasswordStrength('안전');
    }
  }, [formData.password]);

  // 휴대폰 번호 검증 (선택사항): 비어있으면 유효, 입력 시 숫자 길이 기준으로 간단 검사
  useEffect(() => {
    const raw = formData.mblNo || '';
    // 한국 휴대폰 번호 검증 (국제전화번호, 핸드폰번호, (지역번호포함)일반전화번호)
    const phoneRegex = /^(?:\+?82-?|0)(?:10|(?:2|3[1-3]|4[1-4]|5[1-5]|6[1-4]))-?\d{3,4}-?\d{4}$/;

    if (!raw) {
      setPhoneError('');
      setIsPhoneValid(false);
      return;
    }

    if (phoneRegex.test(raw)) {
      setPhoneError('');
      setIsPhoneValid(true);
    } else {
      setPhoneError('휴대폰 번호는 국제전화번호, 핸드폰번호, (지역번호포함)일반전화번호를 입력해주세요.');
      setIsPhoneValid(false);
    }
  }, [formData.mblNo]);

  // 랜덤 닉네임 생성기 (외부 API 사용)
  const generateRandomNickname = async () => {
    try {
      const response = await fetch('https://www.rivestsoft.com/nickname/getRandomNickname.ajax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lang: 'ko' }),
      });

      if (!response.ok) {
        throw new Error('네트워크 응답이 정상이 아닙니다');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('랜덤 닉네임 생성 실패:', error);
      // API 호출 실패시 폴백으로 기본 랜덤 닉네임 생성
      const prefix = 'user';
      const rand = Math.random().toString(36).substring(2, 8);
      const ts = Date.now().toString().slice(-4);
      return `${prefix}_${rand}${ts}`.substring(0, 32);
    }
  };

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

    // 비밀번호 유효성 재검증 (안전장치)
    if (!isPasswordValid) {
      setError('유효한 비밀번호를 입력하세요. 요구사항을 확인하세요.');
      setIsLoading(false);
      return;
    }

    // 이메일 유효성 재검증 (안전장치)
    if (!isEmailValid) {
      setError('유효한 이메일을 입력하세요.');
      setIsLoading(false);
      return;
    }

    // 휴대폰이 입력되어있다면 유효성 체크
    if (formData.mblNo && !isPhoneValid) {
      setError('휴대폰 번호 형식이 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      // 닉네임이 비어있다면 랜덤 생성하여 전송
      const nNameToSend = formData.nName && formData.nName.trim()
        ? formData.nName.trim()
        : await generateRandomNickname();

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorEmail: formData.authorEmail,
          password: formData.password,
          nName: nNameToSend,
          mblNo: formData.mblNo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 닉네임이 자동 생성되었을 경우 폼에도 반영해 사용자에게 보여줌
        if (!formData.nName || !formData.nName.trim()) {
          setFormData((prev) => ({ ...prev, nName: nNameToSend }));
        }
        setSuccess('회원가입이 성공적으로 완료되었습니다. 로그인 페이지로 이동합니다...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              로그인
            </a>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded">
              {success}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="authorEmail" className="sr-only">
                이메일
              </label>
              <input
                id="authorEmail"
                name="authorEmail"
                type="email"
                autoComplete="email"
                required
                aria-invalid={!isEmailValid && !!formData.authorEmail}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${!isEmailValid && formData.authorEmail ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                placeholder="이메일"
                value={formData.authorEmail}
                onChange={handleChange}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="nName" className="sr-only">
                닉네임
              </label>
              <input
                id="nName"
                name="nName"
                type="text"
                autoComplete="name"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="닉네임 (선택)"
                maxLength={32}
                value={formData.nName}
                onChange={handleChange}
              />
              <div className="mt-1 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{formData.nName.length}/32</span>
                {!formData.nName && (
                  <span className="italic">입력하지 않으면 랜덤 닉네임이 생성됩니다.</span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="mblNo" className="sr-only">
                휴대폰 번호
              </label>
              <input
                id="mblNo"
                name="mblNo"
                type="tel"
                autoComplete="tel"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="휴대폰 번호 (선택)"
                value={formData.mblNo}
                onChange={handleChange}
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {phoneError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={!isPasswordValid && !!formData.password}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${!isPasswordValid && formData.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-700'
                  }`}
                placeholder="비밀번호 (최소 8자, 4종 중 3종 포함 권장)"
                value={formData.password}
                onChange={handleChange}
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {passwordError}
                </p>
              )}
              {/* 비밀번호 강도 표시 */}
              {passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호 강도:</span>
                    <span
                      className={`text-sm font-semibold ${passwordStrength === '위험' ? 'text-red-600 dark:text-red-400' : passwordStrength === '보통' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                        }`}
                    >
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="mt-1 flex space-x-1">
                    <span className={`h-1 flex-1 rounded ${passwordStrength === '위험' ? 'bg-red-600' : passwordStrength === '보통' ? 'bg-yellow-400' : 'bg-green-500'} ${passwordStrength === '보통' ? 'opacity-80' : ''}`} />
                    <span className={`h-1 flex-1 rounded ${passwordStrength === '보통' ? (passwordStrength === '보통' ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-600') : passwordStrength === '안전' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                    <span className={`h-1 flex-1 rounded ${passwordStrength === '안전' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isEmailValid || !isPasswordValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? '회원가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

