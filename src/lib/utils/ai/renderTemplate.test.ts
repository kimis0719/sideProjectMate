import { describe, it, expect } from 'vitest';
import { renderTemplate } from './renderTemplate';

describe('renderTemplate', () => {
  it('단순 변수 치환', () => {
    const tpl = '이름: {{name}}, 스택: {{stack}}';
    const result = renderTemplate(tpl, { name: 'SPM', stack: 'Next.js' });
    expect(result).toBe('이름: SPM, 스택: Next.js');
  });

  it('없는 변수는 빈 문자열로 치환', () => {
    const tpl = '이름: {{name}}, 스택: {{stack}}';
    const result = renderTemplate(tpl, { name: 'SPM' });
    expect(result).toBe('이름: SPM, 스택:');
  });

  it('{{#if}}...{{/if}} — truthy 값이면 블록 포함', () => {
    const tpl = '기본\n{{#if overview}}\n## 개요\n{{overview}}\n{{/if}}\n끝';
    const result = renderTemplate(tpl, { overview: '프로젝트 설명' });
    expect(result).toContain('## 개요');
    expect(result).toContain('프로젝트 설명');
  });

  it('{{#if}}...{{/if}} — falsy 값이면 블록 제거', () => {
    const tpl = '기본\n{{#if overview}}\n## 개요\n{{overview}}\n{{/if}}\n끝';
    const result = renderTemplate(tpl, { overview: '' });
    expect(result).not.toContain('## 개요');
    expect(result).toContain('기본');
    expect(result).toContain('끝');
  });

  it('{{#if}}...{{/if}} — undefined이면 블록 제거', () => {
    const tpl = '기본\n{{#if overview}}\n## 개요\n{{overview}}\n{{/if}}\n끝';
    const result = renderTemplate(tpl, {});
    expect(result).not.toContain('## 개요');
  });

  it('여러 조건부 블록 동시 처리', () => {
    const tpl = [
      '시작',
      '{{#if a}}A: {{a}}{{/if}}',
      '{{#if b}}B: {{b}}{{/if}}',
      '{{#if c}}C: {{c}}{{/if}}',
      '끝',
    ].join('\n');

    const result = renderTemplate(tpl, { a: 'aaa', c: 'ccc' });
    expect(result).toContain('A: aaa');
    expect(result).not.toContain('B:');
    expect(result).toContain('C: ccc');
  });

  it('연속 빈 줄을 정리', () => {
    const tpl = '위\n\n\n\n\n아래';
    const result = renderTemplate(tpl, {});
    expect(result).toBe('위\n\n아래');
  });

  it('null 변수는 빈 문자열로 치환', () => {
    const tpl = '값: {{val}}';
    const result = renderTemplate(tpl, { val: null });
    expect(result).toBe('값:');
  });
});
