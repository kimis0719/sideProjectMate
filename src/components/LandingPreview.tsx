'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ProjectCard from '@/components/projects/ProjectCard';

interface PreviewProject {
  pid: number;
  title: string;
  problemStatement?: string;
  currentStage?: string;
  executionStyle?: string;
  weeklyHours?: number;
  status: string;
  members: { status: string }[];
  maxMembers?: number;
  images: string[];
  lookingFor?: string[];
  createdAt: Date;
}

export default function LandingPreview({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [previewProjects, setPreviewProjects] = useState<PreviewProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      // 비회원: 모집중 프로젝트 3개 fetch
      fetch('/api/projects?status=recruiting&limit=3&sortBy=latest')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setPreviewProjects(data.data.projects);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

  if (status === 'loading' || isLoading) return null;

  // 로그인 유저: 전체 ProjectList (children)
  if (session) {
    return <div className="container mx-auto px-4 py-10">{children}</div>;
  }

  // 비회원: 미리보기 카드 3개 + CTA
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-on-surface mb-2">지금 팀원을 찾고 있는 프로젝트</h2>
        <p className="text-on-surface-variant">
          가입하면 더 많은 프로젝트를 탐색하고 지원할 수 있어요
        </p>
      </div>

      {previewProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {previewProjects.map((project) => (
            <ProjectCard key={project.pid} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-surface-container-low rounded-xl max-w-lg mx-auto">
          <p className="text-on-surface-variant mb-4">아직 등록된 프로젝트가 없어요.</p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            첫 번째로 시작해보세요!
          </Link>
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors"
        >
          무료로 시작하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
