import CommonCodeManager from '@/components/admin/CommonCodeManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '공통 코드 관리' };

export default function AdminCommonCodesPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">공통 코드 관리</h2>
      <p className="text-gray-500 text-sm mb-6">
        직군·카테고리·경력 등 플랫폼 전역에서 사용하는 코드를 관리합니다.
      </p>
      <CommonCodeManager />
    </div>
  );
}
