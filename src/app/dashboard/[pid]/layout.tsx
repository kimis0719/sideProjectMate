'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SidebarShell from '@/components/common/SidebarShell';
import type { SidebarMenuItem } from '@/components/common/SidebarShell';

interface ProjectMember {
  userId: { _id: string } | string;
  role: string;
  status: string;
}

interface ProjectData {
  _id: string;
  title: string;
  ownerId: { _id: string } | string;
  members: ProjectMember[];
}

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { pid: string };
}) {
  const pathname = usePathname();
  const { pid } = params;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');

  // 권한 체크
  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        router.replace('/');
        return;
      }

      if (session?.user?._id || session?.user?.id) {
        try {
          const res = await fetch(`/api/projects/${pid}`);
          if (!res.ok) {
            router.replace('/');
            return;
          }
          const data = await res.json();
          if (!data.success || !data.data) {
            router.replace('/');
            return;
          }

          const project = data.data as ProjectData;
          const userId = session.user._id || session.user.id;

          const ownerIdStr =
            typeof project.ownerId === 'string'
              ? project.ownerId
              : project.ownerId?._id?.toString();
          const isAuthor = ownerIdStr === userId;

          const isMember = (project.members || []).some((m) => {
            const memberIdStr = typeof m.userId === 'string' ? m.userId : m.userId?._id?.toString();
            return memberIdStr === userId && m.status === 'active';
          });

          if (isAuthor || isMember) {
            setIsAuthorized(true);
            setIsOwner(isAuthor);
            setProjectTitle(project.title || '');
          } else {
            setIsAuthorized(false);
            router.replace('/');
          }
        } catch (error) {
          console.error('Failed to check access:', error);
          router.replace('/');
        }
      }
    };

    checkAccess();
  }, [pid, session, status, router]);

  if (status === 'loading' || isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthorized === false) return null;

  const menuItems: SidebarMenuItem[] = [
    { href: `/dashboard/${pid}`, icon: 'dashboard', label: '대시보드 홈' },
    { href: `/dashboard/${pid}/kanban`, icon: 'view_kanban', label: '칸반보드' },
    { href: `/projects/${pid}/manage`, icon: 'group', label: '멤버관리' },
    ...(isOwner
      ? [{ href: `/projects/${pid}/edit`, icon: 'settings', label: '프로젝트 설정' }]
      : []),
  ];

  return (
    <SidebarShell
      title="프로젝트 대시보드"
      subtitle={projectTitle}
      menuItems={menuItems}
      adBannerUnitId={process.env.NEXT_PUBLIC_ADFIT_SIDEBAR}
      hideTriggerPaths={['/kanban']}
    >
      {children}
    </SidebarShell>
  );
}
