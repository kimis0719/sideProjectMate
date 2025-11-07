'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('추천');

  const syncAuthFromStorage = useCallback(() => {
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (_) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    syncAuthFromStorage();
  }, [pathname, syncAuthFromStorage]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        syncAuthFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncAuthFromStorage]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
    router.refresh?.();
  };

  const mainCategories = ['기술서', '프로젝트', '칸반보드'];
  const subCategories = ['추천', '최신', '인기', '마감임박'];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* 상단 헤더 */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 로고 & 대분류 메뉴 */}
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-gray-900 transition-colors">
                SPM
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                {mainCategories.map((category) => (
                  <Link
                    key={category}
                    href={`/${category.toLowerCase()}`}
                    className="text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {category}
                  </Link>
                ))}
              </nav>
            </div>

            {/* 로그인 영역 */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button className="hidden md:block text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button className="hidden md:block text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    + 멤버
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 헤더 (중분류) */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-8 h-12 overflow-x-auto scrollbar-hide">
            {subCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

