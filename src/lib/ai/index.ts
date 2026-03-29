import type { LlmProvider } from '@/lib/ai/types';
import { GeminiProvider } from '@/lib/ai/providers/gemini';

export function getLlmProvider(provider: string, modelPriority?: string[]): LlmProvider {
  switch (provider) {
    case 'gemini':
      return new GeminiProvider(modelPriority ?? 'gemini-2.5-flash');
    default:
      return new GeminiProvider(modelPriority ?? 'gemini-2.5-flash');
  }
}

export type { LlmProvider, StreamChunk, TokenUsage } from '@/lib/ai/types';
