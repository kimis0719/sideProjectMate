import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드',
};

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">관리자 대시보드</h2>
      <p className="text-gray-500 mb-8">플랫폼 현황을 한눈에 확인하세요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '전체 사용자', icon: '👥', href: '/admin/users' },
          { label: '전체 프로젝트', icon: '📁', href: '/admin/projects' },
          { label: '공통 코드', icon: '🔖', href: '/admin/common-codes' },
          { label: '기술 스택', icon: '🛠️', href: '/admin/tech-stacks' },
        ].map(({ label, icon, href }) => (
          <a
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-3 bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
          >
            <span className="text-4xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-xs text-blue-500">관리하기 →</span>
          </a>
        ))}
      </div>

      <p className="mt-12 text-xs text-gray-400">
        Phase 3 통계 대시보드는 Phase 2 기능 구현 후 추가됩니다.
      </p>
    </div>
  );
}
