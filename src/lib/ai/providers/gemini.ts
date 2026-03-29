import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LlmProvider, StreamChunk } from '@/lib/ai/types';

export class GeminiProvider implements LlmProvider {
  private modelPriority: string[];

  constructor(modelNameOrPriority: string | string[] = 'gemini-2.5-flash') {
    if (Array.isArray(modelNameOrPriority)) {
      this.modelPriority =
        modelNameOrPriority.length > 0 ? modelNameOrPriority : ['gemini-2.5-flash'];
    } else {
      this.modelPriority = [modelNameOrPriority];
    }
  }

  async *generateStream(params: {
    systemPrompt: string;
    userMessage: string;
  }): AsyncGenerator<StreamChunk> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 우선순위 순서대로 시도
    const modelsToTry = this.modelPriority;
    let lastError: Error | null = null;

    for (const modelId of modelsToTry) {
      try {
        const generator = this.tryGenerate(genAI, modelId, params);
        // 첫 번째 chunk를 가져와서 성공 여부 확인
        const first = await generator.next();
        if (!first.done) {
          yield first.value;
          yield* generator;
          return;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;

        // 429 Rate Limit → 다음 모델로 fallback
        if (
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('Too Many Requests')
        ) {
          console.warn(`[GeminiProvider] ${modelId} 할당량 초과, 다음 모델 시도 중...`);
          continue;
        }

        // 429가 아닌 에러는 즉시 throw
        throw new Error(formatGeminiError(errMsg));
      }
    }

    // 모든 모델 실패
    throw new Error(
      'Gemini API 할당량이 모두 초과되었습니다. 잠시 후 다시 시도하거나, ' +
        'Google AI Studio(https://aistudio.google.com)에서 할당량을 확인하세요.'
    );
  }

  private async *tryGenerate(
    genAI: GoogleGenerativeAI,
    modelId: string,
    params: { systemPrompt: string; userMessage: string }
  ): AsyncGenerator<StreamChunk> {
    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: params.systemPrompt,
    });

    const result = await model.generateContentStream(params.userMessage);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { type: 'token', content: text };
      }
    }

    const response = await result.response;
    const usageMetadata = response.usageMetadata;

    yield {
      type: 'done',
      usage: {
        inputTokens: usageMetadata?.promptTokenCount ?? 0,
        outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
        estimatedCost: 0,
      },
    };
  }
}

/** Gemini API 에러 메시지를 사용자 친화적으로 변환 */
function formatGeminiError(message: string): string {
  if (message.includes('API_KEY_INVALID') || message.includes('401')) {
    return 'Gemini API 키가 유효하지 않습니다. 관리자에게 문의하세요.';
  }
  if (message.includes('403') || message.includes('PERMISSION_DENIED')) {
    return 'Gemini API 접근 권한이 없습니다. API 키 설정을 확인하세요.';
  }
  if (message.includes('SAFETY')) {
    return 'AI 안전 필터에 의해 요청이 차단되었습니다. 노트 내용을 수정 후 재시도하세요.';
  }
  return `Gemini API 오류: ${message}`;
}
