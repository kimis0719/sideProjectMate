import * as Sentry from '@sentry/nextjs';
import type { Metadata } from 'next';
import { Inter, Manrope, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import AuthSessionProvider from '@/components/AuthSessionProvider';
import GlobalModal from '@/components/common/GlobalModal';
import Toast from '@/components/common/Toast';
import MobileTabBar from '@/components/common/MobileTabBar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  preload: false,
});

// Material Symbols Outlined — 아이콘 폰트
const materialSymbolsUrl =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';

export function generateMetadata(): Metadata {
  return {
    title: {
      default: 'Side Project Mate',
      template: '%s | Side Project Mate',
    },
    description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 팀 매칭 플랫폼',
    openGraph: {
      title: 'Side Project Mate',
      description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 팀 매칭 플랫폼',
      siteName: 'Side Project Mate',
      locale: 'ko_KR',
      type: 'website',
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link href={materialSymbolsUrl} rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${notoSansKR.variable}`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          <ThemeProvider>
            {/* Skip to main — 키보드 접근성 */}
            <a href="#main-content" className="skip-to-main">
              본문 바로가기
            </a>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main id="main-content" className="flex-1 bg-surface pb-16 md:pb-0">
                {children}
              </main>
              <Footer />
              {/* 모바일 하단 탭 바 */}
              <MobileTabBar />
              {/* 전역 모달 */}
              <GlobalModal />
              {/* 전역 Toast */}
              <Toast />
            </div>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
