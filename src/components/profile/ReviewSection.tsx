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
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.372 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.95 2.878c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
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
    <div className="bg-background border border-gray-100 dark:border-gray-700 rounded-xl p-4 space-y-3">
      {/* 별점 + 프로젝트 이름 */}
      <div className="flex items-center justify-between">
        <StarRating rating={review.rating} />
        {review.projectId && (
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
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
        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
      )}

      {/* 리뷰어 정보 */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        {reviewer?.avatarUrl ? (
          <Image
            src={reviewer.avatarUrl}
            alt={reviewer.nName}
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-medium">
              {reviewer?.nName?.charAt(0) ?? '?'}
            </span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{reviewer?.nName ?? '알 수 없음'}</span>
          {reviewer?.position && <span className="ml-1">· {reviewer.position}</span>}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{date}</span>
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
    <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">⭐ 팀원 리뷰</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <StarRating rating={Math.round(avgRating)} />
            <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <span>({reviews.length}개)</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
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
