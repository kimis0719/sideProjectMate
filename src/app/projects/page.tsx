import { Suspense } from 'react';
import ProjectList from '@/components/projects/ProjectList';
import AdBanner from '@/components/common/AdBanner';

export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return (
    <>
      <Suspense
        fallback={<div className="text-center py-20 text-foreground">페이지를 불러오는 중...</div>}
      >
        <ProjectList />
      </Suspense>
      {/* 광고 배너 — 프로젝트 목록 하단 */}
      <div className="container mx-auto px-4">
        <AdBanner
          unitId={process.env.NEXT_PUBLIC_ADFIT_PROJECT_LIST}
          size="rectangle"
          className="py-4"
        />
      </div>
    </>
  );
}
