'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { pid: string };
}) {
    const pathname = usePathname();
    const { pid } = params;

    const isActive = (path: string) => pathname === path;

    return (
        <div className="flex h-[calc(100vh-64px)]"> {/* Header height assumed 64px */}
            {/* 사이드바 */}
            <aside className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">프로젝트 {pid}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">대쉬보드</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href={`/dashboard/${pid}`}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/dashboard/${pid}`)
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                    >
                        홈
                    </Link>
                    <Link
                        href={`/dashboard/${pid}/kanban`}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/dashboard/${pid}/kanban`)
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                    >
                        칸반보드
                    </Link>
                    <Link
                        href={`/dashboard/${pid}/wbs`}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/dashboard/${pid}/wbs`)
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                    >
                        WBS
                    </Link>
                </nav>
            </aside>

            {/* 메인 컨텐츠 */}
            <main className="flex-1 relative overflow-hidden bg-white dark:bg-gray-900">
                {children}
            </main>
        </div>
    );
}
