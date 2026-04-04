'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInstructionStore } from '@/store/instructionStore';
import { useBoardStore, type Section, type Note } from '@/store/boardStore';
import { useExecutionResultStore } from '@/store/executionResultStore';

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
    setTarget,
    setReference,
    setPreset,
    setAdditionalInstruction,
    generate,
    closeModal,
  } = useInstructionStore();

  const openExecutionResult = useExecutionResultStore((s) => s.open);

  const sections = useBoardStore((s) => s.sections);
  const notes = useBoardStore((s) => s.notes);

  // AI 설정 fetch (프리셋 + 모델 정보)
  const [presets, setPresets] = useState<
    Array<{ name: string; roleInstruction: string; description: string }>
  >([]);
  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-settings');
      const json = await res.json();
      if (json.success && json.data.defaultPresets) {
        setPresets(json.data.defaultPresets);
      }
    } catch {
      // 로드 실패 무시
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchPresets();
  }, [isOpen, fetchPresets]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI 지시서 생성</h2>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            &times;
          </button>
        </div>

        {/* ── 본문 (스크롤) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* 결과가 없을 때: 설정 UI */}
          {!resultMarkdown && (
            <>
              {/* ① 지시 대상 */}
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

              {/* 프로젝트 정보 안내 */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <span className="font-medium">자동 포함되는 정보:</span> 프로젝트 등록 시 설정한
                  기술스택, 프로젝트명, 상태, 마감일이 AI 컨텍스트에 자동으로 포함됩니다. 참조
                  노트를 별도로 선택하지 않아도 기본 프로젝트 정보는 전달됩니다.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  관리자 설정에서 프로젝트 개요, 리소스, 팀원 목록 포함 여부를 조절할 수 있습니다.
                </p>
              </div>

              {/* ② 프리셋 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  프리셋
                </label>
                <select
                  value={preset}
                  onChange={(e) => {
                    const selected = presets.find((p) => p.name === e.target.value);
                    setPreset(e.target.value, selected?.roleInstruction ?? '');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">선택 안 함</option>
                  {presets.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} — {p.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* ③ 추가 지시 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  추가 지시 (선택)
                </label>
                <textarea
                  value={additionalInstruction}
                  onChange={(e) => setAdditionalInstruction(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-y"
                  placeholder="예: 각 작업의 예상 소요시간도 포함해줘"
                />
              </div>

              {/* 에러 + 모델 테스트 */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </>
          )}

          {/* 결과 미리보기 */}
          {resultMarkdown && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                결과 미리보기
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                  {resultMarkdown}
                </pre>
              </div>
              {usage && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  입력 {usage.inputTokens.toLocaleString()} / 출력{' '}
                  {usage.outputTokens.toLocaleString()} 토큰
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {resultMarkdown ? (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                복사
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                MD 다운로드
              </button>
              <button
                onClick={() => {
                  useInstructionStore.setState({ resultMarkdown: '', error: null, usage: null });
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                재생성
              </button>
              {boardId && historyId && (
                <button
                  onClick={() => {
                    openExecutionResult(boardId, historyId);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  결과 보고
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={generate}
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? '생성 중...' : '생성하기'}
          </button>
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
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {/* 라디오: 전체 */}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'all'}
            onChange={() => handleModeChange('all')}
            className="text-blue-600"
          />
          보드 전체 ({notes.length}개 노트)
        </label>

        {/* 라디오: 섹션 선택 */}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'sections'}
            onChange={() => handleModeChange('sections')}
            className="text-blue-600"
          />
          섹션 선택
        </label>
        {mode === 'sections' && (
          <div className="ml-6 space-y-1">
            {sections.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(s.id)}
                  onChange={() => toggleSection(s.id)}
                  className="rounded text-blue-600"
                />
                {s.title} ({noteCountBySection.get(s.id) ?? 0}개 노트)
              </label>
            ))}
          </div>
        )}

        {/* 라디오: 노트 직접 선택 */}
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'notes'}
            onChange={() => handleModeChange('notes')}
            className="text-blue-600"
          />
          노트 직접 선택
        </label>
        {mode === 'notes' && (
          <div className="ml-6 space-y-2">
            <input
              type="text"
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              placeholder="검색..."
            />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredNotes.map((n) => (
                <label
                  key={n.id}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedNotes.has(n.id)}
                    onChange={() => toggleNote(n.id)}
                    className="rounded text-blue-600"
                  />
                  <span className="truncate">{n.text}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        참조 컨텍스트 (배경 정보로 AI에게 전달)
      </label>
      <div className="ml-2 space-y-1">
        {sections.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedSections.has(s.id)}
              onChange={() => toggleSection(s.id)}
              className="rounded text-blue-600"
            />
            {s.title} ({noteCountBySection.get(s.id) ?? 0}개 노트)
          </label>
        ))}
        {sections.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">섹션이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
