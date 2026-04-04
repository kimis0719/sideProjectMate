import { Types } from 'mongoose';

interface TargetNote {
  _id: Types.ObjectId | string;
  text: string;
}

/**
 * AI 지시서 끝에 삽입되는 실행결과 보고 템플릿을 생성한다.
 * Agent가 이 템플릿을 채워서 반환하면 SPM이 파싱하여 자동 완료처리한다.
 */
export function generateResultTemplate(historyId: string, targetNotes: TargetNote[]): string {
  const noteEntries = targetNotes.map((note) => ({
    noteId: note._id.toString(),
    noteTitle: note.text.substring(0, 50),
    status: 'done | partial | failed',
    summary: '실행 결과를 여기에 작성',
  }));

  const template = {
    instructionId: historyId,
    completedNotes: noteEntries,
    additionalNotes: '',
    filesChanged: [],
    testsResult: 'pass | fail | skip',
  };

  return `---

## 실행결과 보고 (SPM 자동 완료처리용)

작업 완료 후 아래 JSON을 채워서 보고해주세요.

\`\`\`spm-result
${JSON.stringify(template, null, 2)}
\`\`\``;
}
