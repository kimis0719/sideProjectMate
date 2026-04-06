'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';

interface AuditLogItem {
  _id: string;
  adminId: { _id: string; nName?: string; authorEmail: string } | null;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  detail: string;
  ip: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  'user.deactivate': '사용자 비활성화',
  'user.activate': '사용자 활성화',
  'user.role_change': '권한 변경',
  'user.bulk_deactivate': '사용자 벌크 비활성화',
  'project.deactivate': '프로젝트 비활성화',
  'project.activate': '프로젝트 재활성화',
  'project.delete': '프로젝트 영구 삭제',
  'project.bulk_deactivate': '프로젝트 벌크 비활성화',
  'project.bulk_delete': '프로젝트 벌크 삭제',
  'review.delete': '리뷰 삭제',
  'common_code.create': '공통 코드 생성',
  'common_code.update': '공통 코드 수정',
  'common_code.delete': '공통 코드 삭제',
  'tech_stack.create': '기술 스택 생성',
  'tech_stack.update': '기술 스택 수정',
  'tech_stack.delete': '기술 스택 삭제',
  'ai_settings.update': 'AI 설정 변경',
  'announcement.send': '공지사항 발송',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  user: '사용자',
  project: '프로젝트',
  review: '리뷰',
  'common-code': '공통 코드',
  'tech-stack': '기술 스택',
  'ai-settings': 'AI 설정',
  announcement: '공지사항',
};

const TARGET_TYPES = [
  '',
  'user',
  'project',
  'review',
  'common-code',
  'tech-stack',
  'ai-settings',
  'announcement',
];

const LIMIT = 50;

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [targetType, setTargetType] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (date) params.set('date', date);
      if (targetType) params.set('targetType', targetType);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setTotalPages(json.data.pagination.totalPages);
        setTotal(json.data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, date, targetType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-body text-label-md text-on-surface-variant">📅</span>
          <input
            type="date"
            value={date}
            max={toLocalDateString(new Date())}
            onChange={(e) => {
              setPage(1);
              setDate(e.target.value);
            }}
            className="bg-surface-container-lowest text-on-surface rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md"
          />
        </div>
        <select
          value={targetType}
          onChange={(e) => {
            setPage(1);
            setTargetType(e.target.value);
          }}
          className="bg-surface-container-lowest text-on-surface rounded-lg px-3 py-2 border border-outline-variant/15 focus:ring-2 focus:ring-primary/20 font-body text-body-md"
        >
          <option value="">대상: 전체</option>
          {TARGET_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {TARGET_TYPE_LABELS[t] || t}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <span className="font-body text-label-md text-on-surface-variant">총 {total}건</span>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead className="bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                시각
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                관리자
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                액션
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                대상
              </th>
              <th className="px-4 py-3 text-left font-body text-label-md font-semibold text-on-surface-variant tracking-wider">
                상세
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
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-on-surface-variant font-body text-body-md"
                >
                  {date ? `${date}에 기록된 로그가 없습니다.` : '로그가 없습니다.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log._id}>
                  <tr
                    className="hover:bg-surface-bright transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                  >
                    <td className="px-4 py-3 font-body text-label-md text-on-surface-variant font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      {log.adminId ? log.adminId.nName || log.adminId.authorEmail : log.adminEmail}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      {ACTION_LABELS[log.action] || log.action}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface">
                      <span className="font-body text-label-md text-on-surface-variant mr-1">
                        {TARGET_TYPE_LABELS[log.targetType] || log.targetType}
                      </span>
                      {log.targetLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-label-md text-primary">
                        {expandedId === log._id ? '접기 ↑' : '보기 →'}
                      </span>
                    </td>
                  </tr>
                  {expandedId === log._id && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-surface-container-low">
                        <div className="grid grid-cols-2 gap-3 font-body text-body-md max-w-2xl">
                          <div>
                            <span className="text-on-surface-variant">관리자:</span>{' '}
                            <span className="text-on-surface">
                              {log.adminId?.nName || ''} ({log.adminEmail})
                            </span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant">시각:</span>{' '}
                            <span className="text-on-surface">
                              {new Date(log.createdAt).toLocaleString('ko-KR')}
                            </span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant">액션:</span>{' '}
                            <span className="text-on-surface font-mono">{log.action}</span>
                          </div>
                          <div>
                            <span className="text-on-surface-variant">대상 ID:</span>{' '}
                            <span className="text-on-surface font-mono text-label-md">
                              {log.targetId}
                            </span>
                          </div>
                          {log.detail && (
                            <div className="col-span-2">
                              <span className="text-on-surface-variant">상세:</span>{' '}
                              <span className="text-on-surface">{log.detail}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-on-surface-variant">IP:</span>{' '}
                            <span className="text-on-surface font-mono">{log.ip}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
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
    </div>
  );
}
