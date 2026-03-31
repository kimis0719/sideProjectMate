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

      // Step 3에서 AvailabilityScheduler 데이터 별도 저장
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
      // full reload로 이동해야 middleware가 갱신된 JWT를 읽음
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-lg border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="bg-muted/30 p-6 border-b border-border text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">프로필 설정하기</h1>
          <p className="text-muted-foreground text-sm">
            맞춤 프로젝트를 추천받기 위해 간단한 정보를 입력해주세요. ({step}/3)
          </p>
          <div className="w-full h-2 bg-muted rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">어떤 분야에 관심이 있나요?</h3>
              <p className="text-sm text-muted-foreground">여러 개 선택할 수 있어요.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {domainSuggestions.map((d) => {
                  const isSelected = domains.includes(d.label);
                  return (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => toggleDomain(d.label)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-foreground">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">협업 스타일을 알려주세요</h3>
              <div className="p-4 border border-border rounded-xl bg-background">
                <CommunicationStyleSlider
                  preference={preference}
                  onChangePreference={setPreference}
                  tags={personalityTags}
                  onChangeTags={setPersonalityTags}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">언제 활동할 수 있나요?</h3>
              <p className="text-sm text-muted-foreground">
                드래그해서 가능한 시간을 선택하세요. 나중에 프로필에서 수정할 수 있어요.
              </p>
              <div className="border border-border rounded-xl p-4 bg-background max-h-[400px] overflow-y-auto">
                <AvailabilityScheduler initialSchedule={schedule} onChange={setSchedule} />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t border-border flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-2.5 text-muted-foreground hover:bg-muted rounded-lg font-medium transition-colors"
            >
              이전
            </button>
          ) : (
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-muted-foreground hover:text-foreground font-medium text-sm underline transition-colors"
            >
              다음에 하기
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '다음'}
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '완료 및 시작하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
