'use client';

import { useEffect } from 'react';
import { useBoardStore } from '@/store/boardStore';
import { useExecutionResultStore } from '@/store/executionResultStore';

export default function ExecutionResultConfirm() {
  const confirmData = useExecutionResultStore((s) => s.confirmData);
  const close = useExecutionResultStore((s) => s.close);
  const completeNote = useBoardStore((s) => s.completeNote);

  // autoCompleted 노트들의 로컬 상태 + socket 업데이트
  // API가 DB는 이미 업데이트했으므로, 여기서는 boardStore 동기화만 담당
  useEffect(() => {
    if (!confirmData) return;
    for (const { noteId } of confirmData.autoCompleted) {
      const result = confirmData.parsed.completedNotes.find((n) => n.noteId === noteId);
      completeNote(noteId, result?.summary ?? '');
    }
    // completeNote는 stable ref이므로 dependency 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmData]);

  if (!confirmData) return null;

  const { autoCompleted, requiresConfirmation, parsed } = confirmData;

  const handleConfirmNote = async (noteId: string, summary: string) => {
    await completeNote(noteId, summary);
  };

  return (
    <div className="space-y-4">
      {/* 자동 완료 목록 */}
      {autoCompleted.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            자동 완료 처리 ({autoCompleted.length}건)
          </p>
          <ul className="space-y-1.5">
            {autoCompleted.map(({ noteId }) => {
              const result = parsed.completedNotes.find((n) => n.noteId === noteId);
              return (
                <li
                  key={noteId}
                  className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <span className="text-green-600 dark:text-green-400 mt-0.5 shrink-0">✓</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {result?.noteTitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
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
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            확인 필요 ({requiresConfirmation.length}건)
          </p>
          <ul className="space-y-2">
            {requiresConfirmation.map(({ noteId, noteTitle, agentStatus, summary }) => (
              <li
                key={noteId}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium uppercase">
                    {agentStatus === 'partial' ? '부분 완료' : '실패'}
                  </span>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {noteTitle}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                  {summary}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmNote(noteId, summary)}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    완료처리
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    유지
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
        {parsed.testsResult && (
          <span>
            테스트:{' '}
            <span
              className={
                parsed.testsResult === 'pass'
                  ? 'text-green-600 dark:text-green-400'
                  : parsed.testsResult === 'fail'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500'
              }
            >
              {parsed.testsResult}
            </span>
          </span>
        )}
        {parsed.filesChanged?.length ? <span>변경 파일 {parsed.filesChanged.length}개</span> : null}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={close}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  );
}
