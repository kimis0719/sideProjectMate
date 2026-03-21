'use client';

import { useState, useEffect } from 'react';

/**
 * useMediaQuery — CSS 미디어 쿼리를 React 상태로 구독하는 훅
 *
 * @param query - CSS 미디어 쿼리 문자열 (예: '(max-width: 767px)')
 * @returns 현재 쿼리 일치 여부 (boolean)
 *
 * 사용 예:
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    // 초기 상태 설정
    setMatches(media.matches);

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
