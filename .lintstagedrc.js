module.exports = {
  // TypeScript/TSX: 포맷 자동 수정 (lint는 npm run lint로 별도 확인)
  // TODO: 기존 코드 lint 정리 완료 후 'eslint --fix' 추가 예정
  '*.{ts,tsx}': ['prettier --write'],
  // JS/JSX: 포맷만
  '*.{js,jsx,mjs,cjs}': ['prettier --write'],
  // 기타 파일: 포맷만
  '*.{json,md,css}': ['prettier --write'],
};
