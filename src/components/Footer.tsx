import Link from 'next/link';

export default function Footer() {
  const menuItems = [
    { title: '메뉴1', href: '#' },
    { title: '메뉴2', href: '#' },
    { title: '메뉴3', href: '#' },
    { title: '메뉴4', href: '#' },
    { title: '메뉴5', href: '#' },
    { title: '메뉴6', href: '#' },
    { title: '메뉴7', href: '#' },
    { title: '메뉴8', href: '#' },
    { title: '메뉴9', href: '#' },
    { title: '메뉴10', href: '#' },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 좌측: 전체 메뉴 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">전체 메뉴</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* 우측: 회사 정보 */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">회사 정보</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-semibold">회사명:</span> (주)사이드프로젝트메이트
              </p>
              <p>
                <span className="font-semibold">대표:</span> 홍길동
              </p>
              <p>
                <span className="font-semibold">사업자등록번호:</span> 123-45-67890
              </p>
              <p>
                <span className="font-semibold">주소:</span> 서울특별시 강남구 테헤란로 123
              </p>
              <p>
                <span className="font-semibold">이메일:</span> contact@sideprojectmate.com
              </p>
              <p>
                <span className="font-semibold">고객센터:</span> 1234-5678
              </p>
            </div>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Side Project Mate. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                이용약관
              </Link>
              <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
