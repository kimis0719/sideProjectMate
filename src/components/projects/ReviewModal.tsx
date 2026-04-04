'use client';

import { useState } from 'react';
import Image from 'next/image';
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
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-on-background/20 backdrop-blur-md" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.1)] overflow-hidden flex flex-col max-h-[90vh] mx-4">
        {/* 헤더 */}
        <div className="px-6 py-5 flex justify-between items-center">
          <h2 className="text-on-surface font-headline font-bold text-lg tracking-tight">
            팀원 리뷰 작성
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-xl transition-colors"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="overflow-y-auto">
          {/* 프로필 */}
          <div className="px-8 py-6 flex flex-col items-center border-b border-surface-container-low">
            <div className="relative mb-3">
              {reviewee.avatarUrl ? (
                <Image
                  src={reviewee.avatarUrl}
                  alt={reviewee.nName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover shadow-sm"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-bold text-primary-container">
                    {reviewee.nName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-on-surface font-headline font-bold text-xl tracking-tight">
              {reviewee.nName}
            </h3>
            {reviewee.position && (
              <p className="text-on-surface-variant text-xs opacity-60">{reviewee.position}</p>
            )}
          </div>

          {/* 리뷰 폼 */}
          <div className="p-8 space-y-8">
            {/* 별점 */}
            <section className="space-y-3">
              <label className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider flex items-center gap-1">
                별점 <span className="text-primary-container">*</span>
              </label>
              <div className="flex gap-2">
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
                    <span
                      className={`material-symbols-outlined text-3xl cursor-pointer ${
                        star <= displayRating
                          ? 'text-primary-container'
                          : 'text-outline-variant hover:text-primary-container'
                      }`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-on-surface-variant self-center">
                    {['', '별로예요', '아쉬워요', '보통이에요', '좋아요', '최고예요'][rating]}
                  </span>
                )}
              </div>
            </section>

            {/* 태그 선택 */}
            <section className="space-y-4">
              <label className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">
                태그 선택 (복수 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {REVIEW_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-container text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            {/* 코멘트 */}
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-on-surface-variant text-sm font-semibold uppercase tracking-wider">
                  코멘트 (선택)
                </label>
                <span className="text-[10px] text-outline tracking-widest">
                  {comment.length}/200
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={200}
                rows={4}
                placeholder="팀원에 대한 솔직한 리뷰를 남겨주세요..."
                className="w-full h-32 p-4 bg-surface-container-low border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary-container/20 placeholder:text-outline-variant resize-none transition-all"
              />
            </section>

            {/* 공개 여부 */}
            <div className="flex justify-end items-center gap-3">
              <span className="text-on-surface-variant text-xs font-semibold uppercase">
                공개 리뷰
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
              </label>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-8 py-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-headline font-bold text-primary-container bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-[2] py-3 text-sm font-headline font-bold text-on-primary bg-primary-container rounded-xl hover:bg-primary transition-all shadow-lg shadow-primary-container/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
