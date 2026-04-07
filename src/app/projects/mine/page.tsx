import { Suspense } from 'react';
import ProjectList from '@/components/projects/ProjectList';

export const dynamic = 'force-dynamic';

export default function MyProjectsPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-20 text-on-surface">페이지를 불러오는 중...</div>}
    >
      <ProjectList mine />
    </Suspense>
  );
}
