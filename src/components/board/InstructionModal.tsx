'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInstructionStore, type HarnessRecommendation } from '@/store/instructionStore';
import { useBoardStore, type Section, type Note } from '@/store/boardStore';
import { useExecutionResultStore } from '@/store/executionResultStore';
import {
  validateAdditionalInstruction,
  MAX_ADDITIONAL_LENGTH,
} from '@/lib/utils/ai/validateAdditionalInstruction';

// 프론트엔드용 기본 패턴 (AiSettings 기본값과 동일)
const FRONTEND_GUARDRAIL_PATTERNS = [
  '너는\\s*(?:이제|이다)',
  '역할을?\\s*바꿔',
  '이전\\s*(?:지시|명령).*무시',
  '(?:위|앞).*명령.*무시',
  'ignore\\s+(?:above|previous|instructions)',
  'forget\\s+(?:everything|all)',
  '\\d+번\\s*반복',
  '위\\s*내용.*반복',
  'api\\s*키.*(?:출력|알려|보여)',
  '비밀번호.*(?:알려|출력|보여)',
];

/* ══════════════════════════════════════════
   InstructionModal — AI 지시서 생성 모달
   ══════════════════════════════════════════ */
export default function InstructionModal() {
  const {
    isOpen,
    boardId,
    target,
    reference,
    preset,
    additionalInstruction,
    isGenerating,
    resultMarkdown,
    error,
    usage,
    historyId,
    harnessRecommendations,
    selectedHarnessId,
    isLoadingHarness,
    harnessLang,
    includeHarness,
    setTarget,
    setReference,
    setPreset,
    setAdditionalInstruction,
    generate,
    closeModal,
    fetchHarnessRecommendations,
    setSelectedHarnessId,
    setHarnessLang,
    setIncludeHarness,
    downloadWithHarness,
  } = useInstructionStore();

  const openExecutionResult = useExecutionResultStore((s) => s.open);

  const sections = useBoardStore((s) => s.sections);
  const notes = useBoardStore((s) => s.notes);

  // 프리셋 fetch (기본 프리셋 — 로그인 유저 모두 접근 가능)
  const [presets, setPresets] = useState<
    Array<{ name: string; roleInstruction: string; description: string }>
  >([]);
  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/default-presets');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPresets(json.data);
      }
    } catch {
      // 로드 실패 무시
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchPresets();
  }, [isOpen, fetchPresets]);

  // 지시서 생성 완료 시 하네스 추천 자동 요청
  useEffect(() => {
    if (resultMarkdown && historyId && harnessRecommendations.length === 0 && !isLoadingHarness) {
      fetchHarnessRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultMarkdown, historyId]);

  if (!isOpen) return null;

  const additionalError = additionalInstruction
    ? validateAdditionalInstruction(additionalInstruction, FRONTEND_GUARDRAIL_PATTERNS)
    : null;
  const isGenerateDisabled = isGenerating || !!additionalError;

  const activeNotes = notes.filter((n) => n.status !== 'done');

  // 섹션별 노트 수 계산
  const noteCountBySection = new Map<string, number>();
  for (const note of activeNotes) {
    if (note.sectionId) {
      noteCountBySection.set(note.sectionId, (noteCountBySection.get(note.sectionId) ?? 0) + 1);
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resultMarkdown);
  };

  const handleDownload = () => {
    const blob = new Blob([resultMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instruction-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-on-surface/10 backdrop-blur-md">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.08)] overflow-hidden flex flex-col mx-4 max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold font-headline text-on-surface tracking-tight">
            AI 지시서 생성
          </h2>
          <button
            onClick={closeModal}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {!resultMarkdown && (
            <>
              {/* 지시 대상 */}
              <ScopeSelector
                label="지시 대상 (작업으로 변환할 노트)"
                target={target}
                sections={sections}
                notes={activeNotes}
                noteCountBySection={noteCountBySection}
                onChange={setTarget}
              />

              {/* 참조 컨텍스트 */}
              <ReferenceSelector
                reference={reference}
                sections={sections}
                noteCountBySection={noteCountBySection}
                onChange={setReference}
              />

              {/* 안내 박스 */}
              <div className="p-4 bg-primary-container/10 rounded-xl flex gap-3 items-start border border-primary-container/5">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <p className="text-sm text-on-surface leading-relaxed">
                  <span className="font-medium">자동 포함되는 정보:</span> 프로젝트 등록 시 설정한
                  기술스택, 프로젝트명, 상태, 마감일이 AI 컨텍스트에 자동으로 포함됩니다.
                </p>
              </div>

              {/* 프리셋 */}
              <section className="space-y-3">
                <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  프리셋
                </label>
                <div className="relative">
                  <select
                    value={preset}
                    onChange={(e) => {
                      const selected = presets.find((p) => p.name === e.target.value);
                      setPreset(e.target.value, selected?.roleInstruction ?? '');
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 appearance-none focus:ring-2 focus:ring-primary transition-all text-sm"
                  >
                    <option value="">선택 안 함</option>
                    {presets.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} — {p.description}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    expand_more
                  </span>
                </div>
              </section>

              {/* 추가 지시 */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    추가 지시 (선택)
                  </label>
                  <span
                    className={`text-xs tabular-nums ${
                      additionalInstruction.length > MAX_ADDITIONAL_LENGTH
                        ? 'text-error font-semibold'
                        : 'text-on-surface-variant/60'
                    }`}
                  >
                    {additionalInstruction.length} / {MAX_ADDITIONAL_LENGTH}
                  </span>
                </div>
                <textarea
                  value={additionalInstruction}
                  onChange={(e) => setAdditionalInstruction(e.target.value)}
                  maxLength={MAX_ADDITIONAL_LENGTH + 50}
                  rows={3}
                  className={`w-full bg-surface-container-low rounded-xl px-4 py-3 focus:ring-2 resize-none text-sm placeholder:text-on-surface-variant/50 transition-colors ${
                    additionalError
                      ? 'border border-error focus:ring-error'
                      : 'border-none focus:ring-primary'
                  }`}
                  placeholder="예: 각 작업의 예상 소요시간도 포함해줘"
                />
                {additionalError && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {additionalError}
                  </p>
                )}
              </section>

              {error && (
                <div className="p-3 bg-error-container/40 text-on-error-container rounded-lg text-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-base mt-0.5">warning</span>
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* 결과 미리보기 */}
          {resultMarkdown && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                  결과 미리보기
                </h3>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  title="클립보드에 복사"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
              </div>
              <div className="p-6 bg-surface-container-low rounded-xl max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-on-surface font-mono leading-relaxed">
                  {resultMarkdown}
                </pre>
              </div>
              {usage && (
                <p className="text-xs text-on-surface-variant mt-2">
                  입력 {usage.inputTokens.toLocaleString()} / 출력{' '}
                  {usage.outputTokens.toLocaleString()} 토큰
                </p>
              )}
            </div>
          )}

          {/* 하네스 추천 */}
          {resultMarkdown && (
            <HarnessRecommendPanel
              recommendations={harnessRecommendations}
              selectedId={selectedHarnessId}
              isLoading={isLoadingHarness}
              lang={harnessLang}
              includeHarness={includeHarness}
              onSelect={setSelectedHarnessId}
              onLangChange={setHarnessLang}
              onIncludeChange={setIncludeHarness}
            />
          )}
        </div>

        {/* 푸터 */}
        <div className="px-8 py-6 bg-surface-container-low/50 flex items-center justify-between">
          {resultMarkdown ? (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                MD 다운로드
              </button>
              {includeHarness && selectedHarnessId && (
                <button
                  onClick={downloadWithHarness}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">package_2</span>
                  하네스 포함 다운로드
                </button>
              )}
              <button
                onClick={() => {
                  useInstructionStore.setState({ resultMarkdown: '', error: null, usage: null });
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                재생성
              </button>
              {boardId && historyId && (
                <button
                  onClick={() => {
                    openExecutionResult(boardId, historyId);
                    closeModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary-container text-on-primary rounded-lg hover:bg-primary transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">task_alt</span>
                  결과 보고
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          {!resultMarkdown && (
            <button
              onClick={generate}
              disabled={isGenerateDisabled}
              className="px-8 py-3 bg-primary-container text-on-primary font-bold rounded-xl hover:translate-x-1 active:opacity-80 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              {isGenerating ? '생성 중...' : '생성하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ScopeSelector — 지시 대상 범위 선택
   ═══════════════════════════════════════════ */
function ScopeSelector({
  label,
  target,
  sections,
  notes,
  noteCountBySection,
  onChange,
}: {
  label: string;
  target: { type: string; sectionIds?: string[]; noteIds?: string[] };
  sections: Section[];
  notes: Note[];
  noteCountBySection: Map<string, number>;
  onChange: (t: {
    type: 'all' | 'sections' | 'notes';
    sectionIds?: string[];
    noteIds?: string[];
  }) => void;
}) {
  const [mode, setMode] = useState<'all' | 'sections' | 'notes'>(
    target.type as 'all' | 'sections' | 'notes'
  );
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(target.sectionIds ?? [])
  );
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set(target.noteIds ?? []));
  const [noteSearch, setNoteSearch] = useState('');

  const handleModeChange = (m: 'all' | 'sections' | 'notes') => {
    setMode(m);
    if (m === 'all') onChange({ type: 'all' });
    else if (m === 'sections')
      onChange({ type: 'sections', sectionIds: Array.from(selectedSections) });
    else onChange({ type: 'notes', noteIds: Array.from(selectedNotes) });
  };

  const toggleSection = (id: string) => {
    const next = new Set(selectedSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSections(next);
    onChange({ type: 'sections', sectionIds: Array.from(next) });
  };

  const toggleNote = (id: string) => {
    const next = new Set(selectedNotes);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedNotes(next);
    onChange({ type: 'notes', noteIds: Array.from(next) });
  };

  const filteredNotes = noteSearch
    ? notes.filter((n) => n.text.toLowerCase().includes(noteSearch.toLowerCase()))
    : notes;

  return (
    <section className="space-y-3">
      <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
        {label}
      </label>
      <div className="grid grid-cols-1 gap-3">
        <label className="flex items-center p-4 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-all">
          <input
            type="radio"
            checked={mode === 'all'}
            onChange={() => handleModeChange('all')}
            className="w-4 h-4 text-primary border-outline-variant focus:ring-primary"
          />
          <span className="ml-3 font-medium text-sm">보드 전체 ({notes.length}개 노트)</span>
        </label>

        <label className="flex items-center p-4 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-all">
          <input
            type="radio"
            checked={mode === 'sections'}
            onChange={() => handleModeChange('sections')}
            className="w-4 h-4 text-primary border-outline-variant focus:ring-primary"
          />
          <span className="ml-3 font-medium text-sm">섹션 선택</span>
        </label>
        {mode === 'sections' && (
          <div className="ml-6 space-y-1">
            {sections.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer py-1"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(s.id)}
                  onChange={() => toggleSection(s.id)}
                  className="rounded text-primary border-outline-variant focus:ring-primary"
                />
                {s.title} ({noteCountBySection.get(s.id) ?? 0}개 노트)
              </label>
            ))}
          </div>
        )}

        <label className="flex items-center p-4 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-all">
          <input
            type="radio"
            checked={mode === 'notes'}
            onChange={() => handleModeChange('notes')}
            className="w-4 h-4 text-primary border-outline-variant focus:ring-primary"
          />
          <span className="ml-3 font-medium text-sm">노트 직접 선택</span>
        </label>
        {mode === 'notes' && (
          <div className="ml-6 space-y-2">
            <input
              type="text"
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-2 focus:ring-primary"
              placeholder="검색..."
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredNotes.map((n) => (
                <label
                  key={n.id}
                  className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer py-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedNotes.has(n.id)}
                    onChange={() => toggleNote(n.id)}
                    className="rounded text-primary border-outline-variant focus:ring-primary"
                  />
                  <span className="truncate">{n.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HarnessRecommendPanel — 하네스 추천 패널
   ═══════════════════════════════════════════ */
function HarnessRecommendPanel({
  recommendations,
  selectedId,
  isLoading,
  lang,
  includeHarness,
  onSelect,
  onLangChange,
  onIncludeChange,
}: {
  recommendations: HarnessRecommendation[];
  selectedId: string | null;
  isLoading: boolean;
  lang: 'ko' | 'en';
  includeHarness: boolean;
  onSelect: (id: string | null) => void;
  onLangChange: (lang: 'ko' | 'en') => void;
  onIncludeChange: (include: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base">smart_toy</span>
          하네스 추천
        </h3>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
          <input
            type="checkbox"
            checked={includeHarness}
            onChange={(e) => onIncludeChange(e.target.checked)}
            className="rounded text-primary border-outline-variant focus:ring-primary"
          />
          하네스 포함
        </label>
      </div>

      {isLoading && (
        <div className="p-4 bg-surface-container-low rounded-xl flex items-center gap-3">
          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm text-on-surface-variant">적합한 하네스를 찾는 중...</span>
        </div>
      )}

      {!isLoading && includeHarness && recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((rec) => (
            <button
              key={rec.harnessId}
              onClick={() => onSelect(rec.harnessId)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selectedId === rec.harnessId
                  ? 'bg-primary-container/30 ring-2 ring-primary'
                  : 'bg-surface-container-low hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-on-surface">{rec.name}</span>
                <span className="text-xs font-bold text-primary bg-primary-container/40 px-2 py-0.5 rounded-full">
                  {rec.matchScore}점
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                <span>{rec.domain}</span>
                <span>|</span>
                <span>에이전트 {rec.agents.length}명</span>
                <span>|</span>
                <span>스킬 {rec.skills.length}개</span>
                <span>|</span>
                <span>{rec.architecturePattern}</span>
              </div>
              {rec.matchReasons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rec.matchReasons.map((reason, i) => (
                    <span
                      key={i}
                      className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-md"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}

          {/* 언어 선택 */}
          <div className="flex items-center gap-3 pt-2">
            <span className="material-symbols-outlined text-base text-on-surface-variant">
              language
            </span>
            <div className="flex bg-surface-container-low rounded-lg overflow-hidden">
              <button
                onClick={() => onLangChange('ko')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === 'ko'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => onLangChange('en')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === 'en'
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* 출처 표기 */}
          <p className="text-xs text-on-surface-variant/60 pt-1">
            Powered by{' '}
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
        </div>
      )}

      {!isLoading && includeHarness && recommendations.length === 0 && (
        <p className="text-sm text-on-surface-variant/60 p-4 bg-surface-container-low rounded-xl">
          추천 가능한 하네스가 없습니다.
        </p>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════
   ReferenceSelector — 참조 컨텍스트 선택
   ═══════════════════════════════════════════ */
function ReferenceSelector({
  reference,
  sections,
  noteCountBySection,
  onChange,
}: {
  reference: { sectionIds?: string[]; noteIds?: string[] };
  sections: Section[];
  noteCountBySection: Map<string, number>;
  onChange: (r: { sectionIds?: string[]; noteIds?: string[] }) => void;
}) {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(reference.sectionIds ?? [])
  );

  const toggleSection = (id: string) => {
    const next = new Set(selectedSections);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSections(next);
    onChange({ sectionIds: Array.from(next) });
  };

  return (
    <section className="space-y-3">
      <label className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
        참조 컨텍스트 (배경 정보로 AI에게 전달)
      </label>
      <div className="ml-2 space-y-1">
        {sections.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer py-1"
          >
            <input
              type="checkbox"
              checked={selectedSections.has(s.id)}
              onChange={() => toggleSection(s.id)}
              className="rounded text-primary border-outline-variant focus:ring-primary"
            />
            {s.title} ({noteCountBySection.get(s.id) ?? 0}개 노트)
          </label>
        ))}
        {sections.length === 0 && (
          <p className="text-xs text-on-surface-variant/50">섹션이 없습니다.</p>
        )}
      </div>
    </section>
  );
}
