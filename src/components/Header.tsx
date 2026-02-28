
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { socketClient } from '@/lib/socket';
import { useModal } from '@/hooks/useModal';
import { useTheme } from '@/components/ThemeProvider';
import { useToastStore } from '@/components/common/Toast';

interface Notification {
    _id: string;
    sender: { nName: string };
    type: 'new_applicant' | 'application_accepted' | 'application_rejected' | 'assign_note';
    project: { title: string, pid: number };
    read: boolean;
    metadata?: { noteId?: string };
    createdAt: string;
}

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const { confirm } = useModal();
    const { theme, toggleTheme } = useTheme();

    const { notifications, unreadCount, fetchNotifications } = useNotificationStore();

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 외부 클릭 감지용 ref
    const notificationRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?._id) {
            fetchNotifications();

            const socket = socketClient.connect();
            socket.emit('join-user', session.user._id);

            const handleNewNotification = () => {
                fetchNotifications();
                useToastStore.getState().show('새로운 알림이 도착했습니다.', 'default');
            };

            socket.on('new-notification', handleNewNotification);

            return () => {
                socket.off('new-notification', handleNewNotification);
            };
        }
    }, [status, pathname, fetchNotifications, session]);

    // 알림 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationOpen]);

    // 유저 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    // 모바일 메뉴 열릴 때 스크롤 lock
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            try {
                await fetch(`/api/notifications/${notification._id}`, { method: 'PUT' });
                fetchNotifications();
            } catch (error) {
                console.error('알림을 읽음 처리하는데 실패했습니다.', error);
            }
        }

        let targetPath = '/';
        if (notification.type === 'new_applicant') {
            targetPath = `/projects/${notification.project.pid}/manage`;
        } else if (notification.type === 'assign_note') {
            targetPath = `/dashboard/${notification.project.pid}/kanban?noteId=${notification.metadata?.noteId}`;
        } else {
            targetPath = `/projects/${notification.project.pid}`;
        }
        router.push(targetPath);
        setIsNotificationOpen(false);
    };

    const getNotificationMessage = (n: Notification) => {
        const projectTitle = n.project?.title || '삭제된 프로젝트';
        switch (n.type) {
            case 'new_applicant':
                return `'${projectTitle}' 프로젝트에 새로운 지원자가 있습니다.`;
            case 'application_accepted':
                return `축하합니다! '${projectTitle}' 프로젝트에 참여가 수락되었습니다.`;
            case 'application_rejected':
                return `아쉽지만 '${projectTitle}' 프로젝트 참여가 거절되었습니다.`;
            case 'assign_note':
                return `'${projectTitle}' 프로젝트에서 새로운 노트의 담당자로 지정되었습니다.`;
            default:
                return '새로운 알림';
        }
    };

    const mainCategories = [
        { label: '프로필', path: '/profile' },
        { label: '프로젝트', path: '/projects' },
        { label: '대쉬보드', path: '/dashboard' },
    ];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    // 유저 아바타 표시 컴포넌트
    const UserAvatar = ({ size = 8 }: { size?: number }) => {
        const avatarUrl = (session?.user as any)?.avatarUrl;
        const name = session?.user?.name || '?';
        const initials = name.charAt(0).toUpperCase();

        if (avatarUrl) {
            return (
                <Image
                    src={avatarUrl}
                    alt={name}
                    width={size * 4}
                    height={size * 4}
                    className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-border`}
                />
            );
        }
        return (
            <div className={`w-${size} h-${size} rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold ring-2 ring-border`}>
                {initials}
            </div>
        );
    };

    return (
        <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* ── 좌측: 로고 + 네비게이션 */}
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            {/* 모바일 햄버거 */}
                            <button
                                className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="메뉴 열기"
                                aria-expanded={isMobileMenuOpen}
                                aria-controls="mobile-nav"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>

                            {/* 로고 */}
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className="text-lg font-bold text-foreground hidden sm:block">
                                    Side Project Mate
                                </span>
                                <span className="text-lg font-bold text-foreground sm:hidden">SPM</span>
                            </Link>
                        </div>

                        {/* 데스크탑 네비게이션 */}
                        <nav className="hidden md:flex items-center gap-1">
                            {mainCategories.map((category) => (
                                <Link
                                    key={category.label}
                                    href={category.path}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive(category.path)
                                        ? 'bg-primary/10 text-primary font-semibold'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        }`}
                                >
                                    {category.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* ── 우측: 액션 버튼들 */}
                    <div className="flex items-center gap-2">

                        {/* 다크모드 토글 */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            aria-label="다크모드 토글"
                        >
                            {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {status === 'loading' ? (
                            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                        ) : session ? (
                            <>
                                {/* 알림 버튼 */}
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={() => setIsNotificationOpen(prev => !prev)}
                                        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                        aria-label="알림"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                                        )}
                                    </button>

                                    {/* 알림 드롭다운 */}
                                    {isNotificationOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-popover rounded-xl shadow-xl overflow-hidden z-20 border border-border animate-fade-in">
                                            <div className="px-4 py-3 font-semibold text-foreground flex justify-between items-center border-b border-border">
                                                <span>알림</span>
                                                {notifications.length > 0 && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const ok = await confirm('알림 전체 삭제', '모든 알림을 삭제하시겠습니까?');
                                                            if (ok === true) {
                                                                useNotificationStore.getState().deleteAllNotifications();
                                                            }
                                                        }}
                                                        className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                                                    >
                                                        전체 삭제
                                                    </button>
                                                )}
                                            </div>
                                            <ul className="divide-y divide-border max-h-80 overflow-y-auto">
                                                {notifications.length > 0 ? notifications.map(n => (
                                                    <li key={n._id} className={`relative p-4 hover:bg-muted/50 cursor-pointer transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                                                        <div onClick={() => handleNotificationClick(n)}>
                                                            {!n.read && (
                                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                                                            )}
                                                            <p className="text-sm text-foreground pl-2 pr-6">{getNotificationMessage(n)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1 pl-2">{new Date(n.createdAt).toLocaleString('ko-KR')}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                useNotificationStore.getState().deleteNotification(n._id);
                                                            }}
                                                            className="absolute top-4 right-3 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                                                            aria-label="알림 삭제"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </li>
                                                )) : (
                                                    <li className="py-10 text-center text-sm text-muted-foreground">
                                                        <svg className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                        </svg>
                                                        새로운 알림이 없습니다.
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* 유저 아바타 드롭다운 */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(prev => !prev)}
                                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
                                        aria-label="사용자 메뉴"
                                    >
                                        <UserAvatar size={8} />
                                        <svg className="w-4 h-4 text-muted-foreground hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* 유저 드롭다운 메뉴 */}
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-popover rounded-xl shadow-xl border border-border z-20 overflow-hidden animate-fade-in">
                                            {/* 유저 정보 헤더 */}
                                            <div className="px-4 py-3 border-b border-border">
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {session.user?.name || '사용자'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {session.user?.email}
                                                </p>
                                            </div>
                                            <nav className="py-1">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    내 프로필
                                                </Link>
                                                <Link
                                                    href="/mypage"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                    </svg>
                                                    마이페이지
                                                </Link>
                                                <div className="border-t border-border my-1" />
                                                <button
                                                    onClick={() => signOut({ callbackUrl: '/' })}
                                                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    로그아웃
                                                </button>
                                            </nav>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="btn-ghost text-sm px-3 py-1.5">
                                    로그인
                                </Link>
                                <Link href="/register" className="btn-primary text-sm px-4 py-1.5">
                                    시작하기
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 모바일 메뉴 오버레이 (항상 마운트, translateX로 슬라이드) */}
            {/* 백드롭 */}
            <div
                className={`md:hidden fixed inset-0 top-16 bg-black/40 z-30 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-hidden="true"
            />
            {/* 슬라이드 패널 */}
            <div
                id="mobile-nav"
                role="navigation"
                aria-label="모바일 메뉴"
                className={`md:hidden fixed top-16 left-0 h-[calc(100vh-4rem)] w-64
                    bg-background border-r border-border z-40 shadow-xl overflow-y-auto
                    transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <nav className="flex flex-col p-4 gap-1">
                    {mainCategories.map((category) => (
                        <Link
                            key={category.label}
                            href={category.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(category.path)
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            {category.label}
                        </Link>
                    ))}

                    {session && (
                        <>
                            <div className="border-t border-border my-2" />
                            <Link href="/mypage" onClick={() => setIsMobileMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                마이페이지
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                            >
                                로그아웃
                            </button>
                        </>
                    )}
                </nav>
            </div>

            {/* aria-live — 알림/토스트 상태 변경을 스크린리더에 알림 */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="false"
                className="sr-only"
                id="header-live-region"
            />
        </header>
    );
}
