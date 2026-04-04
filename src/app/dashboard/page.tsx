'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProjectThumbnail from '@/components/projects/ProjectThumbnail';
import { STATUS_LABELS, STAGE_LABELS, ProjectStatus, ProjectStage } from '@/constants/project';

interface Project {
  _id: string;
  pid: number;
  title: string;
  category: string;
  status: string;
  currentStage?: string;
  createdAt: string;
  images: string[];
  members: { userId: string; role: string; status: string }[];
}

export default function DashboardHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && (session?.user?._id || session?.user?.id)) {
      const userId = session.user._id || session.user.id;
      const fetchMyProjects = async () => {
        try {
          const response = await fetch(`/api/projects?memberId=${userId}`);
          const data = await response.json();
          if (data.success) {
            setProjects(data.data.projects);
          }
        } catch (error) {
          console.error('Failed to fetch projects:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMyProjects();
    }
  }, [status, session, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-on-surface">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-10 bg-surface min-h-screen">
      <h1 className="text-4xl font-bold font-headline tracking-tight text-on-surface mb-8">
        내 워크스페이스
      </h1>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/dashboard/${project.pid}`}
              className="block bg-surface-container-lowest rounded-xl overflow-hidden group hover:shadow-[0_20px_40px_rgba(26,28,28,0.04)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-video bg-surface-container-high relative overflow-hidden">
                <ProjectThumbnail
                  src={
                    project.images && project.images.length > 0 && project.images[0] !== '🚀'
                      ? project.images[0]
                      : null
                  }
                  alt={project.title}
                  fallbackText={project.title.charAt(0)}
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-on-surface group-hover:text-primary-container transition-colors">
                    {project.title}
                  </h2>
                  <span className="text-xs text-on-surface-variant shrink-0 ml-3 mt-1">
                    {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {project.currentStage && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide bg-primary-container/15 text-primary-container">
                      {STAGE_LABELS[project.currentStage as ProjectStage] || project.currentStage}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wide ${
                      project.status === 'recruiting'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {STATUS_LABELS[project.status as ProjectStatus] || project.status}
                  </span>
                  <span className="text-xs text-on-surface-variant ml-auto">
                    멤버 {project.members?.length || 0}명
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-container-low rounded-xl">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">
            folder_open
          </span>
          <p className="text-on-surface-variant mb-4">참여 중인 프로젝트가 없습니다.</p>
          <Link
            href="/projects"
            className="inline-block px-6 py-3 bg-primary-container text-on-primary rounded-lg font-bold hover:opacity-90 transition-all"
          >
            프로젝트 찾아보기
          </Link>
        </div>
      )}
    </div>
  );
}
