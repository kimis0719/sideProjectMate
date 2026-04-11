'use client';

import { useEffect, useState, useCallback } from 'react';

interface HarnessCatalogItem {
  harnessId: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  techStacks: string[];
  agents: Array<{ name: string; role: string; description: string }>;
  skills: Array<{ name: string; type: string; description: string }>;
  architecturePattern: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  'content-creation': '콘텐츠 제작',
  'software-development': '소프트웨어 개발',
  'data-analytics': '데이터 분석',
  'business-operations': '비즈니스 운영',
  'marketing-sales': '마케팅/세일즈',
  'education-research': '교육/연구',
  'design-creative': '디자인/크리에이티브',
  'finance-legal': '금융/법률',
  'healthcare-science': '건강/과학',
  'infrastructure-devops': '인프라/DevOps',
};

interface HarnessBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (harnessId: string) => void;
  selectedId: string | null;
  highlightId?: string | null;
  highlightScore?: number;
}

export default function HarnessBrowser({
  isOpen,
  onClose,
  onSelect,
  selectedId,
  highlightId,
  highlightScore,
}: HarnessBrowserProps) {
  const [catalog, setCatalog] = useState<HarnessCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/harness-catalog');
      const json = await res.json();
      if (json.success) {
        setCatalog(json.data);
      }
    } catch {
      // 로드 실패
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && catalog.length === 0) fetchCatalog();
  }, [isOpen, catalog.length, fetchCatalog]);

  if (!isOpen) return null;

  const filtered = catalog.filter((item) => {
    if (domainFilter && item.domain !== domainFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.harnessId.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.includes(q)) ||
        item.techStacks.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const domains = Array.from(new Set(catalog.map((c) => c.domain))).sort();

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-on-surface/10 backdrop-blur-md">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.08)] overflow-hidden flex flex-col mx-4 max-h-[85vh]">
        {/* 헤더 */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/10">
          <h2 className="text-lg font-bold font-headline text-on-surface tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined">hub</span>
            하네스 카탈로그
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 필터 */}
        <div className="px-6 py-3 flex gap-3 border-b border-outline-variant/10">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary"
              placeholder="하네스 검색..."
            />
          </div>
          <div className="relative">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-surface-container-low border-none rounded-lg px-4 py-2 text-sm appearance-none pr-8 focus:ring-2 focus:ring-primary"
            >
              <option value="">전체 도메인</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {DOMAIN_LABELS[d] || d}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
              expand_more
            </span>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="ml-3 text-sm text-on-surface-variant">로딩 중...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant/60 py-12">
              검색 결과가 없습니다.
            </p>
          )}

          {filtered.map((item) => {
            const isSelected = selectedId === item.harnessId;
            const isHighlighted = highlightId === item.harnessId;
            const isExpanded = expandedId === item.harnessId;

            return (
              <div
                key={item.harnessId}
                className={`rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary-container/30 ring-2 ring-primary'
                    : isHighlighted
                      ? 'bg-primary-container/10 ring-1 ring-primary/30'
                      : 'bg-surface-container-low hover:bg-surface-container-high'
                }`}
              >
                <button onClick={() => onSelect(item.harnessId)} className="w-full text-left p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-on-surface">
                      {isHighlighted && '★ '}
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {isHighlighted && highlightScore && (
                        <span className="text-xs font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">
                          AI추천 {highlightScore}점
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant/60">
                        {DOMAIN_LABELS[item.domain] || item.domain}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant/70">
                    <span>에이전트 {item.agents.length}명</span>
                    <span>|</span>
                    <span>스킬 {item.skills.length}개</span>
                    <span>|</span>
                    <span>{item.architecturePattern}</span>
                    {item.techStacks.length > 0 && (
                      <>
                        <span>|</span>
                        <span>{item.techStacks.slice(0, 3).join(', ')}</span>
                      </>
                    )}
                  </div>
                </button>
                <div className="px-4 pb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : item.harnessId);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {isExpanded ? '접기' : '상세 보기'}
                  </button>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant mb-1">에이전트</p>
                      <div className="space-y-1">
                        {item.agents.map((a) => (
                          <div key={a.name} className="text-xs text-on-surface-variant">
                            <span className="font-medium">{a.name}</span> —{' '}
                            {a.description || a.role}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant mb-1">스킬</p>
                      <div className="space-y-1">
                        {item.skills.map((s) => (
                          <div key={s.name} className="text-xs text-on-surface-variant">
                            <span className="font-medium">{s.name}</span>{' '}
                            <span className="text-on-surface-variant/50">
                              ({s.type === 'orchestrator' ? '오케스트레이터' : '도메인'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-surface-container-low/50 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant/60">
            {filtered.length}개 하네스 |{' '}
            <a
              href="https://github.com/revfactory/harness-100"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              revfactory/harness-100
            </a>{' '}
            (Apache 2.0)
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
