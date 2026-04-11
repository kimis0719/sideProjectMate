'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useToastStore } from '@/components/common/Toast';

/* ── 타입 ── */
interface TargetScope {
  type: 'all' | 'sections' | 'notes';
  sectionIds?: string[];
  noteIds?: string[];
}

interface ReferenceScope {
  sectionIds?: string[];
  noteIds?: string[];
}

export interface HarnessRecommendation {
  harnessId: string;
  name: string;
  domain: string;
  matchScore: number;
  matchReasons: string[];
  agents: Array<{ name: string; role: string; description: string }>;
  skills: Array<{ name: string; type: string; description: string }>;
  architecturePattern: string;
}

interface InstructionState {
  // 모달
  isOpen: boolean;
  boardId: string | null;

  // 범위 선택
  target: TargetScope;
  reference: ReferenceScope;

  // 프리셋
  preset: string;
  presetInstruction: string;
  additionalInstruction: string;

  // 생성 상태
  isGenerating: boolean;
  resultMarkdown: string;
  error: string | null;
  usage: { inputTokens: number; outputTokens: number } | null;
  historyId: string | null;

  // 하네스 추천
  harnessRecommendations: HarnessRecommendation[];
  selectedHarnessId: string | null;
  isLoadingHarness: boolean;
  harnessLang: 'ko' | 'en';
  includeHarness: boolean;
}

interface InstructionActions {
  openModal: (boardId: string) => void;
  closeModal: () => void;
  setTarget: (target: TargetScope) => void;
  setReference: (reference: ReferenceScope) => void;
  setPreset: (name: string, instruction: string) => void;
  setAdditionalInstruction: (text: string) => void;
  generate: () => Promise<void>;
  reset: () => void;
  // 하네스 관련
  fetchHarnessRecommendations: () => Promise<void>;
  setSelectedHarnessId: (id: string | null) => void;
  setHarnessLang: (lang: 'ko' | 'en') => void;
  setIncludeHarness: (include: boolean) => void;
  downloadWithHarness: () => Promise<void>;
}

const initialState: InstructionState = {
  isOpen: false,
  boardId: null,
  target: { type: 'all' },
  reference: {},
  preset: '',
  presetInstruction: '',
  additionalInstruction: '',
  isGenerating: false,
  resultMarkdown: '',
  error: null,
  usage: null,
  historyId: null,
  harnessRecommendations: [],
  selectedHarnessId: null,
  isLoadingHarness: false,
  harnessLang: 'ko',
  includeHarness: true,
};

export const useInstructionStore = create<InstructionState & InstructionActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      openModal: (boardId) => set({ ...initialState, isOpen: true, boardId }),

      closeModal: () => set({ isOpen: false }),

      setTarget: (target) => set({ target }),

      setReference: (reference) => set({ reference }),

      setPreset: (name, instruction) => set({ preset: name, presetInstruction: instruction }),

      setAdditionalInstruction: (text) => set({ additionalInstruction: text }),

      generate: async () => {
        const { boardId, target, reference, preset, presetInstruction, additionalInstruction } =
          get();
        if (!boardId) return;

        set({ isGenerating: true, resultMarkdown: '', error: null, usage: null, historyId: null });

        try {
          const res = await fetch('/api/ai/generate-instruction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              boardId,
              target,
              reference,
              preset,
              presetInstruction,
              additionalInstruction,
            }),
          });

          // 쿨타임/한도 초과 (429) — content-type 무관하게 토스트로 표시
          if (res.status === 429) {
            try {
              const json = await res.json();
              useToastStore.getState().show(json.message, 'error');
            } catch {
              useToastStore.getState().show('잠시 후 다시 시도해주세요.', 'error');
            }
            set({ isGenerating: false });
            return;
          }

          // 비스트리밍 에러 처리
          if (!res.ok && res.headers.get('content-type')?.includes('application/json')) {
            const json = await res.json();
            set({ isGenerating: false, error: json.message });
            return;
          }

          if (!res.body) {
            set({ isGenerating: false, error: '스트리밍 응답을 받을 수 없습니다.' });
            return;
          }

          // SSE 스트리밍 읽기
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let markdown = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6);
              try {
                const data = JSON.parse(jsonStr);
                if (data.type === 'token') {
                  markdown += data.content;
                  set({ resultMarkdown: markdown });
                } else if (data.type === 'done') {
                  const historyId = data.historyId ?? null;
                  set({
                    usage: data.usage
                      ? {
                          inputTokens: data.usage.inputTokens,
                          outputTokens: data.usage.outputTokens,
                        }
                      : null,
                    historyId,
                  });
                  // 템플릿이 포함된 전체 마크다운을 DB에서 fetch하여 store 갱신
                  if (data.hasResultTemplate && historyId) {
                    try {
                      const histRes = await fetch(`/api/ai/history/${historyId}`);
                      const histJson = await histRes.json();
                      if (histJson.success && histJson.data?.resultMarkdown) {
                        set({ resultMarkdown: histJson.data.resultMarkdown });
                      }
                    } catch {
                      // fetch 실패해도 스트리밍 결과는 유지
                    }
                  }
                } else if (data.type === 'error') {
                  set({ error: data.message });
                }
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }

          set({ isGenerating: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : '네트워크 오류';
          set({ isGenerating: false, error: message });
        }
      },

      reset: () => set(initialState),

      // ── 하네스 관련 ──
      fetchHarnessRecommendations: async () => {
        const { boardId, target } = get();
        if (!boardId) return;

        set({ isLoadingHarness: true, harnessRecommendations: [] });

        try {
          const res = await fetch('/api/ai/recommend-harness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              boardId,
              presetName: get().preset,
              target,
            }),
          });

          const json = await res.json();
          if (json.success && json.data?.recommendations) {
            const recs = json.data.recommendations as HarnessRecommendation[];
            set({
              harnessRecommendations: recs,
              selectedHarnessId: recs.length > 0 ? recs[0].harnessId : null,
            });
          }
        } catch {
          // 추천 실패해도 생성 기능은 영향 없음
        } finally {
          set({ isLoadingHarness: false });
        }
      },

      setSelectedHarnessId: (id) => set({ selectedHarnessId: id }),

      setHarnessLang: (lang) => set({ harnessLang: lang }),

      setIncludeHarness: (include) => set({ includeHarness: include }),

      downloadWithHarness: async () => {
        const { historyId, selectedHarnessId, harnessLang, includeHarness } = get();
        if (!historyId) return;

        const params = new URLSearchParams();
        if (includeHarness && selectedHarnessId) {
          params.set('harnessId', selectedHarnessId);
          params.set('lang', harnessLang);
        }

        const url = `/api/ai/history/${historyId}/download?${params.toString()}`;
        const res = await fetch(url);

        if (!res.ok) return;

        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);

        const disposition = res.headers.get('content-disposition');
        const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
        a.download = filenameMatch ? filenameMatch[1] : `spm-instruction.zip`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      },
    }),
    { name: 'instructionStore' }
  )
);
