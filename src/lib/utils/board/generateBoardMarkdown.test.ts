import { describe, it, expect } from 'vitest';
import { generateBoardMarkdown } from './generateBoardMarkdown';

describe('generateBoardMarkdown', () => {
  it('노트가 없으면 안내 메시지 반환', () => {
    const result = generateBoardMarkdown({ notes: [], sections: [] });
    expect(result).toBe('(지시 대상 노트가 없습니다)');
  });

  it('섹션에 속한 노트를 섹션 제목 아래에 그룹핑', () => {
    const result = generateBoardMarkdown({
      notes: [
        { _id: 'n1', text: 'API 구현', sectionId: 's1' },
        { _id: 'n2', text: 'DB 설계', sectionId: 's1' },
      ],
      sections: [{ _id: 's1', title: '백엔드' }],
    });

    expect(result).toContain('### 백엔드');
    expect(result).toContain('- **API 구현**');
    expect(result).toContain('- **DB 설계**');
  });

  it('고아 노트는 기타 노트로 표시', () => {
    const result = generateBoardMarkdown({
      notes: [
        { _id: 'n1', text: '섹션 노트', sectionId: 's1' },
        { _id: 'n2', text: '고아 노트', sectionId: null },
      ],
      sections: [{ _id: 's1', title: '백엔드' }],
    });

    expect(result).toContain('### 기타 노트');
    expect(result).toContain('- **고아 노트**');
  });

  it('태그와 마감일 포함', () => {
    const result = generateBoardMarkdown({
      notes: [{ _id: 'n1', text: '버그 수정', tags: ['urgent', 'backend'], dueDate: '2026-04-01' }],
      sections: [],
    });

    expect(result).toContain('태그: urgent, backend');
    expect(result).toContain('마감: 2026-04-01');
  });

  it('모든 노트가 고아일 때 기타 노트 제목 없이 표시', () => {
    const result = generateBoardMarkdown({
      notes: [
        { _id: 'n1', text: '노트1' },
        { _id: 'n2', text: '노트2' },
      ],
      sections: [],
    });

    expect(result).not.toContain('### 기타 노트');
    expect(result).toContain('- **노트1**');
    expect(result).toContain('- **노트2**');
  });
});
