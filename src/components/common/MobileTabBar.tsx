'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 모바일 하단 탭 바
 * - 모바일(< 768px)에서만 표시
 * - 4개 탭: 프로젝트 / 대시보드 / 채팅 / 프로필
 * - 노출: /projects, /dashboard, /chat, /profile (정확히 이 4개 경로)
 * - 숨김: 하위 페이지 진입 시 (예: /projects/123)
 * - iOS Safe Area: env(safe-area-inset-bottom) 패딩 적용
 */

const TABS = [
  {
    label: '프로젝트',
    path: '/projects',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    label: '대시보드',
    path: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    label: '채팅',
    path: '/chat',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    label: '프로필',
    path: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
] as const;

// 탭 바를 노출할 정확한 경로 목록
const TAB_PATHS = TABS.map((t) => t.path);

export default function MobileTabBar() {
  const pathname = usePathname();

  // 현재 경로가 4개 탭 경로 중 하나와 정확히 일치할 때만 표시
  const isVisible = TAB_PATHS.some((p) => pathname === p);
  if (!isVisible) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="하단 탭 바"
    >
      <div className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold tracking-wide uppercase">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
