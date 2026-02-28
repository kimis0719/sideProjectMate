import type { Metadata } from 'next';

export const metadata: Metadata = { title: '공통 코드 관리' };

export default function AdminCommonCodesPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">공통 코드 관리</h2>
      <p className="text-gray-500">Phase 2에서 구현됩니다.</p>
    </div>
  );
}
