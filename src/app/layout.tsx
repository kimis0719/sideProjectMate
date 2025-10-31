import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Side Project Mate',
  description: '사이드 프로젝트를 위한 협업 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  <a href="/" className="hover:text-blue-600 transition-colors">
                    Side Project Mate
                  </a>
                </h1>
                <nav className="space-x-4">
                  <a href="/projects" className="text-gray-700 hover:text-blue-600 transition-colors">
                    프로젝트
                  </a>
                  <a href="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                    로그인
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <p className="text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} Side Project Mate. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
