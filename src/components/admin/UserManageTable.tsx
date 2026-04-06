'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useModal } from '@/hooks/useModal';
import AdminUserDetailModal from '@/components/admin/AdminUserDetailModal';

interface AdminUser {
  _id: string;
  uid: number;
  nName: string;
  authorEmail: string;
  memberType: 'user' | 'admin';
  delYn: boolean;
  createdAt: string;
  avatarUrl?: string;
}

interface PaginatedResult {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

export default function UserManageTable() {
  const { confirm, alert } = useModal();
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sortBy: sortField,
        order: sortOrder,
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [page, search, sortField, sortOrder]);

  useEffect(() => {
    fetchUsers();
    setSelectedIds(new Set()); // 페이지 변경 시 선택 초기화
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const patchUser = async (id: string, body: Partial<AdminUser>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      setData((prev) =>
        prev
          ? { ...prev, users: prev.users.map((u) => (u._id === id ? { ...u, ...json.data } : u)) }
          : prev
      );
    } else {
      await alert('오류', json.message);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    const action = user.delYn ? '활성화' : '비활성화';
    const ok = await confirm(
      `${action} 확인`,
      `${user.nName || user.authorEmail} 계정을 ${action}하시겠습니까?`,
      { confirmText: action, isDestructive: !user.delYn }
    );
    if (!ok) return;
    await patchUser(user._id, { delYn: !user.delYn });
  };

  // 체크박스 토글
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const currentPageIds = data?.users.map((u) => u._id) ?? [];
  const allCurrentSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  // 일괄 비활성화/활성화
  const handleBulkToggle = async (delYn: boolean) => {
    const ids = Array.from(selectedIds);
    const action = delYn ? '비활성화' : '활성화';
    const ok = await confirm(
      `일괄 ${action}`,
      `선택한 ${ids.length}명의 계정을 ${action}하시겠습니까?`,
      { confirmText: action, isDestructive: delYn }
    );
    if (!ok) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, delYn }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedIds(new Set());
        await fetchUsers();
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
      {selectedUserId && (
        <AdminUserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdated={fetchUsers}
        />
      )}

      {/* 검색 & 일괄 액션 바 */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <input
            className="bg-surface-container-lowest text-on-surface border border-outline-variant/15 rounded-lg px-3 py-2 font-body text-body-md w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="이름 또는 이메일 검색"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {data && (
            <span className="font-body text-body-md text-on-surface-variant">
              {rangeStart}–{rangeEnd} / 총 <strong>{data.total}</strong>명
            </span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-body text-body-md text-on-surface-variant">
              <strong className="text-on-surface">{selectedIds.size}명</strong> 선택됨
            </span>
            <button
              onClick={() => handleBulkToggle(true)}
              disabled={bulkLoading}
              className="font-body text-label-md px-3 py-1.5 rounded-lg bg-error-container text-on-error-container hover:bg-error-container/80 transition-colors disabled:opacity-50"
            >
              일괄 비활성화
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              disabled={bulkLoading}
              className="font-body text-label-md px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              일괄 활성화
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
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
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('uid')}
              >
                UID
                <SortIcon field="uid" />
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                이름
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                이메일
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                권한
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                상태
              </th>
              <th
                className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                가입일
                <SortIcon field="createdAt" />
              </th>
              <th className="px-4 py-3 text-right font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-on-surface-variant">
                  로딩 중...
                </td>
              </tr>
            )}
            {!loading && data?.users.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-on-surface-variant">
                  사용자가 없습니다.
                </td>
              </tr>
            )}
            {!loading &&
              data?.users.map((user) => (
                <tr
                  key={user._id}
                  className={`hover:bg-surface-bright cursor-pointer transition-colors ${
                    selectedIds.has(user._id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedUserId(user._id)}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user._id)}
                      onChange={() => toggleSelect(user._id)}
                      className="rounded border-outline-variant/15 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant font-mono font-body text-label-md">
                    {user.uid}
                  </td>
                  <td className="px-4 py-3 font-medium text-on-surface">
                    <span className="hover:text-blue-600 hover:underline">
                      {user.nName || '(이름 없음)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{user.authorEmail}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-body text-label-md font-medium ${
                        user.memberType === 'admin'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {user.memberType === 'admin' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-body text-label-md font-medium ${
                        user.delYn
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {user.delYn ? '비활성' : '활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant font-body text-label-md">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`font-body text-label-md px-3 py-1 rounded transition-colors ${
                        user.delYn
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-error-container text-on-error-container hover:bg-error-container/80'
                      }`}
                    >
                      {user.delYn ? '활성화' : '비활성화'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="px-3 py-1.5 font-body text-body-md text-on-surface-variant">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2 py-1.5 font-body text-body-md border border-outline-variant/15 rounded text-on-surface-variant hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
