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
            <aside className="w-64 bg-muted/20 border-r border-border flex flex-col">
                <div className="p-6 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground">프로젝트 {pid}</h2>
                    <p className="text-sm text-muted-foreground">대쉬보드</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href={`/dashboard/${pid}`}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/dashboard/${pid}`)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50'
                            }`}
                    >
                        홈
                    </Link>
                    <Link
                        href={`/dashboard/${pid}/kanban`}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/dashboard/${pid}/kanban`)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50'
                            }`}
                    >
                        칸반보드
                    </Link>
                    <Link
                        href={`/dashboard/${pid}/wbs`}
                        className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(`/dashboard/${pid}/wbs`)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50'
                            }`}
                    >
                        WBS
                    </Link>
                </nav>
            </aside>

            {/* 메인 컨텐츠 */}
            <main className="flex-1 relative overflow-hidden bg-background">
                {children}
            </main>
        </div>
    );
}
