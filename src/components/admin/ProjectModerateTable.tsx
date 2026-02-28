'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';

interface AdminProject {
  _id: string;
  pid: number;
  title: string;
  status: '01' | '02' | '03';
  views: number;
  likes: string[];
  createdAt: string;
  author: { _id: string; nName: string; authorEmail: string } | null;
  members: { role: string; current: number; max: number }[];
}

interface PaginatedResult {
  projects: AdminProject[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '01': { label: '모집중', color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  '02': { label: '진행중', color: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400' },
  '03': { label: '완료', color: 'bg-muted text-muted-foreground' },
};

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: '01', label: '모집중' },
  { value: '02', label: '진행중' },
  { value: '03', label: '완료' },
];

export default function ProjectModerateTable() {
  const { confirm, alert } = useModal();
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const LIMIT = 20;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/projects?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearch(inputValue);
      setPage(1);
    }
  };

  const handleDelete = async (project: AdminProject) => {
    const ok = await confirm(
      '프로젝트 삭제',
      `"${project.title}" 프로젝트를 강제 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      { confirmText: '삭제', isDestructive: true }
    );
    if (!ok) return;

    const res = await fetch(`/api/admin/projects/${project.pid}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              projects: prev.projects.filter((p) => p._id !== project._id),
              total: prev.total - 1,
            }
          : prev
      );
    } else {
      await alert('오류', json.message);
    }
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div>
      {/* 필터 & 검색 */}
      <div className="mb-4 flex gap-3 items-center flex-wrap">
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                statusFilter === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="border border-border bg-background text-foreground rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="제목 검색 후 Enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {data && (
          <span className="text-sm text-muted-foreground">
            총 <strong>{data.total}</strong>개
          </span>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium w-16">PID</th>
              <th className="px-4 py-3 text-left font-medium">제목</th>
              <th className="px-4 py-3 text-left font-medium">작성자</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">조회</th>
              <th className="px-4 py-3 text-left font-medium">좋아요</th>
              <th className="px-4 py-3 text-left font-medium">생성일</th>
              <th className="px-4 py-3 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </td>
              </tr>
            )}
            {!loading && data?.projects.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  프로젝트가 없습니다.
                </td>
              </tr>
            )}
            {!loading &&
              data?.projects.map((project) => {
                const statusInfo = STATUS_MAP[project.status] ?? { label: project.status, color: 'bg-muted text-muted-foreground' };
                return (
                  <tr key={project._id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{project.pid}</td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-xs">
                      <Link
                        href={`/projects/${project.pid}`}
                        target="_blank"
                        className="hover:text-blue-600 hover:underline line-clamp-1"
                      >
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {project.author ? (
                        <Link
                          href={`/profile/${project.author._id}`}
                          target="_blank"
                          className="hover:text-blue-600 hover:underline"
                        >
                          {project.author.nName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/60">알 수 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{project.views}</td>
                    <td className="px-4 py-3 text-muted-foreground">{project.likes?.length ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(project)}
                        className="text-xs px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 rounded hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
