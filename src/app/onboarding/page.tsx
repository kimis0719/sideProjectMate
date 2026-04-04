'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CommunicationStyleSlider from '@/components/profile/CommunicationStyleSlider';
import AvailabilityScheduler from '@/components/profile/AvailabilityScheduler';

interface CommonCodeItem {
  code: string;
  label: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: 도메인
  const [domains, setDomains] = useState<string[]>([]);
  const [domainSuggestions, setDomainSuggestions] = useState<CommonCodeItem[]>([]);

  // Step 2: 협업 스타일
  const [preference, setPreference] = useState(50);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);

  // Step 3: 가용 시간
  const [schedule, setSchedule] = useState<
    { day: string; timeRanges: { start: string; end: string }[] }[]
  >([]);

  // 이미 온보딩 완료한 유저면 redirect
  useEffect(() => {
    if (session?.user?.onboardingStep && session.user.onboardingStep >= 4) {
      router.replace('/projects');
    }
  }, [session, router]);

  // CommonCode 로드
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await fetch('/api/common-codes?group=DOMAIN');
        const data = await res.json();
        if (data.success) setDomainSuggestions(data.data);
      } catch (e) {
        console.error('도메인 코드 로딩 실패', e);
      }
    };
    fetchDomains();
  }, []);

  const toggleDomain = (label: string) => {
    setDomains((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const saveStep = async (stepNum: number, data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepNum, data }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      if (stepNum === 3) {
        await fetch('/api/users/me/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedule }),
        });
      }

      return result.data.onboardingStep;
    } catch (e) {
      console.error('온보딩 저장 실패', e);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      await saveStep(1, { domains });
      setStep(2);
    } else if (step === 2) {
      await saveStep(2, { preference, personalityTags });
      setStep(3);
    }
  };

  const handleComplete = async () => {
    const newStep = await saveStep(3, {});
    if (newStep !== null) {
      await updateSession({ onboardingStep: 4 });
      window.location.href = '/projects';
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/onboarding', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        await updateSession({ onboardingStep: 4 });
        window.location.href = '/projects';
      }
    } catch (e) {
      console.error('온보딩 건너뛰기 실패', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="antialiased min-h-screen bg-surface">
      {/* 헤더 + 프로그레스 */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
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
              <span className="text-xl font-bold tracking-tight text-on-surface font-headline">
                Side Project Mate
              </span>
            </div>
            <span className="text-sm font-semibold text-outline uppercase tracking-wider">
              3단계 중 {step}단계
            </span>
          </div>
          <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="min-h-screen pt-32 pb-24 px-8 max-w-5xl mx-auto flex items-center justify-center">
        {/* Step 1: 관심 도메인 */}
        {step === 1 && (
          <section className="w-full max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
              <div className="md:col-span-5">
                <h1 className="text-4xl md:text-5xl font-bold font-headline leading-tight tracking-tight text-on-surface mb-6">
                  당신의 <span className="text-primary-container">관심사</span>는 무엇인가요?
                </h1>
                <p className="text-lg text-on-surface-variant leading-relaxed">
                  선택하신 관심 분야를 바탕으로 열정과 커리어 성장에 딱 맞는 프로젝트를 매칭해
                  드립니다.
                </p>
                <div className="mt-12 flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <p className="text-sm font-medium text-on-surface-variant italic whitespace-nowrap">
                    현재 기술 트렌드를 기반으로 추천된 항목입니다.
                  </p>
                </div>
              </div>

              <div className="md:col-span-7">
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(26,28,28,0.04)]">
                  <div className="flex flex-wrap gap-3">
                    {domainSuggestions.map((d) => {
                      const isSelected = domains.includes(d.label);
                      return (
                        <button
                          key={d.code}
                          type="button"
                          onClick={() => toggleDomain(d.label)}
                          className={`px-6 py-3 rounded-full text-sm font-medium border-2 transition-all ${
                            isSelected
                              ? 'bg-primary-container text-on-primary font-semibold border-primary-container'
                              : 'bg-surface-container-low text-on-surface-variant border-transparent hover:border-primary-container'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: 협업 스타일 */}
        {step === 2 && (
          <section className="w-full max-w-4xl">
            <div className="flex flex-col items-center text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-on-surface mb-4">
                어떻게 일하시나요?
              </h1>
              <p className="text-lg text-on-surface-variant max-w-xl">
                당신의 협업 리듬을 정의해 주세요. 업무 방식이 잘 맞는 팀과 매칭해 드립니다.
              </p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(26,28,28,0.04)]">
              <CommunicationStyleSlider
                preference={preference}
                onChangePreference={setPreference}
                tags={personalityTags}
                onChangeTags={setPersonalityTags}
              />
            </div>
          </section>
        )}

        {/* Step 3: 가용 시간 */}
        {step === 3 && (
          <section className="w-full max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-4">
                <h1 className="text-4xl font-bold font-headline tracking-tight text-on-surface mb-4">
                  당신의 <span className="text-primary-container">템포</span>를 설정하세요.
                </h1>
                <p className="text-on-surface-variant mb-8">
                  사이드 프로젝트에 할애할 수 있는 시간을 선택해 주세요. 대부분 주당 5-10시간을
                  권장합니다.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant/15 bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface">총 참여 시간</p>
                      <p className="text-xs text-outline">
                        주{' '}
                        {schedule.reduce(
                          (acc, d) =>
                            acc +
                            d.timeRanges.reduce((sum, r) => {
                              const s = parseInt(r.start.split(':')[0]);
                              const e = parseInt(r.end.split(':')[0]) || 24;
                              return sum + (e - s);
                            }, 0),
                          0
                        )}
                        시간
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_20px_40px_rgba(26,28,28,0.04)]">
                  <AvailabilityScheduler initialSchedule={schedule} onChange={setSchedule} />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <footer className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-outline-variant/10 z-50">
        <div className="max-w-5xl mx-auto px-8 py-6 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-8 py-3.5 text-on-surface-variant hover:bg-surface-container-low rounded-xl font-medium transition-colors"
            >
              이전
            </button>
          ) : (
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-3.5 text-on-surface-variant hover:text-on-surface font-medium text-sm underline transition-colors"
            >
              다음에 하기
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-primary-container text-on-primary rounded-xl font-bold hover:shadow-md hover:translate-y-[-1px] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '다음'}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 hover:shadow-md hover:translate-y-[-1px] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '완료 및 시작하기'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
