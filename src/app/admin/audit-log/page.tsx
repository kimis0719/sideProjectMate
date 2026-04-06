import AuditLogViewer from '@/components/admin/AuditLogViewer';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '감사 로그' };

export default function AdminAuditLogPage() {
  return (
    <div className="p-8">
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">감사 로그</h2>
      <p className="font-body text-body-md text-on-surface-variant mb-6">
        관리자 액션 이력을 일자별로 확인합니다.
      </p>
      <AuditLogViewer />
    </div>
  );
}
