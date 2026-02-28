import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import AuthSessionProvider from '@/components/AuthSessionProvider'
import GlobalModal from '@/components/common/GlobalModal'
import Toast from '@/components/common/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthSessionProvider>
          <ThemeProvider>
            {/* Skip to main — 키보드 접근성 */}
            <a href="#main-content" className="skip-to-main">
              본문 바로가기
            </a>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main id="main-content" className="flex-1 bg-background">
                {children}
              </main>
              <Footer />
              {/* 전역 모달 */}
              <GlobalModal />
              {/* 전역 Toast */}
              <Toast />
            </div>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
