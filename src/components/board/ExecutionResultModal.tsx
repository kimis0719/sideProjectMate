'use client';

import { useExecutionResultStore } from '@/store/executionResultStore';
import ExecutionResultConfirm from './ExecutionResultConfirm';

export default function ExecutionResultModal() {
  const { isOpen, step, rawInput, isProcessing, error, setRawInput, submit, close } =
    useExecutionResultStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-on-surface/10 backdrop-blur-md">
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.08)] w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-bold font-headline text-on-surface tracking-tight">
            {step === 'input' ? '실행결과 보고' : '파싱 결과 확인'}
          </h2>
          <button
            onClick={close}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'input' ? (
            <div className="space-y-3">
              <p className="text-sm text-on-surface-variant">
                Agent(Claude Code, Cursor 등)의 실행결과를 붙여넣으세요.
                <br />
                <span className="text-xs text-on-surface-variant/50">
                  spm-result 코드블록 또는 JSON 형식을 자동으로 파싱합니다.
                </span>
              </p>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl
                           text-on-surface text-sm font-mono resize-y
                           focus:outline-none focus:ring-2 focus:ring-primary-container/20"
                placeholder={`\`\`\`spm-result\n{\n  "instructionId": "...",\n  "completedNotes": [...]\n}\n\`\`\``}
              />
              {error && (
                <div className="p-3 bg-error-container/40 text-on-error-container rounded-lg text-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-0.5">warning</span>
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <ExecutionResultConfirm />
          )}
        </div>

        {/* 푸터 (input 단계에서만) */}
        {step === 'input' && (
          <div className="px-6 py-4 bg-surface-container-low/50 flex justify-end gap-3">
            <button
              onClick={close}
              className="px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={isProcessing || !rawInput.trim()}
              className="px-6 py-2.5 bg-primary-container text-on-primary rounded-lg text-sm font-bold
                         hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? '파싱 중...' : '파싱 & 완료처리'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
