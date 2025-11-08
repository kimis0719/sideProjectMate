'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { IProject } from '@/lib/models/Project';

// react-slick을 dynamic import (클라이언트 사이드에서만 렌더링)
const ProjectImageSlider = dynamic(() => import('@/components/ProjectImageSlider'), {
  ssr: false,
  loading: () => <div className="aspect-video bg-gray-100 rounded-lg animate-pulse" />,
});

interface PopulatedProject extends Omit<IProject, 'tags'> {
  tags: { _id: string; name: string; category: string }[];
}

interface ProjectPageProps {
  params: { pid: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { pid } = params;
  const [project, setProject] = useState<PopulatedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pid) return;
    
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${pid}`);
        const data = await response.json();
        if (data.success) {
          setProject(data.data);
        } else {
          throw new Error(data.message || '프로젝트를 불러오는데 실패했습니다.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [pid]);

  if (isLoading) return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">오류: {error}</div>;
  if (!project) return <div className="flex justify-center items-center min-h-screen">프로젝트를 찾을 수 없습니다.</div>;

  const statusText = {
    recruiting: '모집중',
    'in-progress': '진행중',
    completed: '완료',
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <p className="text-sm text-gray-500 mb-2">{project.category}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{project.title}</h1>
          <div className="flex items-center text-sm text-gray-600">
            <span>작성자: {project.author}</span>
            <span className="mx-2">|</span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="prose max-w-none">
              {project.images && project.images.length > 0 ? (
                <ProjectImageSlider images={project.images} title={project.title} />
              ) : (
                 <div className="aspect-video bg-gray-100 rounded-lg mb-8 flex items-center justify-center text-8xl">🚀</div>
              )}
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{project.content}</p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">프로젝트 요약</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600">모집 현황</p>
                  <p className="text-lg font-bold text-gray-900">{project.members.current} / {project.members.max}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">상태</p>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${project.status === 'recruiting' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                    {statusText[project.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">기술 스택</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
                      <span key={tag._id} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full">{tag.name}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="mt-8 w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors">
                프로젝트 참여하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
