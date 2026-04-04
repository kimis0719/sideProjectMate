'use client';

import { useExecutionResultStore } from '@/store/executionResultStore';
import ExecutionResultConfirm from './ExecutionResultConfirm';

export default function ExecutionResultModal() {
  const { isOpen, step, rawInput, isProcessing, error, setRawInput, submit, close } =
    useExecutionResultStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {step === 'input' ? '실행결과 보고' : '파싱 결과 확인'}
          </h2>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'input' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Agent(Claude Code, Cursor 등)의 실행결과를 붙여넣으세요.
                <br />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  spm-result 코드블록 또는 JSON 형식을 자동으로 파싱합니다.
                </span>
              </p>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm
                           font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`\`\`\`spm-result\n{\n  "instructionId": "...",\n  "completedNotes": [...]\n}\n\`\`\``}
              />
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <ExecutionResultConfirm />
          )}
        </div>

        {/* 푸터 (input 단계에서만 표시) */}
        {step === 'input' && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              onClick={close}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={isProcessing || !rawInput.trim()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? '파싱 중...' : '파싱 & 완료처리'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
