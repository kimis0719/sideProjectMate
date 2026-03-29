'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
                  set({
                    usage: data.usage
                      ? {
                          inputTokens: data.usage.inputTokens,
                          outputTokens: data.usage.outputTokens,
                        }
                      : null,
                    historyId: data.historyId ?? null,
                  });
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
    }),
    { name: 'instructionStore' }
  )
);
