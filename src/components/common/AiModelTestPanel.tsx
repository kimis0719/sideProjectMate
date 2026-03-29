'use client';

import { useState, useCallback } from 'react';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface TestResult {
  status: 'connected' | 'rate_limited' | 'not_found' | 'auth_error' | 'error' | 'unsupported';
  message: string;
}

interface AiModelTestPanelProps {
  provider: string;
  models: Array<{ modelName: string; priority: number }>;
  compact?: boolean; // 모달 내 축소 표시
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  connected: {
    label: '정상',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  rate_limited: {
    label: '할당량 초과',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
  },
  not_found: {
    label: '모델 없음',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
  auth_error: {
    label: 'API 키 오류',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
  error: {
    label: '오류',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
  },
  unsupported: { label: '미지원', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500' },
};

export default function AiModelTestPanel({
  provider,
  models,
  compact = false,
}: AiModelTestPanelProps) {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testingAll, setTestingAll] = useState(false);

  const testModel = useCallback(
    async (modelName: string) => {
      setResults((prev) => ({
        ...prev,
        [modelName]: { status: 'connected', message: '테스트 중...' },
      }));
      try {
        const res = await fetch('/api/admin/ai-settings/check-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, modelName }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setResults((prev) => ({ ...prev, [modelName]: json.data }));
        }
      } catch {
        setResults((prev) => ({
          ...prev,
          [modelName]: { status: 'error', message: '네트워크 오류' },
        }));
      }
    },
    [provider]
  );

  const testAll = async () => {
    setTestingAll(true);
    for (const m of models) {
      await testModel(m.modelName);
    }
    setTestingAll(false);
  };

  const activeModels = models.filter((m) => m.modelName);
  if (activeModels.length === 0) return null;

  return (
    <div className={`${compact ? 'p-3' : 'p-4'} bg-gray-50 dark:bg-gray-800/50 rounded-lg`}>
      <div className="flex items-center justify-between mb-3">
        <h4
          className={`font-medium text-gray-900 dark:text-white ${compact ? 'text-xs' : 'text-sm'}`}
        >
          모델 연결 테스트
        </h4>
        <button
          onClick={testAll}
          disabled={testingAll}
          className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'} font-medium
                     bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50
                     transition-colors`}
        >
          {testingAll ? '테스트 중...' : '전체 테스트'}
        </button>
      </div>
      <div className="space-y-2">
        {activeModels
          .sort((a, b) => a.priority - b.priority)
          .map((m) => {
            const result = results[m.modelName];
            const badge = result ? STATUS_BADGE[result.status] : null;

            return (
              <div key={m.modelName} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">
                    #{m.priority}
                  </span>
                  <span
                    className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-300 truncate`}
                  >
                    {m.modelName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {badge && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  )}
                  <button
                    onClick={() => testModel(m.modelName)}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    테스트
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      {/* 에러 상세 메시지 */}
      {Object.entries(results).some(([, r]) => r.status !== 'connected' && r.message) && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {Object.entries(results)
            .filter(([, r]) => r.status !== 'connected' && r.message !== '테스트 중...')
            .map(([model, r]) => (
              <p key={model} className="text-xs text-red-500 dark:text-red-400">
                {model}: {r.message}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
