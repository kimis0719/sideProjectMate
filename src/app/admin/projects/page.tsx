import type { Metadata } from 'next';

export const metadata: Metadata = { title: '프로젝트 모더레이션' };

export default function AdminProjectsPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">프로젝트 모더레이션</h2>
      <p className="text-gray-500">Phase 2에서 구현됩니다.</p>
    </div>
  );
}
