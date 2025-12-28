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

    // Helper to check active link
    const isActive = (path: string) => pathname === path;

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Close sidebar when path changes (mobile)
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-[calc(100vh-64px)] relative"> {/* Header height assumed 64px */}

            {/* Mobile Toggle Button */}
            <button
                className="md:hidden absolute top-4 left-4 z-30 p-2 bg-background border border-border rounded-md shadow-sm"
                onClick={toggleSidebar}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isSidebarOpen ? (
                        <path d="M18 6L6 18M6 6l12 12" /> // X icon
                    ) : (
                        // Sidebar Icon (Rect with left column)
                        <path d="M3 3h18v18H3zM9 3v18" />
                    )}
                </svg>
            </button>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* 사이드바 */}
            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-50 w-64 bg-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">프로젝트 {pid}</h2>
                        <p className="text-sm text-muted-foreground">대쉬보드</p>
                    </div>
                    {/* Mobile Close Button (Inside Sidebar) */}
                    <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 19l-7-7 7-7" /> {/* Left Chevron */}
                        </svg>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 bg-muted/20">
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
            <main className="flex-1 relative overflow-hidden bg-background w-full">
                {children}
            </main>
        </div>
    );
}
