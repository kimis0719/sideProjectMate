'use client';

import SidebarShell from '@/components/common/SidebarShell';
import type { SidebarMenuItem } from '@/components/common/SidebarShell';

const PROJECTS_MENU: SidebarMenuItem[] = [
  { href: '/projects', icon: 'grid_view', label: '모든 프로젝트' },
  { href: '/projects/mine', icon: 'person', label: '내 프로젝트' },
  { href: '/projects/favorites', icon: 'favorite', label: '즐겨찾기' },
  { href: '/dashboard', icon: 'workspaces', label: '내 워크스페이스' },
];

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarShell
      title="프로젝트"
      subtitle="사이드 프로젝트를 찾아보세요"
      menuItems={PROJECTS_MENU}
      adBannerUnitId={process.env.NEXT_PUBLIC_ADFIT_PROJECT_LIST}
    >
      {children}
    </SidebarShell>
  );
}
