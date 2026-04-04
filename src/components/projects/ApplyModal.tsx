'use client';

import { useState } from 'react';
import { useApplicationStore } from '@/store/applicationStore';
import { useModal } from '@/hooks/useModal';

interface ApplyModalProps {
  project: {
    _id: string;
    pid: number;
    title: string;
    problemStatement?: string;
    weeklyHours?: number;
    lookingFor?: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

const HOURS_OPTIONS = [5, 10, 15, 20, 30];

export default function ApplyModal({ project, onClose, onSuccess }: ApplyModalProps) {
  const [motivation, setMotivation] = useState('');
  const [weeklyHours, setWeeklyHours] = useState<number | null>(project.weeklyHours ?? null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { alert } = useModal();

  const isMotivationValid = motivation.trim().length >= 20;
  const canSubmit = isMotivationValid && weeklyHours !== null && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${project.pid}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivation: motivation.trim(),
          weeklyHours,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        useApplicationStore.getState().addApplication(project._id, data.data?._id ?? '');
        await alert('지원 완료', '성공적으로 지원했습니다!');
        onSuccess();
      } else {
        throw new Error(data.message || '지원에 실패했습니다.');
      }
    } catch (err: unknown) {
      await alert('오류', err instanceof Error ? err.message : '지원 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-on-background/20 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.06)] overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 헤더 — 타이틀 */}
        <div className="px-8 pt-8 pb-4 bg-surface-container-lowest">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-bold tracking-tight text-on-surface">프로젝트 지원하기</h1>
            <button
              onClick={onClose}
              className="text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        {/* 헤더 — 프로젝트 정보 */}
        <div className="mx-8 mb-2 p-4 bg-surface-container-low rounded-lg space-y-3">
          <h2 className="text-lg font-bold text-primary-container">{project.title}</h2>
          <div className="flex flex-wrap gap-2">
            {project.weeklyHours && (
              <span className="px-3 py-1 bg-primary-container/15 text-primary-container text-[11px] font-bold tracking-wider rounded-full uppercase">
                주 {project.weeklyHours}h
              </span>
            )}
            {project.lookingFor?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-tertiary-fixed/40 text-on-tertiary-fixed-variant text-[11px] font-bold tracking-wider rounded-full uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
          {/* 지원 동기 */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-on-surface">
                지원 동기 <span className="text-error">*</span>
              </label>
              <span className="text-[11px] font-medium text-outline">{motivation.length}/500</span>
            </div>
            <textarea
              rows={5}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="지원 동기는 최소 20자 이상부터."
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-outline/60 resize-none transition-all"
              maxLength={500}
            />
            {motivation.trim().length > 0 && motivation.trim().length < 20 && (
              <p className="text-[12px] font-medium text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>
                {20 - motivation.trim().length}자 더 입력해주세요
              </p>
            )}
          </div>

          {/* 주당 시간 */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-on-surface">
              주당 투자 가능 시간 <span className="text-error">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {HOURS_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setWeeklyHours(h)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    weeklyHours === h
                      ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'
                  }`}
                >
                  {h}h{h === 30 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 추가 메시지 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-on-surface">추가 메시지 (선택)</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="프로젝트 리더에게 전달하고 싶은 말이 있다면 남겨주세요."
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-outline/60 resize-none transition-all"
              maxLength={500}
            />
          </div>
        </form>

        {/* 하단 버튼 */}
        <div className="px-8 py-6 bg-surface-container-low/30 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 text-on-surface-variant font-bold text-sm bg-surface-container-high rounded-lg hover:bg-surface-dim active:scale-[0.98] transition-all"
          >
            취소
          </button>
          <button
            type="button"
            onClick={(e) => {
              const form = e.currentTarget.closest('div')
                ?.previousElementSibling as HTMLFormElement;
              form?.requestSubmit();
            }}
            disabled={!canSubmit}
            className={`flex-[2] py-4 font-bold text-sm rounded-lg transition-all active:scale-[0.98] ${
              canSubmit
                ? 'bg-primary-container text-on-primary hover:shadow-md'
                : 'bg-primary/40 text-on-primary cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '제출 중...' : '지원서 제출'}
          </button>
        </div>
      </div>
    </div>
  );
}
