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
import ProjectCard from './ProjectCard';
import EmptyState from '@/components/common/EmptyState';

const WEEKLY_HOURS_FILTER = [0, 5, 10, 15, 20] as const;

function ProjectListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const domain = searchParams.get('domain') || '';
  const stage = searchParams.get('stage') || '';
  const style = searchParams.get('style') || '';
  const minHours = searchParams.get('minHours') || '';
  const status = searchParams.get('status') || '';
  const sortBy = searchParams.get('sortBy') || 'latest';

  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

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

  const hasActiveFilters = domain || stage || style || minHours || status || searchTerm;
  const totalPages = Math.ceil(totalProjects / limit);
  const stageValues = stage ? stage.split(',') : [];
  const styleValues = style ? style.split(',') : [];

  return (
    <div className="bg-background">
      {/* 필터 영역 */}
      <section className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-6 space-y-4">
          {/* 검색 + 정렬 */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="제목, 설명, 프로젝트 동기로 검색 (Enter)"
                  className="w-full px-4 py-3 pl-12 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
            <div className="flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => updateUrlParams({ sortBy: e.target.value, page: '1' })}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
              >
                <option value="latest">최신순</option>
                <option value="deadline">마감임박순</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 border border-input rounded-lg bg-background text-muted-foreground text-sm hover:text-foreground"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>

          {/* 도메인 검색 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground shrink-0">도메인</span>
            <input
              type="text"
              placeholder="도메인 검색 (Enter)"
              className="px-3 py-1.5 border border-input rounded-lg bg-background text-foreground text-sm w-48"
              defaultValue={domain}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateUrlParams({
                    domain: (e.target as HTMLInputElement).value,
                    page: '1',
                  });
                }
              }}
            />
          </div>

          {/* 단계 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground shrink-0">단계</span>
            {PROJECT_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => toggleMultiParam('stage', stage, s)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  stageValues.includes(s)
                    ? 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/50 dark:text-violet-200 dark:border-violet-700'
                    : 'bg-background border-border text-muted-foreground hover:border-violet-300'
                }`}
              >
                {STAGE_LABELS[s as ProjectStage]}
              </button>
            ))}
          </div>

          {/* 실행 방식 필터 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground shrink-0">실행 방식</span>
            {EXECUTION_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => toggleMultiParam('style', style, s)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  styleValues.includes(s)
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700'
                    : 'bg-background border-border text-muted-foreground hover:border-emerald-300'
                }`}
              >
                {STYLE_LABELS[s as ExecutionStyle]}
              </button>
            ))}
          </div>

          {/* 주당 시간 + 상태 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground shrink-0">주당 시간</span>
              {WEEKLY_HOURS_FILTER.map((h) => (
                <button
                  key={h}
                  onClick={() => updateUrlParams({ minHours: h === 0 ? '' : String(h), page: '1' })}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    (h === 0 && !minHours) || minHours === String(h)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {h === 0 ? '전체' : `${h}h+`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground shrink-0">상태</span>
              <button
                onClick={() => updateUrlParams({ status: '', page: '1' })}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  !status
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                전체
              </button>
              {PROJECT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => updateUrlParams({ status: s, page: '1' })}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    status === s
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {STATUS_LABELS[s as ProjectStatus]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 프로젝트 목록 */}
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

        {isLoading ? (
          <div className="text-center py-20 text-foreground">프로젝트를 불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">오류: {error}</div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.pid} project={project} />
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
                    className="px-4 py-2 border border-input rounded-lg text-sm text-foreground hover:bg-muted"
                  >
                    필터 초기화
                  </button>
                )}
                <Link
                  href="/projects/new"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90"
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
                className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    page === pageNumber
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
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
      fallback={<div className="text-center py-20 text-foreground">페이지를 불러오는 중...</div>}
    >
      <ProjectListContent />
    </Suspense>
  );
}
