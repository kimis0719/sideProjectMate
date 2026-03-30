'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { IProject } from '@/lib/models/Project';
import { ICommonCode } from '@/lib/models/CommonCode';
import ProjectThumbnail from './ProjectThumbnail';

interface PopulatedProject extends Omit<IProject, 'tags' | 'author'> {
  author: { _id: string; nName: string } | string;
  tags: { _id: string; name: string; category: string }[];
}

interface ProjectListProps {
  categoryCodes: ICommonCode[];
  statusCodes: ICommonCode[];
}

/**
 * [내부 컴포넌트] ProjectListContent
 * 실제 useSearchParams를 사용하고 데이터를 페칭하는 로직이 들어있는 컴포넌트입니다.
 * 이 컴포넌트는 아래의 ProjectList(Wrapper)에 의해 Suspense로 감싸집니다.
 */
function ProjectListContent({ categoryCodes, statusCodes }: ProjectListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<PopulatedProject[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 검색어 입력을 위한 로컬 상태 (엔터키를 누르기 전까지 임시 저장)
  const [searchInput, setSearchInput] = useState('');

  // 모든 상태의 소스를 URL 쿼리 파라미터에서 가져오도록 통일
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 8;
  const searchTerm = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sortBy') || 'latest';

  // URL의 검색어 파라미터가 변경되면 로컬 입력 상태도 동기화
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '프로젝트를 불러오는데 실패했습니다.');
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

  // 검색어 입력 시 로컬 상태만 업데이트 (아직 검색 실행 안 함)
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // 키보드를 눌렀을 때 엔터키인지 확인하여 검색 실행
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 엔터키가 눌렸는지 확인
    if (e.key === 'Enter') {
      // 검색어를 URL 파라미터에 반영하여 검색 실행
      updateUrlParams({ search: searchInput, page: '1' });
    }
  };

  const totalPages = Math.ceil(totalProjects / limit);

  const getAuthorName = (
    author: { _id: string; nName: string } | string | undefined | null
  ): string => {
    if (typeof author === 'object' && author !== null && 'nName' in author) {
      return author.nName;
    }
    if (typeof author === 'string') {
      return author;
    }
    return '작성자';
  };

  if (isLoading)
    return <div className="text-center py-20 text-foreground">프로젝트를 불러오는 중... 🚀</div>;
  if (error) return <div className="text-center py-20 text-destructive">오류: {error}</div>;

  return (
    <div className="bg-background">
      <section className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <div className="relative">
                {/* 검색어 입력 필드: 타이핑은 로컬 상태에 저장되고, 엔터키를 누르면 실제 검색 실행 */}
                <input
                  type="text"
                  name="search"
                  placeholder="제목 또는 내용으로 검색 (Enter)"
                  className="w-full px-4 py-3 pl-12 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onKeyDown={handleSearchKeyDown}
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              <select
                name="category"
                value={category}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">전체 카테고리</option>
                {categoryCodes.map((code) => (
                  <option key={code._id?.toString()} value={code.code}>
                    {code.label}
                  </option>
                ))}
              </select>
              <select
                name="status"
                value={status}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">전체 상태</option>
                {statusCodes.map((code) => (
                  <option key={code._id?.toString()} value={code.code}>
                    {code.label}
                  </option>
                ))}
              </select>
              <select
                name="sortBy"
                value={sortBy}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="latest">최신순</option> <option value="deadline">마감임박순</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">전체 프로젝트</h2>
            <p className="text-muted-foreground mt-1">
              총 {totalProjects}개의 프로젝트가 있습니다.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            + 새 프로젝트 만들기
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => {
              const membersArray = Array.isArray(project.members) ? project.members : [];
              const totalCurrent = membersArray.filter((m) => m.status === 'active').length;
              const totalMax = project.maxMembers ?? 4;

              return (
                <Link
                  key={project.pid}
                  href={`/projects/${project.pid}`}
                  className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer border border-border"
                >
                  <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    <ProjectThumbnail
                      src={project.images && project.images.length > 0 ? project.images[0] : null}
                      alt={project.title}
                      fallbackText={project.title.charAt(0)}
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      {/* TODO(Phase 3): domain 태그로 교체 */}
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded ${
                          project.status === 'recruiting'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {statusCodes.find((c) => c.code === project.status)?.label ||
                          project.status}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {totalCurrent}/{totalMax}명
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {Array.isArray(project.tags) &&
                        project.tags.map((tag) => (
                          <span
                            key={tag._id}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                          >
                            #{tag.name}
                          </span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                      <span>{getAuthorName(project.author)}</span>
                      <span>{new Date(project.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">찾으시는 조건의 프로젝트가 없습니다. 🥲</p>
          </div>
        )}

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`px-4 py-2 border rounded-lg transition-colors ${page === pageNumber ? 'border-gray-800 dark:border-gray-700 bg-gray-800 dark:bg-gray-700 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * [외부 래퍼 컴포넌트] ProjectList
 * 단순히 ProjectListContent를 Suspense로 감싸는 역할만 수행합니다.
 * 이렇게 해야 빌드 시 useSearchParams 관련 에러를 피할 수 있습니다.
 */

export default function ProjectList(props: ProjectListProps) {
  return (
    <Suspense
      fallback={<div className="text-center py-20 text-foreground">페이지를 불러오는 중...</div>}
    >
      <ProjectListContent {...props} />
    </Suspense>
  );
}
