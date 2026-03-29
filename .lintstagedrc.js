module.exports = {
  // TypeScript/TSX: ESLint 자동 수정 + Prettier 포맷
  // no-explicit-any, exhaustive-deps를 warn + max-warnings 0으로 설정
  // → 수정한 파일에 any나 deps 누락이 있으면 커밋 차단됨 (점진적 제거 강제)
  '*.{ts,tsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],
  // JS/JSX: 포맷만
  '*.{js,jsx,mjs,cjs}': ['prettier --write'],
  // 기타 파일: 포맷만
  '*.{json,md,css}': ['prettier --write'],
};
