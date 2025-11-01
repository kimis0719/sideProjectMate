'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  const syncAuthFromStorage = useCallback(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (_) {
      // no-op
    }
  }, []);

  useEffect(() => {
    // 첫 마운트 및 라우트 변경 시 동기화
    syncAuthFromStorage();
  }, [pathname, syncAuthFromStorage]);

    // 다른 탭/윈도우에서 변경된 경우 동기화
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        syncAuthFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncAuthFromStorage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    router.push('/');
    // 라우터 새로고침으로 서버/클라이언트 상태 일치
    router.refresh?.();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            <a href="/" className="hover:text-blue-600 transition-colors">
              Side Project Mate
            </a>
          </h1>
          <nav className="flex items-center space-x-4">
            <a href="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
              프로젝트
            </a>
            {isLoggedIn ? (
              <>
                <a href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                  내 정보
                </a>
                <span className="text-gray-600 text-sm">
                  환영합니다, {user?.nName || user?.authorEmail}님
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                  로그인
                </a>
                <a href="/register" className="text-gray-700 hover:text-blue-600 transition-colors">
                  회원가입
                </a>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

