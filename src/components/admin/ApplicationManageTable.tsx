'use client';

import { useEffect, useState, useCallback } from 'react';

interface ApplicationItem {
  _id: string;
  applicantId: { _id: string; nName?: string; authorEmail: string; avatarUrl?: string } | null;
  projectId: { _id: string; title: string; pid: number } | null;
  motivation: string;
  weeklyHours: number;
  message?: string;
  ownerNote?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  all: number;
  pending: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기중' },
  { key: 'accepted', label: '수락' },
  { key: 'rejected', label: '거절' },
  { key: 'withdrawn', label: '철회' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '대기중', color: 'text-amber-600 bg-amber-50' },
  accepted: { label: '수락', color: 'text-emerald-600 bg-emerald-50' },
  rejected: { label: '거절', color: 'text-error bg-error-container' },
  withdrawn: { label: '철회', color: 'text-on-surface-variant bg-surface-container-high' },
};

const LIMIT = 20;

export default function ApplicationManageTable() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-on-surface-variant/50">
      {sortField === field ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status: statusFilter,
        search,
      });
      const res = await fetch(`/api/admin/applications?${params}`);
      const json = await res.json();
      if (json.success) {
        setApplications(json.data.applications);
        setTotalPages(json.data.pagination.totalPages);
        setTotal(json.data.pagination.total);
        setStatusCounts(json.data.statusCounts);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setPage(1);
    setSearch(inputValue);
  };

  const handleFilterChange = (key: string) => {
    setPage(1);
    setStatusFilter(key);
  };

  return (
    <div className="space-y-4">
      {/* 필터 + 검색 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={`px-4 py-2 rounded-lg font-body text-body-md transition-colors ${
                statusFilter === key
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {label}{' '}
              {statusCounts[key as keyof StatusCounts] > 0 && (
                <span className="ml-1 font-body text-label-md">
                  {statusCounts[key as keyof StatusCounts]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <input
            className="bg-surface-container-lowest text-on-surface rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 focus:border-primary font-body text-body-md w-56"
            placeholder="지원자명 또는 프로젝트명"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-body text-body-md"
          >
            검색
          </button>
        </div>
      </div>

      {/* 범위 표시 */}
      <p className="font-body text-label-md text-on-surface-variant">
        총 {total}건{search && ` (검색: "${search}")`}
      </p>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead className="bg-surface-container-low">
            <tr>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('applicant')}
              >
                지원자
                <SortIcon field="applicant" />
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('project')}
              >
                프로젝트
                <SortIcon field="project" />
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                상태
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                주당시간
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                지원일
                <SortIcon field="createdAt" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-lowest divide-y divide-outline-variant/15">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-on-surface-variant font-body text-body-md"
                >
                  불러오는 중...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-on-surface-variant font-body text-body-md"
                >
                  지원서가 없습니다.
                </td>
              </tr>
            ) : (
              [...applications]
                .sort((a, b) => {
                  const mul = sortOrder === 'asc' ? 1 : -1;
                  if (sortField === 'applicant') {
                    const aName = (
                      a.applicantId?.nName ||
                      a.applicantId?.authorEmail ||
                      ''
                    ).toLowerCase();
                    const bName = (
                      b.applicantId?.nName ||
                      b.applicantId?.authorEmail ||
                      ''
                    ).toLowerCase();
                    return aName.localeCompare(bName) * mul;
                  }
                  if (sortField === 'project') {
                    const aTitle = (a.projectId?.title || '').toLowerCase();
                    const bTitle = (b.projectId?.title || '').toLowerCase();
                    return aTitle.localeCompare(bTitle) * mul;
                  }
                  if (sortField === 'createdAt')
                    return (
                      (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mul
                    );
                  return 0;
                })
                .map((app) => {
                  const statusInfo = STATUS_MAP[app.status] ?? {
                    label: app.status,
                    color: 'text-on-surface-variant bg-surface-container-high',
                  };
                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-surface-bright transition-colors cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-4 py-3 font-body text-body-md text-on-surface">
                        {app.applicantId?.nName || app.applicantId?.authorEmail || '(알 수 없음)'}
                      </td>
                      <td className="px-4 py-3 font-body text-body-md text-on-surface">
                        {app.projectId ? (
                          <span>
                            {app.projectId.title}
                            <span className="ml-1 font-body text-label-md text-on-surface-variant">
                              #{app.projectId.pid}
                            </span>
                          </span>
                        ) : (
                          '(삭제됨)'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body text-body-md text-on-surface-variant">
                        {app.weeklyHours}시간
                      </td>
                      <td className="px-4 py-3 font-body text-label-md text-on-surface-variant">
                        {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <span className="px-3 py-1.5 font-body text-body-md text-on-surface">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg font-body text-body-md border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedApp && (
        <ApplicationDetailModal application={selectedApp} onClose={() => setSelectedApp(null)} />
      )}
    </div>
  );
}

function ApplicationDetailModal({
  application: app,
  onClose,
}: {
  application: ApplicationItem;
  onClose: () => void;
}) {
  const statusInfo = STATUS_MAP[app.status] ?? {
    label: app.status,
    color: 'text-on-surface-variant bg-surface-container-high',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-[16px] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-container-lowest rounded-lg shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="font-body text-body-md font-semibold text-on-surface">지원서 상세</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 상태 뱃지 */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex px-2.5 py-1 rounded font-body text-label-md font-medium ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
            <span className="font-body text-label-md text-on-surface-variant">
              {new Date(app.createdAt).toLocaleString('ko-KR')}
            </span>
          </div>

          {/* 지원자 */}
          <div>
            <p className="font-body text-label-md text-on-surface-variant mb-1">지원자</p>
            <p className="font-body text-body-md text-on-surface font-medium">
              {app.applicantId?.nName || '(이름 없음)'}
            </p>
            <p className="font-body text-label-md text-on-surface-variant">
              {app.applicantId?.authorEmail || ''}
            </p>
          </div>

          {/* 프로젝트 */}
          <div>
            <p className="font-body text-label-md text-on-surface-variant mb-1">프로젝트</p>
            {app.projectId ? (
              <a
                href={`/projects/${app.projectId.pid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-body-md text-primary hover:underline"
              >
                {app.projectId.title} #{app.projectId.pid}
              </a>
            ) : (
              <p className="font-body text-body-md text-on-surface-variant">(삭제된 프로젝트)</p>
            )}
          </div>

          {/* 주당 가용 시간 */}
          <div>
            <p className="font-body text-label-md text-on-surface-variant mb-1">주당 가용 시간</p>
            <p className="font-body text-body-md text-on-surface">{app.weeklyHours}시간</p>
          </div>

          {/* 지원 동기 */}
          <div>
            <p className="font-body text-label-md text-on-surface-variant mb-1">지원 동기</p>
            <p className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
              {app.motivation}
            </p>
          </div>

          {/* 메시지 */}
          {app.message && (
            <div>
              <p className="font-body text-label-md text-on-surface-variant mb-1">추가 메시지</p>
              <p className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                {app.message}
              </p>
            </div>
          )}

          {/* 오너 메모 */}
          {app.ownerNote && (
            <div>
              <p className="font-body text-label-md text-on-surface-variant mb-1">
                프로젝트 오너 메모
              </p>
              <p className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                {app.ownerNote}
              </p>
            </div>
          )}

          {/* 시간 정보 */}
          {app.updatedAt !== app.createdAt && (
            <div>
              <p className="font-body text-label-md text-on-surface-variant">
                마지막 변경: {new Date(app.updatedAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end px-6 py-4 border-t border-outline-variant/15 bg-surface-container-low">
          <button
            onClick={onClose}
            className="px-4 py-2 font-body text-body-md bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-high/70 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
