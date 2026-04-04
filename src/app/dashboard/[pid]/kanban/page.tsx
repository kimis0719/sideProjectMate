'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const BoardShell = dynamic(() => import('@/components/board/BoardShell'), {
  ssr: false,
});

const KanbanMobileView = dynamic(() => import('@/components/board/KanbanMobileView'), {
  ssr: false,
});

export default function KanbanPage({ params }: { params: { pid: string } }) {
  const pid = parseInt(params.pid, 10);
  const isMobile = useMediaQuery('(max-width: 767px)');

  // 칸반 페이지에서 Footer + MobileTabBar 숨김
  useEffect(() => {
    document.body.classList.add('kanban-active');
    return () => document.body.classList.remove('kanban-active');
  }, []);

  if (isMobile) {
    return <KanbanMobileView pid={pid} />;
  }

  return (
    <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
      <BoardShell pid={pid} />
    </div>
  );
}
