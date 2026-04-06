'use client';

import { useEffect, useState, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';

interface ReviewItem {
  _id: string;
  reviewerId: { _id: string; nName?: string; authorEmail: string } | null;
  revieweeId: { _id: string; nName?: string; authorEmail: string } | null;
  projectId: { _id: string; title: string; pid: number } | null;
  rating: number;
  tags: string[];
  comment?: string;
  isPublic: boolean;
  createdAt: string;
}

interface ReviewStats {
  total: number;
  avgRating: number;
  publicCount: number;
  privateCount: number;
}

const VISIBILITY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'true', label: '공개' },
  { key: 'false', label: '비공개' },
];

const LIMIT = 20;

export default function ReviewManageTable() {
  const { confirm, alert } = useModal();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    avgRating: 0,
    publicCount: 0,
    privateCount: 0,
  });
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-on-surface-variant/50">
      {sortField === field ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        search,
      });
      if (visibilityFilter !== 'all') params.set('isPublic', visibilityFilter);

      const res = await fetch(`/api/admin/reviews?${params}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.data.reviews);
        setTotalPages(json.data.pagination.totalPages);
        setTotal(json.data.pagination.total);
        setStats(json.data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [page, visibilityFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    setSearch(inputValue);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm(
      '리뷰 삭제',
      '이 리뷰를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      {
        confirmText: '삭제',
        isDestructive: true,
      }
    );
    if (!ok) return;

    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      fetchData();
    } else {
      await alert('오류', json.message);
    }
  };

  const renderStars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <div className="space-y-4">
      {/* 통계 요약 */}
      <div className="flex gap-4">
        <div className="bg-surface-container-lowest rounded-lg px-4 py-3">
          <p className="font-body text-label-md text-on-surface-variant">전체</p>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.total}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg px-4 py-3">
          <p className="font-body text-label-md text-on-surface-variant">평균 평점</p>
          <p className="font-headline text-xl font-bold text-amber-600">⭐ {stats.avgRating}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg px-4 py-3">
          <p className="font-body text-label-md text-on-surface-variant">공개</p>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.publicCount}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-lg px-4 py-3">
          <p className="font-body text-label-md text-on-surface-variant">비공개</p>
          <p className="font-headline text-xl font-bold text-on-surface">{stats.privateCount}</p>
        </div>
      </div>

      {/* 필터 + 검색 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {VISIBILITY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setPage(1);
                setVisibilityFilter(key);
              }}
              className={`px-4 py-2 rounded-lg font-body text-body-md transition-colors ${
                visibilityFilter === key
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <input
            className="bg-surface-container-lowest text-on-surface rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary font-body text-body-md w-56"
            placeholder="작성자, 대상자, 프로젝트명"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-body text-body-md"
          >
            검색
          </button>
        </div>
      </div>

      {/* 범위 */}
      <p className="font-body text-label-md text-on-surface-variant">
        총 {total}건{search && ` (검색: "${search}")`}
      </p>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                작성자
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                대상자
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                프로젝트
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('rating')}
              >
                평점
                <SortIcon field="rating" />
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                공개
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                작성일
                <SortIcon field="createdAt" />
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/15">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-on-surface-variant font-body text-body-md"
                >
                  불러오는 중...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-on-surface-variant font-body text-body-md"
                >
                  리뷰가 없습니다.
                </td>
              </tr>
            ) : (
              [...reviews]
                .sort((a, b) => {
                  const mul = sortOrder === 'asc' ? 1 : -1;
                  if (sortField === 'rating') return (a.rating - b.rating) * mul;
                  if (sortField === 'createdAt')
                    return (
                      (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mul
                    );
                  return 0;
                })
                .map((review) => (
                  <tr
                    key={review._id}
                    className="hover:bg-surface-bright transition-colors cursor-pointer"
                    onClick={() => setSelectedReview(review)}
                  >
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      {review.reviewerId?.nName || '(알 수 없음)'}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      {review.revieweeId?.nName || '(알 수 없음)'}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      {review.projectId?.title || '(삭제됨)'}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-amber-600">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${
                          review.isPublic
                            ? 'text-primary bg-primary/5'
                            : 'text-on-surface-variant bg-surface-container-high'
                        }`}
                      >
                        {review.isPublic ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-label-md text-on-surface-variant">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(review._id);
                        }}
                        className="font-body text-label-md text-error hover:text-error/80 transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <span className="px-3 py-1.5 font-body text-body-md text-on-surface">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onDelete={() => {
            setSelectedReview(null);
            fetchData();
          }}
          renderStars={renderStars}
        />
      )}
    </div>
  );
}

function ReviewDetailModal({
  review,
  onClose,
  onDelete,
  renderStars,
}: {
  review: ReviewItem;
  onClose: () => void;
  onDelete: () => void;
  renderStars: (r: number) => string;
}) {
  const { confirm, alert } = useModal();

  const handleDelete = async () => {
    const ok = await confirm('리뷰 삭제', '이 리뷰를 삭제하시겠습니까?', {
      confirmText: '삭제',
      isDestructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/reviews/${review._id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      onDelete();
    } else {
      await alert('오류', json.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-[16px] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest rounded-lg shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="font-body text-body-md font-semibold text-on-surface">리뷰 상세</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 평점 */}
          <div className="text-center">
            <p className="text-3xl text-amber-500 mb-1">{renderStars(review.rating)}</p>
            <p className="font-body text-body-md text-on-surface-variant">
              {review.rating}점 / 5점
            </p>
          </div>

          {/* 공개 상태 */}
          <div className="flex justify-center">
            <span
              className={`inline-flex px-3 py-1 rounded-full font-body text-label-md font-medium ${
                review.isPublic
                  ? 'text-primary bg-primary/5'
                  : 'text-on-surface-variant bg-surface-container-high'
              }`}
            >
              {review.isPublic ? '공개 리뷰' : '비공개 리뷰'}
            </span>
          </div>

          {/* 작성자 / 대상자 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="font-body text-label-md text-on-surface-variant mb-1">작성자</p>
              <p className="font-body text-body-md text-on-surface font-medium">
                {review.reviewerId?.nName || '(알 수 없음)'}
              </p>
              <p className="font-body text-label-md text-on-surface-variant">
                {review.reviewerId?.authorEmail || ''}
              </p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <p className="font-body text-label-md text-on-surface-variant mb-1">대상자</p>
              <p className="font-body text-body-md text-on-surface font-medium">
                {review.revieweeId?.nName || '(알 수 없음)'}
              </p>
              <p className="font-body text-label-md text-on-surface-variant">
                {review.revieweeId?.authorEmail || ''}
              </p>
            </div>
          </div>

          {/* 프로젝트 */}
          <div>
            <p className="font-body text-label-md text-on-surface-variant mb-1">프로젝트</p>
            {review.projectId ? (
              <a
                href={`/projects/${review.projectId.pid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-body-md text-primary hover:underline"
              >
                {review.projectId.title} #{review.projectId.pid}
              </a>
            ) : (
              <p className="font-body text-body-md text-on-surface-variant">(삭제된 프로젝트)</p>
            )}
          </div>

          {/* 태그 */}
          {review.tags.length > 0 && (
            <div>
              <p className="font-body text-label-md text-on-surface-variant mb-2">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-surface-container-low text-on-surface rounded-full px-3 py-1 font-body text-label-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 코멘트 */}
          {review.comment && (
            <div>
              <p className="font-body text-label-md text-on-surface-variant mb-1">코멘트</p>
              <p className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                {review.comment}
              </p>
            </div>
          )}

          {/* 작성일 */}
          <p className="font-body text-label-md text-on-surface-variant">
            작성일: {new Date(review.createdAt).toLocaleString('ko-KR')}
          </p>
        </div>

        {/* 푸터 */}
        <div className="flex justify-between px-6 py-4 border-t border-outline-variant/15 bg-surface-container-low">
          <button
            onClick={handleDelete}
            className="px-4 py-2 font-body text-body-md bg-error text-on-error rounded-lg hover:bg-error/90 transition-colors"
          >
            리뷰 삭제
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 font-body text-body-md bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-high/70 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
