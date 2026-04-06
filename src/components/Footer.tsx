'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // admin 페이지에서는 글로벌 푸터 숨김 (admin layout 사용)
  if (pathname?.startsWith('/admin')) return null;
  const currentYear = new Date().getFullYear();

  const serviceLinks = [
    { label: '프로젝트 탐색', href: '/projects' },
    { label: '내 프로필', href: '/profile' },
    { label: '대시보드', href: '/dashboard' },
    { label: '마이페이지', href: '/mypage' },
  ];

  const resourceLinks = [
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
  ];

  const socialLinks = [
    {
      label: 'GitHub',
      href: 'https://github.com/kimis0719/sideProjectMate',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
      ),
    },
    {
      label: '이메일',
      href: 'mailto:contact@sideprojectmate.com',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-surface-container-low">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* ── 1열: 브랜드 소개 */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary-container flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-on-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-bold text-on-surface">Side Project Mate</span>
            </Link>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              아이디어를 빠르게 실행할 동료를 찾는 팀 매칭 플랫폼
            </p>
          </div>

          {/* ── 2열: 서비스 */}
          <div>
            <h4 className="text-sm font-semibold text-on-surface mb-4">서비스</h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 3열: 리소스 */}
          <div>
            <h4 className="text-sm font-semibold text-on-surface mb-4">리소스</h4>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 4열: 소셜 */}
          <div>
            <h4 className="text-sm font-semibold text-on-surface mb-4">소셜</h4>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── 하단 저작권 */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ borderTop: '1px solid rgba(195, 198, 215, 0.15)' }}
        >
          <p className="text-xs text-on-surface-variant">
            © {currentYear} Side Project Mate. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
