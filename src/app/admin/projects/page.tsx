import ProjectModerateTable from '@/components/admin/ProjectModerateTable';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '프로젝트 모더레이션' };

export default function AdminProjectsPage() {
  return (
    <div className="p-8">
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">프로젝트 모더레이션</h2>
      <p className="font-body text-body-md text-on-surface-variant mb-6">
        불건전 게시물을 검토하고 강제 삭제합니다.
      </p>
      <ProjectModerateTable />
    </div>
  );
}
