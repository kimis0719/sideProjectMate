/**
 * 간단한 Handlebars-like 템플릿 렌더러
 *
 * 지원 문법:
 *   {{변수}}           — 변수 치환
 *   {{#if 변수}}...{{/if}} — 조건부 블록 (변수가 truthy일 때만 포함)
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | undefined | null>
): string {
  // 1단계: {{#if 변수}}...{{/if}} 조건부 블록 처리
  let result = template.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_match, varName: string, content: string) => {
      const value = variables[varName];
      if (value && value.trim().length > 0) {
        return content;
      }
      return '';
    }
  );

  // 2단계: {{변수}} 치환
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) => {
    return variables[varName] ?? '';
  });

  // 3단계: 연속 빈 줄 정리 (3줄 이상 → 2줄)
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}
