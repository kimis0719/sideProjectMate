'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';
import AdminProjectDetailModal from '@/components/admin/AdminProjectDetailModal';

interface AdminProject {
  _id: string;
  pid: number;
  title: string;
  status: string;
  delYn: boolean;
  views: number;
  likeCount: number;
  createdAt: string;
  ownerId: { _id: string; nName: string; authorEmail: string } | null;
  members: { userId: string; role: string; status: string }[];
}

interface PaginatedResult {
  projects: AdminProject[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  recruiting: {
    label: '모집중',
    color: 'bg-primary/5 text-primary',
  },
  in_progress: {
    label: '진행중',
    color: 'bg-amber-50 text-amber-600',
  },
  completed: { label: '완료', color: 'bg-surface-container-high text-on-surface-variant' },
  paused: { label: '일시정지', color: 'bg-surface-container-high text-on-surface-variant' },
};

const STATUS_FILTERS = [
  { value: '', label: '전체' },
  { value: 'recruiting', label: '모집중' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'paused', label: '일시정지' },
];

const LIMIT = 20;

export default function ProjectModerateTable() {
  const { confirm, alert } = useModal();
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [selectedPids, setSelectedPids] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-on-surface-variant/50">
      {sortField === field ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sortBy: sortField,
        order: sortOrder,
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/projects?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, sortField, sortOrder]);

  useEffect(() => {
    fetchProjects();
    setSelectedPids(new Set()); // 페이지 변경 시 선택 초기화
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

  const handleModalDeleted = (pid: number) => {
    setData((prev) =>
      prev
        ? { ...prev, projects: prev.projects.filter((p) => p.pid !== pid), total: prev.total - 1 }
        : prev
    );
  };

  // 체크박스 토글
  const toggleSelect = (pid: number) => {
    setSelectedPids((prev) => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  const currentPagePids = data?.projects.map((p) => p.pid) ?? [];
  const allCurrentSelected =
    currentPagePids.length > 0 && currentPagePids.every((pid) => selectedPids.has(pid));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedPids((prev) => {
        const next = new Set(prev);
        currentPagePids.forEach((pid) => next.delete(pid));
        return next;
      });
    } else {
      setSelectedPids((prev) => {
        const next = new Set(prev);
        currentPagePids.forEach((pid) => next.add(pid));
        return next;
      });
    }
  };

  // 일괄 비활성화/재활성화
  const handleBulkToggle = async (delYn: boolean) => {
    const pids = Array.from(selectedPids);
    const action = delYn ? '비활성화' : '재활성화';
    const ok = await confirm(
      `일괄 ${action}`,
      `선택한 ${pids.length}개 프로젝트를 ${action}하시겠습니까?`,
      { confirmText: action, isDestructive: delYn }
    );
    if (!ok) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pids, delYn }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedPids(new Set());
        await fetchProjects();
      } else {
        await alert('오류', json.message);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  // 일괄 영구 삭제
  const handleBulkDelete = async () => {
    const pids = Array.from(selectedPids);
    const ok = await confirm(
      '일괄 삭제',
      `선택한 ${pids.length}개 프로젝트를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      { confirmText: '삭제', isDestructive: true }
    );
    if (!ok) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pids }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedPids(new Set());
        await fetchProjects();
      } else {
        await alert('오류', json.message);
      }
    } finally {
      setBulkLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;
  const rangeStart = data ? (page - 1) * LIMIT + 1 : 0;
  const rangeEnd = data ? Math.min(page * LIMIT, data.total) : 0;

  return (
    <div>
      {selectedPid !== null && (
        <AdminProjectDetailModal
          pid={selectedPid}
          onClose={() => setSelectedPid(null)}
          onUpdated={fetchProjects}
          onDeleted={handleModalDeleted}
        />
      )}

      {/* 필터 & 검색 & 일괄 액션 바 */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => {
                  setStatusFilter(value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 font-body text-body-md rounded-lg border transition-colors ${
                  statusFilter === value
                    ? 'bg-primary-container text-on-primary rounded-lg border-primary-container'
                    : 'bg-transparent text-on-surface-variant rounded-lg hover:bg-surface-container-low border-outline-variant/15'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="bg-surface-container-lowest text-on-surface border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-lg px-3 py-1.5 font-body text-body-md w-56 focus:outline-none"
            placeholder="제목 검색 후 Enter"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {data && (
            <span className="font-body text-body-md text-on-surface-variant">
              {rangeStart}–{rangeEnd} / 총 <strong>{data.total}</strong>개
            </span>
          )}
        </div>

        {selectedPids.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-body text-body-md text-on-surface-variant">
              <strong className="text-on-surface">{selectedPids.size}개</strong> 선택됨
            </span>
            <button
              onClick={() => handleBulkToggle(true)}
              disabled={bulkLoading}
              className="font-body text-body-md px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              일괄 비활성화
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              disabled={bulkLoading}
              className="font-body text-body-md px-3 py-1.5 rounded-lg bg-green-50 text-emerald-600 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              일괄 재활성화
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="font-body text-body-md px-3 py-1.5 rounded-lg bg-red-50 text-error hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              일괄 삭제
            </button>
            <button
              onClick={() => setSelectedPids(new Set())}
              className="font-body text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              선택 해제
            </button>
          </div>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-outline-variant/15">
        <table className="w-full font-body text-body-md">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-outline-variant/15 cursor-pointer"
                  title="현재 페이지 전체 선택"
                />
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider w-16 cursor-pointer select-none"
                onClick={() => handleSort('pid')}
              >
                PID
                <SortIcon field="pid" />
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                제목
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                작성자
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                상태
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('views')}
              >
                조회
                <SortIcon field="views" />
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('likeCount')}
              >
                좋아요
                <SortIcon field="likeCount" />
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                생성일
                <SortIcon field="createdAt" />
              </th>
              <th className="px-4 py-3 text-right font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/15">
            {loading && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-on-surface-variant">
                  로딩 중...
                </td>
              </tr>
            )}
            {!loading && data?.projects.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-on-surface-variant">
                  프로젝트가 없습니다.
                </td>
              </tr>
            )}
            {!loading &&
              data?.projects.map((project) => {
                const statusInfo = STATUS_MAP[project.status] ?? {
                  label: project.status,
                  color: 'bg-surface-container-high text-on-surface-variant',
                };
                return (
                  <tr
                    key={project._id}
                    className={`hover:bg-surface-bright cursor-pointer transition-colors ${
                      selectedPids.has(project.pid) ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedPid(project.pid)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedPids.has(project.pid)}
                        onChange={() => toggleSelect(project.pid)}
                        className="rounded border-outline-variant/15 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant font-mono font-body text-label-md">
                      {project.pid}
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="hover:text-primary hover:underline line-clamp-1">
                          {project.title}
                        </span>
                        {project.delYn && (
                          <span className="shrink-0 inline-flex px-1.5 py-0.5 rounded font-body text-label-md font-medium bg-error/10 text-error">
                            비활성
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant font-body text-label-md">
                      {project.ownerId ? (
                        <Link
                          href={`/profile/${project.ownerId._id}`}
                          target="_blank"
                          className="hover:text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.ownerId.nName}
                        </Link>
                      ) : (
                        <span className="text-on-surface-variant/60">알 수 없음</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{project.views}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{project.likeCount ?? 0}</td>
                    <td className="px-4 py-3 text-on-surface-variant font-body text-label-md">
                      {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(project)}
                        className="font-body text-label-md px-3 py-1 bg-error/10 text-error rounded hover:bg-error/20 transition-colors"
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
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
          >
            이전
          </button>
          <span className="px-3 py-1.5 font-body text-body-md text-on-surface-variant">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
          >
            다음
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
