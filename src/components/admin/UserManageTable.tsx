'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useModal } from '@/hooks/useModal';

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

export default function UserManageTable() {
  const { confirm, alert } = useModal();
  const [data, setData] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
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
          ? {
              ...prev,
              users: prev.users.map((u) => (u._id === id ? { ...u, ...json.data } : u)),
            }
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
      `${user.nName}(${user.authorEmail}) 계정을 ${action}하시겠습니까?`,
      { confirmText: action, isDestructive: !user.delYn }
    );
    if (!ok) return;
    await patchUser(user._id, { delYn: !user.delYn });
  };

  const handleToggleAdmin = async (user: AdminUser) => {
    const isAdmin = user.memberType === 'admin';
    const action = isAdmin ? '일반 사용자로 변경' : '관리자 권한 부여';
    const ok = await confirm(
      `권한 변경`,
      `${user.nName}(${user.authorEmail})을(를) ${action}하시겠습니까?`,
      { confirmText: action, isDestructive: isAdmin }
    );
    if (!ok) return;
    await patchUser(user._id, { memberType: isAdmin ? 'user' : 'admin' });
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div>
      {/* 검색 */}
      <div className="mb-4 flex gap-3 items-center">
        <input
          className="border border-border bg-background text-foreground rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="이름 또는 이메일 검색"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        {data && (
          <span className="text-sm text-muted-foreground">
            총 <strong>{data.total}</strong>명
          </span>
        )}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">UID</th>
              <th className="px-4 py-3 text-left font-medium">이름</th>
              <th className="px-4 py-3 text-left font-medium">이메일</th>
              <th className="px-4 py-3 text-left font-medium">권한</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">가입일</th>
              <th className="px-4 py-3 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </td>
              </tr>
            )}
            {!loading && data?.users.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  사용자가 없습니다.
                </td>
              </tr>
            )}
            {!loading &&
              data?.users.map((user) => (
                <tr key={user._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{user.uid}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link
                      href={`/profile/${user._id}`}
                      target="_blank"
                      className="hover:text-blue-600 hover:underline"
                    >
                      {user.nName || '(이름 없음)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.authorEmail}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.memberType === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.memberType === 'admin' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.delYn
                          ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                          : 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      }`}
                    >
                      {user.delYn ? '비활성' : '활성'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${
                          user.delYn
                            ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50'
                            : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50'
                        }`}
                      >
                        {user.delYn ? '활성화' : '비활성화'}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className={`text-xs px-3 py-1 rounded transition-colors ${
                          user.memberType === 'admin'
                            ? 'bg-muted text-muted-foreground hover:bg-muted/70'
                            : 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50'
                        }`}
                      >
                        {user.memberType === 'admin' ? '권한 해제' : '관리자 지정'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
