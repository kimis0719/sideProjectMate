import ReviewManageTable from '@/components/admin/ReviewManageTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '리뷰 관리' };

export default function AdminReviewsPage() {
  return (
    <div className="p-8">
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">리뷰 관리</h2>
      <p className="font-body text-body-md text-on-surface-variant mb-6">
        사용자 간 리뷰를 모니터링하고 부적절한 리뷰를 관리합니다.
      </p>
      <ReviewManageTable />
    </div>
  );
}
