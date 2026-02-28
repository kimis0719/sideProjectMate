import TechStackManager from '@/components/admin/TechStackManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '기술 스택 관리' };

export default function AdminTechStacksPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-foreground mb-1">기술 스택 관리</h2>
      <p className="text-muted-foreground text-sm mb-6">
        프로젝트 태그 및 유저 프로필에 사용되는 기술 스택을 관리합니다.
      </p>
      <TechStackManager />
    </div>
  );
}
