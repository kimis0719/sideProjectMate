import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import CommonCode from '@/lib/models/CommonCode';
import ProjectList from '@/components/projects/ProjectList';

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
    <Suspense fallback={<div className="text-center py-20 text-gray-900 dark:text-white">페이지를 불러오는 중...</div>}>
      <ProjectList categoryCodes={categoryCodes} statusCodes={statusCodes} />
    </Suspense>
  );
}
