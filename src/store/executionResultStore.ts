'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AiExecutionResult } from '@/types/ai-execution-result';

interface ConfirmData {
  parsed: AiExecutionResult;
  autoCompleted: { noteId: string; previousStatus: string; newStatus: string }[];
  requiresConfirmation: {
    noteId: string;
    noteTitle: string;
    agentStatus: string;
    summary: string;
  }[];
}

interface ExecutionResultState {
  isOpen: boolean;
  step: 'input' | 'confirming';
  boardId: string | null;
  instructionId: string | null;
  rawInput: string;
  isProcessing: boolean;
  error: string | null;
  confirmData: ConfirmData | null;
}

interface ExecutionResultActions {
  open: (boardId: string, instructionId?: string) => void;
  close: () => void;
  setRawInput: (text: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

const initialState: ExecutionResultState = {
  isOpen: false,
  step: 'input',
  boardId: null,
  instructionId: null,
  rawInput: '',
  isProcessing: false,
  error: null,
  confirmData: null,
};

export const useExecutionResultStore = create<ExecutionResultState & ExecutionResultActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      open: (boardId, instructionId) =>
        set({ ...initialState, isOpen: true, boardId, instructionId: instructionId ?? null }),

      close: () => set({ isOpen: false }),

      setRawInput: (text) => set({ rawInput: text }),

      submit: async () => {
        const { boardId, instructionId, rawInput } = get();
        if (!boardId || !rawInput.trim()) return;

        set({ isProcessing: true, error: null });

        try {
          const res = await fetch('/api/ai/execution-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boardId, instructionId, rawInput }),
          });

          const json = await res.json();

          if (!json.success) {
            set({ isProcessing: false, error: json.message });
            return;
          }

          set({
            isProcessing: false,
            step: 'confirming',
            confirmData: json.data,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : '네트워크 오류';
          set({ isProcessing: false, error: message });
        }
      },

      reset: () => set(initialState),
    }),
    { name: 'executionResultStore' }
  )
);
