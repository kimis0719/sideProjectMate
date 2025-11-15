'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { IProject } from '@/lib/models/Project';

interface PopulatedProject extends Omit<IProject, 'tags' | 'author'> {
  author: { _id: string; nName: string } | string;
  tags: { _id: string; name: string; category: string }[];
}

function ProjectList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [projects, setProjects] = useState<PopulatedProject[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모든 상태의 소스를 URL 쿼리 파라미터에서 가져오도록 통일
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 8;
  const searchTerm = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'latest';

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        // 현재 URL의 쿼리 파라미터를 그대로 API 요청에 사용
        const params = new URLSearchParams(searchParams.toString());
        const response = await fetch(`/api/projects?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setProjects(data.data.projects);
          setTotalProjects(data.data.total);
        } else {
          throw new Error(data.message || '프로젝트를 불러오는데 실패했습니다.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [searchParams]); // URL의 쿼리 파라미터가 변경될 때마다 데이터를 다시 불러옴

  // 상태 변경 시 URL을 업데이트하는 함수
  const updateUrlParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`/projects?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: String(newPage) });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    // 필터 변경 시 1페이지로 리셋
    updateUrlParams({ [name]: value, page: '1' });
  };

  const totalPages = Math.ceil(totalProjects / limit);

  const getAuthorName = (author: { _id: string; nName: string } | string | undefined | null): string => {
    if (typeof author === 'object' && author !== null && 'nName' in author) {
      return author.nName;
    }
    if (typeof author === 'string') {
      return author;
    }
    return '작성자';
  };

  if (isLoading) return <div className="text-center py-20 text-gray-900 dark:text-white">프로젝트를 불러오는 중... 🚀</div>;
  if (error) return <div className="text-center py-20 text-red-500 dark:text-red-400">오류: {error}</div>;

  return (
    <div className="bg-white dark:bg-gray-900">
      <section className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <div className="relative">
                <input type="text" name="search" placeholder="제목 또는 내용으로 검색" className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400" value={searchTerm} onChange={handleFilterChange} />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              <select name="category" value={category} onChange={handleFilterChange} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400">
                <option value="all">전체 카테고리</option> <option value="디자인">디자인</option> <option value="개발">개발</option> <option value="게임">게임</option> <option value="데이터">데이터</option> <option value="AI">AI</option>
              </select>
              <select name="status" value={status} onChange={handleFilterChange} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400">
                <option value="all">전체 상태</option> <option value="recruiting">모집중</option> <option value="completed">완료</option>
              </select>
              <select name="sortBy" value={sortBy} onChange={handleFilterChange} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400">
                <option value="latest">최신순</option> <option value="deadline">마감임박순</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">전체 프로젝트</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">총 {totalProjects}개의 프로젝트가 있습니다.</p>
          </div>
          <Link href="/projects/new" className="bg-gray-900 dark:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">+ 새 프로젝트 만들기</Link>
        </div>
        
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => {
              const membersArray = Array.isArray(project.members) ? project.members : [];
              const totalMax = membersArray.reduce((sum, member) => sum + (member.max || 0), 0);
              const totalCurrent = membersArray.reduce((sum, member) => sum + (member.current || 0), 0);

              return (
                <Link key={project.pid} href={`/projects/${project.pid}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {project.images && project.images.length > 0 ? <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" /> : <span className="text-6xl">🚀</span>}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded">{project.category}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{totalCurrent}/{totalMax}명</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{project.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Array.isArray(project.tags) && project.tags.map((tag) => <span key={tag._id} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">#{tag.name}</span>)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span>{getAuthorName(project.author)}</span>
                      <span>{new Date(project.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20"><p className="text-gray-500 dark:text-gray-400">찾으시는 조건의 프로젝트가 없습니다. 🥲</p></div>
        )}

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">이전</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
              <button key={pageNumber} onClick={() => handlePageChange(pageNumber)} className={`px-4 py-2 border rounded-lg transition-colors ${page === pageNumber ? 'border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{pageNumber}</button>
            ))}
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">다음</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-900 dark:text-white">페이지를 불러오는 중...</div>}>
      <ProjectList />
    </Suspense>
  );
}
