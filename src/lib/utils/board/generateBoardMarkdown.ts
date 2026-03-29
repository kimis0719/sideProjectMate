/**
 * 보드의 노트/섹션을 마크다운 텍스트로 변환하는 순수 함수.
 * LLM에게 전달할 유저 메시지(지시 대상)를 생성한다.
 */

interface NoteData {
  _id: string;
  text: string;
  tags?: string[];
  dueDate?: string | null;
  sectionId?: string | null;
}

interface SectionData {
  _id: string;
  title: string;
}

/**
 * 노트 목록을 마크다운 블록으로 변환
 */
export function generateBoardMarkdown(params: {
  notes: NoteData[];
  sections: SectionData[];
}): string {
  const { notes, sections } = params;

  if (notes.length === 0) {
    return '(지시 대상 노트가 없습니다)';
  }

  // 섹션별로 노트 그룹핑
  const sectionMap = new Map<string, SectionData>();
  for (const s of sections) {
    sectionMap.set(s._id, s);
  }

  // 섹션 ID별 노트 분류
  const grouped = new Map<string | null, NoteData[]>();
  for (const note of notes) {
    const key = note.sectionId ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(note);
  }

  const lines: string[] = [];

  // 섹션에 속한 노트 먼저
  grouped.forEach((sectionNotes, sectionId) => {
    if (sectionId && sectionMap.has(sectionId)) {
      const section = sectionMap.get(sectionId)!;
      lines.push(`### ${section.title}`);
      lines.push('');
      for (const note of sectionNotes) {
        lines.push(formatNote(note));
      }
      lines.push('');
    }
  });

  // 섹션에 속하지 않은 노트 (고아 노트)
  const orphanNotes = grouped.get(null);
  if (orphanNotes && orphanNotes.length > 0) {
    if (lines.length > 0) {
      lines.push('### 기타 노트');
      lines.push('');
    }
    for (const note of orphanNotes) {
      lines.push(formatNote(note));
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

function formatNote(note: NoteData): string {
  const parts: string[] = [`- **${note.text.trim()}**`];

  if (note.tags && note.tags.length > 0) {
    parts.push(`  - 태그: ${note.tags.join(', ')}`);
  }
  if (note.dueDate) {
    parts.push(`  - 마감: ${note.dueDate}`);
  }

  return parts.join('\n');
}
