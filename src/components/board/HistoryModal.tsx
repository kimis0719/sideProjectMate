'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { useExecutionResultStore } from '@/store/executionResultStore';

interface HistoryItem {
  _id: string;
  preset: string;
  target: { type: string; sectionIds?: string[]; noteIds?: string[] };
  additionalInstruction?: string;
  resultMarkdown: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  modelName: string;
  creatorId?: { name?: string; nName?: string; avatarUrl?: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function HistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const boardId = useBoardStore((s) => s.boardId);
  const activeNotes = useBoardStore((s) => s.notes);
  const openExecutionResult = useExecutionResultStore((s) => s.open);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (page = 1) => {
      if (!boardId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/ai/history?boardId=${boardId}&page=${page}&limit=10`);
        const json = await res.json();
        if (json.success) {
          setItems(json.data.items);
          setPagination(json.data.pagination);
        }
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setExpandedId(null);
    }
  }, [isOpen, fetchHistory]);

  const handleCopy = async (id: string, markdown: string) => {
    await navigator.clipboard.writeText(markdown);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: HistoryItem) => {
    const blob = new Blob([item.resultMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instruction-${item.preset || 'general'}-${new Date(item.createdAt).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString('ko-KR');
  };

  // 연관 노트가 모두 완료되었는지 확인 (active 노트가 하나도 없으면 true)
  const isAllNotesCompleted = (target: HistoryItem['target']): boolean => {
    const activeIds = new Set(activeNotes.map((n) => n.id));
    if (target.type === 'notes') {
      return (target.noteIds ?? []).every((id) => !activeIds.has(id));
    }
    if (target.type === 'all') {
      return activeNotes.length === 0;
    }
    // sections: active 노트 중 해당 섹션 소속이 없으면 완료로 간주
    if (target.type === 'sections') {
      const sectionSet = new Set(target.sectionIds ?? []);
      return !activeNotes.some((n) => n.sectionId && sectionSet.has(n.sectionId));
    }
    return false;
  };

  const targetLabel = (target: HistoryItem['target']) => {
    if (target.type === 'all') return '보드 전체';
    if (target.type === 'sections') return `섹션 ${target.sectionIds?.length ?? 0}개`;
    return `노트 ${target.noteIds?.length ?? 0}개`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">지시서 히스토리</h2>
            {pagination && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                총 {pagination.total}건
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && items.length === 0 && (
            <div className="text-center py-12 text-gray-400">불러오는 중...</div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 dark:text-gray-500">생성된 지시서가 없습니다.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                보드 헤더의 &ldquo;지시서&rdquo; 버튼으로 첫 지시서를 생성해보세요.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item) => {
              const isExpanded = expandedId === item._id;
              const creatorName = item.creatorId?.nName || item.creatorId?.name || '알 수 없음';

              return (
                <div
                  key={item._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* 카드 헤더 */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item._id)}
                    className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left
                               hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.preset && (
                          <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded text-xs font-medium">
                            {item.preset}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {targetLabel(item.target)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{creatorName}</span>
                        <span>·</span>
                        <span>{formatDate(item.createdAt)}</span>
                        <span>·</span>
                        <span className="text-blue-500">{item.modelName}</span>
                        <span>·</span>
                        <span>
                          {item.inputTokens.toLocaleString()}/{item.outputTokens.toLocaleString()}{' '}
                          토큰
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs mt-1 shrink-0">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* 펼친 내용 */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 max-h-72 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                          {item.resultMarkdown}
                        </pre>
                      </div>
                      <div className="px-4 py-2 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <button
                          onClick={() => handleCopy(item._id, item.resultMarkdown)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300
                                     bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {copiedId === item._id ? '복사됨!' : '복사'}
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300
                                     bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          MD 다운로드
                        </button>
                        {(() => {
                          const allDone = isAllNotesCompleted(item.target);
                          return (
                            <button
                              onClick={() => {
                                if (!boardId || allDone) return;
                                openExecutionResult(boardId, item._id);
                                onClose();
                              }}
                              disabled={allDone}
                              title={allDone ? '연관 노트가 모두 완료되었습니다' : '실행결과 보고'}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                                         bg-green-600 text-white hover:bg-green-700
                                         disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-200
                                         disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                            >
                              {allDone ? '완료됨' : '결과 보고'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => fetchHistory(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800
                           rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                이전
              </button>
              <span className="text-xs text-gray-500">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchHistory(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800
                           rounded-lg disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
