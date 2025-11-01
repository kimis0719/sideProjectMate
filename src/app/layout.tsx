import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Side Project Mate',
  description: '사이드 프로젝트를 위한 협업 플랫폼',
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="ko">
      <body className={inter.className}>
      <div className="min-h-screen bg-gray-50">
        <Header />
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
  )
}
