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

  const isAllNotesCompleted = (target: HistoryItem['target']): boolean => {
    const activeIds = new Set(activeNotes.map((n) => n.id));
    if (target.type === 'notes') {
      return (target.noteIds ?? []).every((id) => !activeIds.has(id));
    }
    if (target.type === 'all') {
      return activeNotes.length === 0;
    }
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface/40 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-surface-container-lowest rounded-xl flex flex-col overflow-hidden shadow-[0_20px_40px_rgba(26,28,28,0.06)] mx-4">
        {/* 헤더 */}
        <header className="bg-surface/80 backdrop-blur-xl flex justify-between items-center w-full px-6 py-4 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-on-surface font-headline tracking-tight">
              지시서 히스토리
            </h1>
            {pagination && (
              <p className="text-xs text-on-surface-variant mt-0.5">총 {pagination.total}건</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:bg-surface-container-low transition-colors p-2 rounded-lg"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </header>

        {/* 본문 */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {loading && items.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">불러오는 중...</div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-on-surface-variant">생성된 지시서가 없습니다.</p>
              <p className="text-xs text-on-surface-variant/50 mt-1">
                보드 헤더의 &ldquo;지시서&rdquo; 버튼으로 첫 지시서를 생성해보세요.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {items.map((item) => {
              const isExpanded = expandedId === item._id;
              const creatorName = item.creatorId?.nName || item.creatorId?.name || '알 수 없음';
              const allDone = isAllNotesCompleted(item.target);

              return (
                <section
                  key={item._id}
                  className={`rounded-xl overflow-hidden ${
                    isExpanded
                      ? 'bg-surface-container-low'
                      : 'bg-surface-container-low/60 hover:bg-surface-container-low'
                  } transition-colors`}
                >
                  {/* 카드 헤더 */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item._id)}
                    className="w-full p-6 flex flex-col gap-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.preset && (
                          <span className="bg-emerald-500/10 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                            {item.preset}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                          <span className="material-symbols-outlined text-sm">segment</span>
                          <span className="font-medium">{targetLabel(item.target)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs font-medium">
                        <span>{creatorName}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-tighter">
                            Model
                          </span>
                          <span className="text-sm font-semibold text-primary-container">
                            {item.modelName}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-outline-variant/30" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-tighter">
                            Tokens
                          </span>
                          <span className="text-sm font-semibold text-on-surface">
                            {item.inputTokens.toLocaleString()} /{' '}
                            {item.outputTokens.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant/40">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </button>

                  {/* 펼친 내용 */}
                  {isExpanded && (
                    <>
                      <div className="mx-6 mb-6 p-6 bg-surface-container-lowest rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm text-on-surface font-mono leading-relaxed max-h-72 overflow-y-auto">
                          {item.resultMarkdown}
                        </pre>
                      </div>
                      <div className="px-6 py-4 bg-surface-container-high/50 flex justify-end gap-3">
                        <button
                          onClick={() => handleCopy(item._id, item.resultMarkdown)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-container hover:bg-surface-container-high transition-colors rounded-lg"
                        >
                          <span className="material-symbols-outlined text-lg">content_copy</span>
                          {copiedId === item._id ? '복사됨!' : '복사'}
                        </button>
                        <button
                          onClick={() => handleDownload(item)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-container text-on-primary hover:bg-primary transition-all rounded-lg shadow-sm"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                          MD 다운로드
                        </button>
                        <button
                          onClick={() => {
                            if (!boardId || allDone) return;
                            openExecutionResult(boardId, item._id);
                            onClose();
                          }}
                          disabled={allDone}
                          title={allDone ? '연관 노트가 모두 완료되었습니다' : '실행결과 보고'}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                            allDone
                              ? 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed'
                              : 'bg-primary-container text-on-primary hover:bg-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">task_alt</span>
                          {allDone ? '완료됨' : '결과 보고'}
                        </button>
                      </div>
                    </>
                  )}
                </section>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-outline-variant/10">
              <button
                onClick={() => fetchHistory(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low rounded-lg disabled:opacity-40 hover:bg-surface-container-high transition-colors"
              >
                이전
              </button>
              <span className="text-xs text-on-surface-variant">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchHistory(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low rounded-lg disabled:opacity-40 hover:bg-surface-container-high transition-colors"
              >
                다음
              </button>
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-xs text-on-surface-variant/40 font-medium">
              최근 30일간의 히스토리만 보관됩니다.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
