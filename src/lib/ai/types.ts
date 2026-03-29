export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number; // USD (무료면 0)
}

export type StreamChunk = { type: 'token'; content: string } | { type: 'done'; usage: TokenUsage };

export interface LlmProvider {
  generateStream(params: {
    systemPrompt: string;
    userMessage: string;
  }): AsyncGenerator<StreamChunk>;
}
