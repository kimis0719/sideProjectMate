'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/users', label: '사용자 관리', icon: '👥' },
  { href: '/admin/projects', label: '프로젝트 모더레이션', icon: '📁' },
  { href: '/admin/common-codes', label: '공통 코드 관리', icon: '🔖' },
  { href: '/admin/tech-stacks', label: '기술 스택 관리', icon: '🛠️' },
  { href: '/admin/ai-settings', label: 'AI 지시서 설정', icon: '🤖' },
  { href: '/admin/applications', label: '지원서 관리', icon: '📋' },
  { href: '/admin/reviews', label: '리뷰 관리', icon: '⭐' },
  { href: '/admin/announcements', label: '공지사항', icon: '📢' },
  { href: '/admin/audit-log', label: '감사 로그', icon: '📜' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 z-40 bg-inverse-surface text-inverse-on-surface flex flex-col">
      <div className="px-6 py-6 mb-2">
        <p className="font-body text-label-md text-inverse-on-surface/50 uppercase tracking-widest mb-1">
          Side Project Mate
        </p>
        <h1 className="font-headline text-xl font-bold tracking-tight text-inverse-on-surface">
          관리자 패널
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-body text-body-md transition-all duration-200 ${
                isActive
                  ? 'bg-surface-container-lowest text-primary font-semibold shadow-ambient'
                  : 'text-inverse-on-surface/70 hover:bg-white/10 hover:translate-x-1'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-6 mt-auto border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-body-md text-inverse-on-surface/70 hover:bg-white/10 transition-colors"
        >
          ← 서비스로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
