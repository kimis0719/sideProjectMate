'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ProjectMember {
    userId: { _id: string };
    role: string;
    status: string;
}

interface ProjectData {
    _id: string;
    author: { _id: string };
    projectMembers: ProjectMember[];
}

/**
 * 사이드바 내부 컨텐츠 컴포넌트
 * 홈과 작업 페이지 드로어에서 공통으로 사용됩니다.
 */
const SidebarContent = ({
    pid,
    isActive,
    onClose
}: {
    pid: string;
    isActive: (path: string) => boolean;
    onClose?: () => void;
}) => (
    <>
        <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-foreground">프로젝트 메뉴</h2>
                <p className="text-sm text-muted-foreground">ID: {pid}</p>
            </div>
            {onClose && (
                <button
                    className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                    onClick={onClose}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>

        <nav className="flex-1 p-6 space-y-3 bg-muted/5 overflow-y-auto">
            <Link
                href={`/dashboard/${pid}`}
                onClick={() => onClose?.()}
                className={`flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all ${isActive(`/dashboard/${pid}`)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50 hover:pl-6'
                    }`}
            >
                <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                대쉬보드 홈
            </Link>
            <Link
                href={`/dashboard/${pid}/kanban`}
                onClick={() => onClose?.()}
                className={`flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all ${isActive(`/dashboard/${pid}/kanban`)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50 hover:pl-6'
                    }`}
            >
                <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                칸반보드
            </Link>
            <Link
                href={`/dashboard/${pid}/wbs`}
                onClick={() => onClose?.()}
                className={`flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all ${isActive(`/dashboard/${pid}/wbs`)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50 hover:pl-6'
                    }`}
            >
                <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                WBS (일정)
            </Link>
        </nav>

        <div className="p-6 border-t border-border bg-muted/10 mt-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Side Project Mate</p>
        </div>
    </>
);

export default function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { pid: string };
}) {
    const pathname = usePathname();
    const { pid } = params;
    const router = useRouter();
    const { data: session, status } = useSession();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    // 대시보드 홈 여부 확인
    const isHomePage = pathname === `/dashboard/${pid}`;
    const isActive = (path: string) => pathname === path;
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        const checkAccess = async () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated') {
                router.replace('/');
                return;
            }

            if (session?.user?.id) {
                try {
                    const res = await fetch(`/api/projects/${pid}`);
                    if (!res.ok) {
                        router.replace('/');
                        return;
                    }
                    const data = await res.json();
                    if (!data.success || !data.data) {
                        router.replace('/');
                        return;
                    }

                    const project = data.data as ProjectData;
                    const userId = session.user.id;
                    const isAuthor = project.author._id === userId;
                    const isMember = project.projectMembers.some(
                        (m) => m.userId._id === userId && m.status === 'active'
                    );

                    if (isAuthor || isMember) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                        router.replace('/');
                    }
                } catch (error) {
                    console.error('Failed to check access:', error);
                    router.replace('/');
                }
            }
        };

        checkAccess();
    }, [pid, session, status, router]);

    if (status === 'loading' || isAuthorized === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (isAuthorized === false) return null;

    return (
        <div className="flex min-h-[calc(100vh-64px)] relative bg-background">

            {/* 1. 홈 전용: 데스크탑 고정 사이드바 */}
            {isHomePage && (
                <aside className="hidden md:flex w-72 border-r border-border flex-col sticky top-[64px] h-[calc(100vh-64px)] bg-background">
                    <SidebarContent pid={pid} isActive={isActive} />
                </aside>
            )}

            {/* 2. 공통: 드로어 사이드바 (모바일 & 작업 페이지 데스크탑용) */}
            {/* Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ease-in-out"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Drawer Aside */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-[101] w-72 bg-background border-r border-border flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <SidebarContent
                    pid={pid}
                    isActive={isActive}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </aside>

            {/* 3. 트리거 버튼 분기 */}
            {isHomePage ? (
                /* 홈 페이지: 모바일 전용 햄버거 버튼 */
                <button
                    onClick={toggleSidebar}
                    className="md:hidden fixed bottom-6 left-6 z-[90] w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12h18M3 6h18M3 18h18" />
                    </svg>
                </button>
            ) : (
                /* 작업 페이지: 개선된 플로팅 트리거 (손잡이 형태) */
                !isSidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="fixed left-0 top-1/2 -translate-y-1/2 z-[40] w-4 h-20 bg-background border-y border-r border-border rounded-r-2xl shadow-[4px_0_15px_rgba(0,0,0,0.1)] flex items-center justify-center hover:w-8 transition-all group overflow-hidden"
                        title="메뉴 열기"
                    >
                        <svg
                            className="text-muted-foreground group-hover:text-primary transition-colors w-4 h-4 ml-[-2px] group-hover:ml-0"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                )
            )}

            {/* 4. 메인 컨텐츠 */}
            <main className={`flex-1 relative w-full ${isHomePage ? 'min-w-0' : ''}`}>
                {children}
            </main>
        </div>
    );
}
