import { AiExecutionResult, ExecutionNoteResult } from '@/types/ai-execution-result';

function validateExecutionResult(raw: unknown): AiExecutionResult | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const obj = raw as Record<string, unknown>;

  if (typeof obj.instructionId !== 'string') return null;

  if (!Array.isArray(obj.completedNotes)) return null;

  const completedNotes: ExecutionNoteResult[] = [];
  for (const item of obj.completedNotes) {
    if (typeof item !== 'object' || item === null) return null;
    const note = item as Record<string, unknown>;
    if (
      typeof note.noteId !== 'string' ||
      typeof note.noteTitle !== 'string' ||
      !['done', 'partial', 'failed'].includes(note.status as string) ||
      typeof note.summary !== 'string'
    ) {
      return null;
    }
    completedNotes.push({
      noteId: note.noteId,
      noteTitle: note.noteTitle,
      status: note.status as 'done' | 'partial' | 'failed',
      summary: note.summary,
    });
  }

  const result: AiExecutionResult = {
    instructionId: obj.instructionId,
    completedNotes,
  };

  if (typeof obj.additionalNotes === 'string') result.additionalNotes = obj.additionalNotes;
  if (Array.isArray(obj.filesChanged)) result.filesChanged = obj.filesChanged as string[];
  if (['pass', 'fail', 'skip'].includes(obj.testsResult as string)) {
    result.testsResult = obj.testsResult as 'pass' | 'fail' | 'skip';
  }

  return result;
}

/**
 * JSON 문자열 값 내부의 리터럴 줄바꿈을 공백으로 치환한다.
 * 복사-붙여넣기 시 summary 등 긴 텍스트에 literal \n이 들어가는 경우 대응.
 */
function sanitizeJsonLiteralNewlines(input: string): string {
  let result = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      result += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    // 문자열 내부의 literal 줄바꿈 → 공백으로 치환
    if (inString && (ch === '\n' || ch === '\r')) {
      result += ' ';
      continue;
    }
    result += ch;
  }
  return result;
}

/**
 * 텍스트에서 첫 번째 균형잡힌 JSON 객체를 추출한다.
 * regex greedy 문제 없이 { } 중첩을 직접 추적.
 */
function extractFirstJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * 1단계: spm-result 코드블록 또는 JSON 직접 파싱
 * 성공 시 AiExecutionResult 반환, 실패 시 null 반환
 */
export function parseExecutionResult(input: string): AiExecutionResult | null {
  // CRLF 정규화
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // spm-result 코드블록 추출
  const codeBlockMatch = normalized.match(/```spm-result\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    const json = extractFirstJson(codeBlockMatch[1]);
    if (json) {
      try {
        return validateExecutionResult(JSON.parse(sanitizeJsonLiteralNewlines(json)));
      } catch {
        // fall through
      }
    }
  }

  // 코드블록 없이 JSON 직접 포함된 경우
  const json = extractFirstJson(normalized);
  if (json) {
    try {
      return validateExecutionResult(JSON.parse(sanitizeJsonLiteralNewlines(json)));
    } catch {
      // fall through
    }
  }

  return null;
}
