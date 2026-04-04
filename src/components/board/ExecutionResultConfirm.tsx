'use client';

import { useEffect } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { useExecutionResultStore } from '@/store/executionResultStore';

export default function ExecutionResultConfirm() {
  const confirmData = useExecutionResultStore((s) => s.confirmData);
  const close = useExecutionResultStore((s) => s.close);
  const completeNote = useBoardStore((s) => s.completeNote);

  useEffect(() => {
    if (!confirmData) return;
    for (const { noteId } of confirmData.autoCompleted) {
      const result = confirmData.parsed.completedNotes.find((n) => n.noteId === noteId);
      completeNote(noteId, result?.summary ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmData]);

  if (!confirmData) return null;

  const { autoCompleted, requiresConfirmation, parsed } = confirmData;

  const handleConfirmNote = async (noteId: string, summary: string) => {
    await completeNote(noteId, summary);
  };

  return (
    <div className="space-y-6">
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
            {requiresConfirmation.map(({ noteId, noteTitle, agentStatus, summary }) => (
              <li key={noteId} className="p-4 bg-tertiary-fixed/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-tertiary text-xs font-bold uppercase">
                    {agentStatus === 'partial' ? '부분 완료' : '실패'}
                  </span>
                  <p className="text-sm font-medium text-on-surface truncate">{noteTitle}</p>
                </div>
                <p className="text-xs text-on-surface-variant mb-3 line-clamp-2">{summary}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmNote(noteId, summary)}
                    className="px-4 py-1.5 text-xs font-semibold bg-primary-container text-on-primary rounded-lg hover:bg-primary transition-colors"
                  >
                    완료처리
                  </button>
                  <button className="px-4 py-1.5 text-xs font-semibold bg-surface-container-low text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors">
                    유지
                  </button>
                </div>
              </li>
            ))}
          </ul>
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
