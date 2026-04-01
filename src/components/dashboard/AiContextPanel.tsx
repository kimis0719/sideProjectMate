'use client';

import { useState, useEffect, useCallback } from 'react';

interface KeyMeta {
  exists: boolean;
  createdAt: string | null;
  lastUsedAt: string | null;
}

type PanelState = 'loading' | 'no_key' | 'has_key' | 'just_gen';

interface AiContextPanelProps {
  pid: string;
  isOwner: boolean;
}

export default function AiContextPanel({ pid, isOwner }: AiContextPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<PanelState>('loading');
  const [keyMeta, setKeyMeta] = useState<KeyMeta | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<'url' | 'snippet' | null>(null);

  const fetchKeyMeta = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/projects/${pid}/api-key`);
      const data = await res.json();
      if (data.success) {
        setKeyMeta(data.data);
        setState(data.data.exists ? 'has_key' : 'no_key');
      } else {
        setState('no_key');
      }
    } catch {
      setState('no_key');
    }
  }, [pid]);

  useEffect(() => {
    if (isOpen && isOwner) fetchKeyMeta();
  }, [isOpen, isOwner, fetchKeyMeta]);

  const handleGenerate = async () => {
    try {
      const res = await fetch(`/api/projects/${pid}/api-key`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.data.key);
        setState('just_gen');
      }
    } catch {
      // silent
    }
  };

  const handleRevoke = async () => {
    if (!confirm('API 키를 폐기하면 기존 연결이 끊깁니다. 계속하시겠습니까?')) return;
    try {
      await fetch(`/api/projects/${pid}/api-key`, { method: 'DELETE' });
      setKeyMeta(null);
      setNewKey(null);
      setState('no_key');
    } catch {
      // silent
    }
  };

  const contextUrl = (key: string) =>
    `${window.location.origin}/api/context/${pid}?key=${key}`;

  const snippet = (key: string) =>
    `<!-- Side Project Mate Context -->\n` +
    `<!-- Fetch latest project context: -->\n` +
    `<!-- curl ${contextUrl(key)} -->\n\n` +
    `Read the current project state from: ${contextUrl(key)}`;

  const handleCopy = async (type: 'url' | 'snippet', key: string) => {
    const text = type === 'url' ? contextUrl(key) : snippet(key);
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    return d.toLocaleDateString('ko-KR');
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      {/* 헤더 */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-200">
          <span>🤖</span> AI에게 공유
        </span>
        <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* 펼쳐지는 본문 */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">

          {/* 비소유자 안내 */}
          {!isOwner && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              프로젝트 소유자만 API 키를 관리할 수 있습니다.
            </p>
          )}

          {/* 로딩 */}
          {isOwner && state === 'loading' && (
            <p className="text-xs text-slate-400">불러오는 중...</p>
          )}

          {/* 키 없음 */}
          {isOwner && state === 'no_key' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                API 키를 생성하면 어떤 AI 에이전트에도 프로젝트 컨텍스트를 공유할 수 있습니다.
              </p>
              <button
                onClick={handleGenerate}
                className="w-full py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                API 키 생성
              </button>
            </div>
          )}

          {/* 키 생성 직후 — 1회 노출 */}
          {isOwner && state === 'just_gen' && newKey && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                <span>⚠️</span>
                <span>이 창을 닫으면 키 값을 다시 볼 수 없습니다.</span>
              </div>
              <UrlBox url={contextUrl(newKey)} />
              <div className="flex gap-2">
                <CopyButton label="URL 복사" active={copied === 'url'} onClick={() => handleCopy('url', newKey)} />
                <CopyButton label="CLAUDE.md 스니펫" active={copied === 'snippet'} onClick={() => handleCopy('snippet', newKey)} />
              </div>
              <button
                onClick={() => { setState('has_key'); fetchKeyMeta(); }}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                확인했습니다 →
              </button>
            </div>
          )}

          {/* 키 보유 */}
          {isOwner && state === 'has_key' && keyMeta && (
            <div className="space-y-2">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-xs text-slate-400 dark:text-slate-500 font-mono break-all">
                {window.location.origin}/api/context/{pid}?key=spm_••••••••
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                키 값은 최초 생성 시에만 표시됩니다. 새로 복사하려면 재발급하세요.
              </p>
              {keyMeta.lastUsedAt && (
                <p className="text-xs text-slate-400">마지막 사용: {formatDate(keyMeta.lastUsedAt)}</p>
              )}
              {keyMeta.createdAt && (
                <p className="text-xs text-slate-400">생성일: {formatDate(keyMeta.createdAt)}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                >
                  재발급
                </button>
                <button
                  onClick={handleRevoke}
                  className="flex-1 py-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  폐기
                </button>
              </div>
            </div>
          )}

          {/* 사용 안내 (항상 표시) */}
          <details className="text-xs text-slate-400 dark:text-slate-500">
            <summary className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">사용 방법</summary>
            <div className="mt-2 space-y-1 pl-2 border-l border-slate-200 dark:border-slate-600">
              <p>1. API 키 생성 후 URL을 복사합니다.</p>
              <p>2. AI 채팅창에 붙여넣으세요:</p>
              <code className="block bg-slate-100 dark:bg-slate-700 rounded p-1 text-xs">
                이 URL의 내용을 읽고 프로젝트를 파악해줘: [URL]
              </code>
              <p>3. Claude Code라면 CLAUDE.md에 URL을 추가하세요.</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function UrlBox({ url }: { url: string }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-xs font-mono break-all text-slate-600 dark:text-slate-300">
      {url}
    </div>
  );
}

function CopyButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
        active
          ? 'bg-green-500 text-white'
          : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
      }`}
    >
      {active ? '✓ 복사됨' : label}
    </button>
  );
}
