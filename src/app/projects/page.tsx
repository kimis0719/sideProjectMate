import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import CommonCode from '@/lib/models/CommonCode';
import ProjectList from '@/components/projects/ProjectList';
import AdBanner from '@/components/common/AdBanner';

export const dynamic = 'force-dynamic';

async function getCommonCodes(group: string) {
  await dbConnect();
  const codes = await CommonCode.find({ group, isActive: true }).sort('order').lean();
  return JSON.parse(JSON.stringify(codes));
}

export default async function ProjectsPage() {
  const categoryCodes = await getCommonCodes('CATEGORY');
  const statusCodes = await getCommonCodes('STATUS');

  return (
    <>
      {/* 광고 배너 — 프로젝트 목록 상단 */}
      <div className="container mx-auto px-4">
        <AdBanner slot="project-list-top" className="py-4" />
      </div>
      <Suspense fallback={<div className="text-center py-20 text-foreground">페이지를 불러오는 중...</div>}>
        <ProjectList categoryCodes={categoryCodes} statusCodes={statusCodes} />
      </Suspense>
    </>
  );
}
