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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-card rounded-xl w-full max-w-lg border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 프로젝트 컨텍스트 */}
        <div className="bg-muted/50 p-5 rounded-t-xl border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-2">{project.title}</h2>
          {project.problemStatement && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {project.problemStatement}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {project.weeklyHours && (
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                주 {project.weeklyHours}h
              </span>
            )}
            {project.lookingFor?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 지원 폼 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* motivation */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              지원 동기 <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="이 프로젝트에 참여하고 싶은 이유를 알려주세요. (최소 20자)"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <span
                className={`text-xs ${motivation.trim().length < 20 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {motivation.trim().length < 20
                  ? `${20 - motivation.trim().length}자 더 입력해주세요`
                  : '충분합니다!'}
              </span>
              <span className="text-xs text-muted-foreground">{motivation.length}/500</span>
            </div>
          </div>

          {/* weeklyHours */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              주당 투자 가능 시간 <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {HOURS_OPTIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setWeeklyHours(h)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    weeklyHours === h
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {h}h{h === 30 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* message (optional) */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">
              추가 메시지 <span className="text-xs text-muted-foreground font-normal">(선택)</span>
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="프로젝트 리더에게 전달하고 싶은 말이 있다면 남겨주세요."
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={500}
            />
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-6 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '제출 중...' : '지원서 제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
