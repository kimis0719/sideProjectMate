import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingThemeButton from '@/components/FloatingThemeButton'
import { ThemeProvider } from '@/components/ThemeProvider'
import AuthSessionProvider from '@/components/AuthSessionProvider' // AuthSessionProvider import

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Side Project Mate',
  description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 매칭 플랫폼',
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
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 bg-background">
                {children}
              </main>
              <Footer />
              <FloatingThemeButton />
            </div>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
