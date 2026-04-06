import ApplicationManageTable from '@/components/admin/ApplicationManageTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '지원서 관리' };

export default function AdminApplicationsPage() {
  return (
    <div className="p-8">
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">지원서 관리</h2>
      <p className="font-body text-body-md text-on-surface-variant mb-6">
        전체 지원 현황을 모니터링합니다.
      </p>
      <ApplicationManageTable />
    </div>
  );
}
