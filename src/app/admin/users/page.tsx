import UserManageTable from '@/components/admin/UserManageTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '사용자 관리' };

export default function AdminUsersPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">사용자 관리</h2>
      <p className="text-gray-500 text-sm mb-6">
        계정 활성화/비활성화 및 관리자 권한을 관리합니다.
      </p>
      <UserManageTable />
    </div>
  );
}
