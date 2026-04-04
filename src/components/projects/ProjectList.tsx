'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PROJECT_STAGES,
  EXECUTION_STYLES,
  PROJECT_STATUSES,
  STAGE_LABELS,
  STYLE_LABELS,
  STATUS_LABELS,
  ProjectStage,
  ExecutionStyle,
  ProjectStatus,
} from '@/constants/project';
import { useSession } from 'next-auth/react';
import { useApplicationStore } from '@/store/applicationStore';
import ProjectCard from './ProjectCard';
import EmptyState from '@/components/common/EmptyState';

function ProjectListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { fetchMyApplications, loaded: appLoaded, getStatus } = useApplicationStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  // URL params → state
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 8;
  const searchTerm = searchParams.get('search') || '';
  const stage = searchParams.get('stage') || '';
  const style = searchParams.get('style') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'latest';

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (session?.user?._id && !appLoaded) {
      fetchMyApplications();
    }
  }, [session?.user?._id, appLoaded, fetchMyApplications]);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
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
  }, [searchParams]);

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateUrlParams({ search: searchInput, page: '1' });
    }
  };

  const toggleMultiParam = (paramName: string, currentValue: string, code: string) => {
    const values = currentValue ? currentValue.split(',') : [];
    const newValues = values.includes(code) ? values.filter((v) => v !== code) : [...values, code];
    updateUrlParams({ [paramName]: newValues.join(','), page: '1' });
  };

  const clearAllFilters = () => {
    router.push('/projects');
  };

  const hasActiveFilters = stage || style || status || searchTerm;
  const totalPages = Math.ceil(totalProjects / limit);
  const stageValues = stage ? stage.split(',') : [];
  const styleValues = style ? style.split(',') : [];

  return (
    <div className="bg-surface">
      {/* 필터 영역 */}
      <section className="bg-surface-container-low">
        <div className="px-6 lg:px-8 py-8 space-y-5">
          {/* 검색 + 정렬 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="프로젝트, 도메인, 기술 스택 검색 (Enter)"
                className="w-full px-4 py-3 pl-12 bg-surface-container-lowest border-none rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20 placeholder:text-on-surface-variant/30 text-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">
                search
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => updateUrlParams({ sortBy: e.target.value, page: '1' })}
              className="px-4 py-3 bg-surface-container-lowest border-none rounded-xl text-on-surface text-sm focus:ring-2 focus:ring-primary-container/20"
            >
              <option value="latest">최신순</option>
              <option value="deadline">마감임박순</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-3 bg-surface-container-high text-on-surface-variant rounded-xl text-sm hover:bg-surface-dim transition-colors"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* 상태 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest shrink-0">
              상태
            </span>
            <button
              onClick={() => updateUrlParams({ status: '', page: '1' })}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                !status
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'
              }`}
            >
              전체
            </button>
            {PROJECT_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateUrlParams({ status: s, page: '1' })}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  status === s
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                {STATUS_LABELS[s as ProjectStatus]}
              </button>
            ))}
          </div>

          {/* 단계 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest shrink-0">
              단계
            </span>
            {PROJECT_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => toggleMultiParam('stage', stage, s)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  stageValues.includes(s)
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                {STAGE_LABELS[s as ProjectStage]}
              </button>
            ))}
          </div>

          {/* 실행 방식 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest shrink-0">
              실행
            </span>
            {EXECUTION_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => toggleMultiParam('style', style, s)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  styleValues.includes(s)
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                {STYLE_LABELS[s as ExecutionStyle]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 프로젝트 목록 */}
      <section className="px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold font-headline text-on-surface">전체 프로젝트</h2>
            <p className="text-on-surface-variant mt-1">
              총 {totalProjects}개의 프로젝트가 있습니다.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="hidden md:flex items-center gap-2 bg-primary-container text-on-primary font-bold py-2.5 px-5 rounded-lg hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>새 프로젝트
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-on-surface">프로젝트를 불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-20 text-error">오류: {error}</div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.pid}
                project={project}
                applicationStatus={getStatus(project._id)?.status}
                isOwner={
                  session?.user?._id ===
                  (typeof project.ownerId === 'object' ? project.ownerId?._id : project.ownerId)
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="조건에 맞는 프로젝트가 없어요"
            description="필터를 변경하거나 새 프로젝트를 등록해보세요."
            actions={
              <div className="flex gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg text-sm hover:bg-surface-dim"
                  >
                    필터 초기화
                  </button>
                )}
                <Link
                  href="/projects/new"
                  className="px-4 py-2 bg-primary-container text-on-primary rounded-lg text-sm font-bold hover:opacity-90"
                >
                  첫 프로젝트 등록하기
                </Link>
              </div>
            }
          />
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-dim transition-colors disabled:opacity-50"
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    page === pageNumber
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-dim'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-dim transition-colors disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ProjectList() {
  return (
    <Suspense
      fallback={<div className="text-center py-20 text-on-surface">페이지를 불러오는 중...</div>}
    >
      <ProjectListContent />
    </Suspense>
  );
}
