export const MAX_ADDITIONAL_LENGTH = 500;

/**
 * additionalInstruction 가드레일 검증
 * @returns null이면 유효, 문자열이면 에러 메시지
 */
export function validateAdditionalInstruction(input: string, patterns: string[]): string | null {
  if (input.length > MAX_ADDITIONAL_LENGTH) {
    return `${MAX_ADDITIONAL_LENGTH}자를 초과했습니다.`;
  }
  if (/https?:\/\//i.test(input)) {
    return 'URL은 입력할 수 없습니다.';
  }
  for (const pattern of patterns) {
    try {
      if (new RegExp(pattern, 'i').test(input)) {
        return '허용되지 않는 지시입니다.';
      }
    } catch {
      // 잘못된 정규식 패턴은 건너뜀
    }
  }
  return null;
}
