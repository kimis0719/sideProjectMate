'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { useExecutionResultStore } from '@/store/executionResultStore';

export default function ExecutionResultConfirm() {
  const confirmData = useExecutionResultStore((s) => s.confirmData);
  const close = useExecutionResultStore((s) => s.close);
  const completeNote = useBoardStore((s) => s.completeNote);
  const notes = useBoardStore((s) => s.notes);

  const [processed, setProcessed] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!confirmData) return;
    for (const { noteId } of confirmData.autoCompleted) {
      const result = confirmData.parsed.completedNotes.find((n) => n.noteId === noteId);
      completeNote(noteId, result?.summary ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmData]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  if (!confirmData) return null;

  const { autoCompleted, requiresConfirmation, parsed } = confirmData;
  const pendingConfirmation = requiresConfirmation.filter(({ noteId }) => !processed.has(noteId));

  const handleComplete = async (noteId: string, summary: string) => {
    setLoading((prev) => new Set(prev).add(noteId));
    try {
      await completeNote(noteId, summary);
      setProcessed((prev) => new Set(prev).add(noteId));
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  const handleKeep = async (noteId: string, summary: string) => {
    setLoading((prev) => new Set(prev).add(noteId));
    try {
      const today = new Date().toISOString().slice(0, 10);
      const note = notes.find((n) => n.id === noteId);

      // completionNote: 기존 값에 append (히스토리 보존용)
      const existingCompletion = note?.completionNote;
      const newCompletionNote = existingCompletion
        ? `${existingCompletion}\n[유지 - ${today}] ${summary}`
        : `[유지 - ${today}] ${summary}`;

      // text: 노트 카드에 바로 보이도록 append
      const existingText = note?.text ?? '';
      const newText = `${existingText}\n\n[유지 - ${today}] ${summary}`;

      const res = await fetch(`/api/kanban/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionNote: newCompletionNote, text: newText }),
      });

      if (res.ok) {
        // 로컬 스토어 갱신 — 노트 카드 즉시 반영 + 이후 completeNote 시 유지 기록 보존
        useBoardStore.setState((state) => ({
          notes: state.notes.map((n) =>
            n.id === noteId ? { ...n, text: newText, completionNote: newCompletionNote } : n
          ),
        }));
        setProcessed((prev) => new Set(prev).add(noteId));
        showToast('메모에 기록되었습니다');
      } else {
        showToast('기록에 실패했습니다');
      }
    } catch {
      showToast('기록에 실패했습니다');
    } finally {
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 토스트 */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] px-5 py-2.5 bg-on-surface text-surface rounded-xl text-sm font-medium shadow-lg animate-fade-in-up">
          {toastMsg}
        </div>
      )}

      {/* 자동 완료 목록 */}
      {autoCompleted.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            자동 완료 처리 ({autoCompleted.length}건)
          </p>
          <ul className="space-y-2">
            {autoCompleted.map(({ noteId }) => {
              const result = parsed.completedNotes.find((n) => n.noteId === noteId);
              return (
                <li
                  key={noteId}
                  className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg"
                >
                  <span
                    className="material-symbols-outlined text-emerald-600 mt-0.5 shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {result?.noteTitle}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
                      {result?.summary}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 확인 필요 목록 */}
      {requiresConfirmation.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            확인 필요 ({requiresConfirmation.length}건)
          </p>
          <ul className="space-y-2">
            {requiresConfirmation.map(({ noteId, noteTitle, agentStatus, summary }) => {
              const isDone = processed.has(noteId);
              const isLoading = loading.has(noteId);

              return (
                <li
                  key={noteId}
                  className={`p-4 rounded-lg transition-opacity duration-300 ${
                    isDone
                      ? 'opacity-0 pointer-events-none h-0 overflow-hidden p-0 m-0'
                      : 'bg-tertiary-fixed/20 opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-tertiary text-xs font-bold uppercase">
                      {agentStatus === 'partial' ? '부분 완료' : '실패'}
                    </span>
                    <p className="text-sm font-medium text-on-surface truncate">{noteTitle}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{summary}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleComplete(noteId, summary)}
                      disabled={isLoading}
                      className="px-4 py-1.5 text-xs font-semibold bg-primary-container text-on-primary rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '처리 중...' : '완료처리'}
                    </button>
                    <button
                      onClick={() => handleKeep(noteId, summary)}
                      disabled={isLoading}
                      className="px-4 py-1.5 text-xs font-semibold bg-surface-container-low text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? '처리 중...' : '유지'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {pendingConfirmation.length === 0 && requiresConfirmation.length > 0 && (
            <p className="text-xs text-on-surface-variant/60 text-center mt-2">
              모든 항목이 처리되었습니다.
            </p>
          )}
        </div>
      )}

      {/* 추가 정보 */}
      <div className="flex items-center gap-4 text-xs text-on-surface-variant pt-1">
        {parsed.testsResult && (
          <span>
            테스트:{' '}
            <span
              className={
                parsed.testsResult === 'pass'
                  ? 'text-emerald-600 font-semibold'
                  : parsed.testsResult === 'fail'
                    ? 'text-error font-semibold'
                    : 'text-on-surface-variant'
              }
            >
              {parsed.testsResult}
            </span>
          </span>
        )}
        {parsed.filesChanged?.length ? <span>변경 파일 {parsed.filesChanged.length}개</span> : null}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={close}
          className="px-6 py-2.5 bg-primary-container text-on-primary rounded-lg text-sm font-bold hover:bg-primary transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  );
}
