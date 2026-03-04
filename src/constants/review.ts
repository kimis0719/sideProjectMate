/**
 * 팀원 리뷰 시스템에서 사용하는 미리 정의된 태그 목록
 */
export const REVIEW_TAGS = [
  '책임감있어요',
  '소통잘해요',
  '실력있어요',
  '일정관리잘해요',
  '배려깊어요',
  '기술력뛰어나요',
  '아이디어가풍부해요',
  '적극적이에요',
] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];
