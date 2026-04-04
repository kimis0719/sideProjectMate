import { describe, it, expect } from 'vitest';
import { parseExecutionResult } from './parseExecutionResult';

const validResult = {
  instructionId: 'abc123',
  completedNotes: [
    { noteId: 'note1', noteTitle: 'Redis 설정', status: 'done', summary: '완료' },
    { noteId: 'note2', noteTitle: '캐시 미들웨어', status: 'partial', summary: '일부 완료' },
  ],
  additionalNotes: '특이사항 없음',
  filesChanged: ['src/lib/redis.ts'],
  testsResult: 'pass',
};

describe('parseExecutionResult', () => {
  it('spm-result 코드블록 파싱', () => {
    const input = `작업 완료했습니다.\n\`\`\`spm-result\n${JSON.stringify(validResult)}\n\`\`\``;
    const result = parseExecutionResult(input);
    expect(result).not.toBeNull();
    expect(result!.instructionId).toBe('abc123');
    expect(result!.completedNotes).toHaveLength(2);
    expect(result!.completedNotes[0].status).toBe('done');
    expect(result!.testsResult).toBe('pass');
  });

  it('코드블록 없이 JSON만 있는 경우 파싱', () => {
    const input = `결과: ${JSON.stringify(validResult)}`;
    const result = parseExecutionResult(input);
    expect(result).not.toBeNull();
    expect(result!.instructionId).toBe('abc123');
  });

  it('선택 필드 없어도 파싱 성공', () => {
    const minimal = {
      instructionId: 'xyz',
      completedNotes: [{ noteId: 'n1', noteTitle: '노트1', status: 'done', summary: '완료' }],
    };
    const input = `\`\`\`spm-result\n${JSON.stringify(minimal)}\n\`\`\``;
    const result = parseExecutionResult(input);
    expect(result).not.toBeNull();
    expect(result!.additionalNotes).toBeUndefined();
    expect(result!.testsResult).toBeUndefined();
  });

  it('instructionId 없으면 null 반환', () => {
    const bad = { completedNotes: [] };
    const input = `\`\`\`spm-result\n${JSON.stringify(bad)}\n\`\`\``;
    expect(parseExecutionResult(input)).toBeNull();
  });

  it('completedNotes의 status 값이 잘못된 경우 null 반환', () => {
    const bad = {
      instructionId: 'abc',
      completedNotes: [{ noteId: 'n1', noteTitle: '노트', status: 'unknown', summary: '...' }],
    };
    const input = `\`\`\`spm-result\n${JSON.stringify(bad)}\n\`\`\``;
    expect(parseExecutionResult(input)).toBeNull();
  });

  it('관련 없는 텍스트는 null 반환', () => {
    expect(parseExecutionResult('작업을 완료했습니다. 파일 3개를 수정했습니다.')).toBeNull();
  });

  it('깨진 JSON은 null 반환', () => {
    const input = '```spm-result\n{ "instructionId": "abc", "completedNotes": [\n```';
    expect(parseExecutionResult(input)).toBeNull();
  });

  it('filesChanged 배열 파싱', () => {
    const input = `\`\`\`spm-result\n${JSON.stringify(validResult)}\n\`\`\``;
    const result = parseExecutionResult(input);
    expect(result!.filesChanged).toEqual(['src/lib/redis.ts']);
  });

  it('summary 값 안에 리터럴 줄바꿈이 있어도 파싱 성공', () => {
    const input = `{
  "instructionId": "abc123",
  "completedNotes": [
    {
      "noteId": "note1",
      "noteTitle": "테스트",
      "status": "done",
      "summary": "첫 번째 줄 완료.
두 번째 줄도 완료."
    }
  ]
}`;
    const result = parseExecutionResult(input);
    expect(result).not.toBeNull();
    expect(result!.completedNotes[0].summary).toContain('첫 번째 줄 완료.');
  });

  it('CRLF 줄바꿈 환경에서도 파싱 성공', () => {
    const json = JSON.stringify(validResult, null, 2);
    const crlf = json.replace(/\n/g, '\r\n');
    const input = `\`\`\`spm-result\r\n${crlf}\r\n\`\`\``;
    const result = parseExecutionResult(input);
    expect(result).not.toBeNull();
    expect(result!.instructionId).toBe('abc123');
  });

  it('코드블록 없이 JSON만 있어도 파싱 성공 (CRLF)', () => {
    const json = JSON.stringify(validResult, null, 2);
    const crlf = json.replace(/\n/g, '\r\n');
    const result = parseExecutionResult(crlf);
    expect(result).not.toBeNull();
    expect(result!.completedNotes).toHaveLength(2);
  });
});
