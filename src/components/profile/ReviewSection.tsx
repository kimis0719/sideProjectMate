'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Reviewer {
  _id: string;
  nName: string;
  avatarUrl?: string;
  position?: string;
}

interface ReviewData {
  _id: string;
  reviewerId: Reviewer;
  projectId: { title: string; pid: number };
  rating: number;
  tags: string[];
  comment?: string;
  createdAt: string;
}

interface ReviewSectionProps {
  userId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`material-symbols-outlined text-sm ${star <= rating ? 'text-tertiary' : 'text-surface-container-high'}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  const reviewer = review.reviewerId;
  const date = new Date(review.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-surface-container-low rounded-xl p-5 space-y-3">
      {/* 별점 + 프로젝트 이름 */}
      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} />
        {review.projectId && (
          <span className="text-[10px] text-on-surface-variant font-medium truncate max-w-[140px]">
            {review.projectId.title}
          </span>
        )}
      </div>

      {/* 태그 */}
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 코멘트 */}
      {review.comment && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{review.comment}</p>
      )}

      {/* 리뷰어 정보 */}
      <div className="flex items-center gap-3 pt-2">
        {reviewer?.avatarUrl ? (
          <Image
            src={reviewer.avatarUrl}
            alt={reviewer.nName}
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center">
            <span className="text-xs text-on-surface-variant font-bold">
              {reviewer?.nName?.charAt(0) ?? '?'}
            </span>
          </div>
        )}
        <div>
          <span className="text-xs font-bold text-on-surface">
            {reviewer?.nName ?? '알 수 없음'}
          </span>
          {reviewer?.position && (
            <span className="text-[10px] text-on-surface-variant ml-1">· {reviewer.position}</span>
          )}
        </div>
        <span className="text-[10px] text-on-surface-variant ml-auto">{date}</span>
      </div>
    </div>
  );
}

export default function ReviewSection({ userId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/reviews?revieweeId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReviews(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  // 평균 별점 계산
  const avgRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 lg:p-10 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-bold font-headline text-on-surface">받은 리뷰</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <StarRating rating={Math.round(avgRating)} />
            <span className="font-bold text-on-surface">{avgRating.toFixed(1)}</span>
            <span>({reviews.length}개)</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-on-surface-variant/50 text-sm bg-surface-container-low rounded-xl">
          아직 받은 리뷰가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}
