module.exports = {
  // TypeScript/TSX: 포맷 후 lint 자동 수정
  '*.{ts,tsx}': ['prettier --write', 'eslint --fix'],
  // JS/JSX: 포맷만
  '*.{js,jsx,mjs,cjs}': ['prettier --write'],
  // 기타 파일: 포맷만
  '*.{json,md,css}': ['prettier --write'],
};
