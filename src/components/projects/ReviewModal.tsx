'use client';

import { useState } from 'react';
import { REVIEW_TAGS } from '@/constants/review';
import { useModal } from '@/hooks/useModal';

interface Reviewee {
  _id: string;
  nName: string;
  avatarUrl?: string;
  position?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  reviewee: Reviewee;
  onSuccess: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  projectId,
  reviewee,
  onSuccess,
}: ReviewModalProps) {
  const { alert, confirm } = useModal();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      await alert('별점 필요', '별점을 선택해주세요.');
      return;
    }

    const ok = await confirm('리뷰 제출', `${reviewee.nName}님에게 리뷰를 제출하시겠습니까?`, {
      confirmText: '제출하기',
    });
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          revieweeId: reviewee._id,
          rating,
          tags: selectedTags,
          comment: comment.trim() || undefined,
          isPublic,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await alert('리뷰 완료', '리뷰가 성공적으로 등록되었습니다.');
        onSuccess();
        onClose();
      } else {
        await alert('오류', data.message || '리뷰 등록에 실패했습니다.');
      }
    } catch {
      await alert('오류', '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">팀원 리뷰 작성</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 대상자 미니 프로필 */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
          {reviewee.avatarUrl ? (
            <img
              src={reviewee.avatarUrl}
              alt={reviewee.nName}
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {reviewee.nName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground text-sm">{reviewee.nName}</p>
            {reviewee.position && (
              <p className="text-xs text-muted-foreground">{reviewee.position}</p>
            )}
          </div>
        </div>

        {/* 별점 */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            별점 <span className="text-destructive">*</span>
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
                aria-label={`별점 ${star}점`}
              >
                <svg
                  className={`w-8 h-8 transition-colors ${
                    star <= displayRating ? 'text-yellow-400' : 'text-gray-200'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.372 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.95 2.878c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground self-center">
                {['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요'][rating]}
              </span>
            )}
          </div>
        </div>

        {/* 태그 선택 */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">태그 선택 (복수 가능)</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-primary'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 코멘트 */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">코멘트 (선택)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="팀원에 대한 솔직한 리뷰를 남겨주세요..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/200</p>
        </div>

        {/* 공개 여부 */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">공개 리뷰</p>
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isPublic ? 'bg-primary' : 'bg-muted'
            }`}
            aria-checked={isPublic}
            role="switch"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isPublic ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                제출 중...
              </span>
            ) : (
              '리뷰 제출'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
