
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { socketClient } from '@/lib/socket';
import { useModal } from '@/hooks/useModal';

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

    const { notifications, unreadCount, fetchNotifications } = useNotificationStore();

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('추천');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?._id) {
            fetchNotifications();

            const socket = socketClient.connect();
            // User Room Join (서버 구현에 따라 다를 수 있으나, 일반적으로 사용자 ID로 Room을 생성하여 참여)
            socket.emit('join-user', session.user._id);

            const handleNewNotification = (data: any) => {
                fetchNotifications();
                setToastMessage('새로운 알림이 도착했습니다.');
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            };

            socket.on('new-notification', handleNewNotification);

            return () => {
                socket.off('new-notification', handleNewNotification);
            };
        }
    }, [status, pathname, fetchNotifications, session]);

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
    const subCategories = ['추천', '최신', '인기', '마감임박'];

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

    return (
        <header className="bg-background border-b border-border sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <button
                                className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-lg"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                            <Link href="/" className="text-2xl font-bold text-foreground">SPM</Link>
                        </div>
                        <nav className="hidden md:flex items-center gap-6">
                            {mainCategories.map((category) => (
                                <Link
                                    key={category.label}
                                    href={category.path}
                                    className={`text-base font-medium transition-colors ${isActive(category.path)
                                        ? 'text-foreground border-b-2 border-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {category.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {status === 'loading' ? <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" /> : session ? (
                            <>
                                <button className="hidden md:block text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                                <button className="hidden md:block text-muted-foreground hover:text-foreground transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </button>

                                <div className="relative flex items-center">
                                    <button onClick={() => setIsNotificationOpen(prev => !prev)} className="text-muted-foreground hover:text-foreground">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
                                        )}
                                    </button>
                                    {isNotificationOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-popover rounded-lg shadow-lg overflow-hidden z-20 border border-border">
                                            <div className="p-4 font-bold text-foreground flex justify-between items-center">
                                                <span>알림</span>
                                                {notifications.length > 0 && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation(); // 드롭다운 닫힘 방지 (필요 시)
                                                            const ok = await confirm('알림 전체 삭제', '모든 알림을 삭제하시겠습니까?');
                                                            if (ok === true) {
                                                                useNotificationStore.getState().deleteAllNotifications();
                                                            }
                                                        }}
                                                        className="text-xs text-destructive hover:text-destructive/80"
                                                    >
                                                        전체 삭제
                                                    </button>
                                                )}
                                            </div>
                                            <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? notifications.map(n => (
                                                    <li key={n._id} className={`relative p-4 hover:bg-muted/50 cursor-pointer ${!n.read ? 'bg-muted/30' : ''}`}>
                                                        <div onClick={() => handleNotificationClick(n)}>
                                                            <p className="text-sm text-foreground pr-6">{getNotificationMessage(n)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString('ko-KR')}</p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                useNotificationStore.getState().deleteNotification(n._id);
                                                            }}
                                                            className="absolute top-4 right-2 text-muted-foreground hover:text-destructive p-1"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </li>
                                                )) : <li className="p-4 text-center text-sm text-muted-foreground">새로운 알림이 없습니다.</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <Link href="/mypage" className="text-sm font-medium text-muted-foreground hover:text-foreground">마이페이지</Link>
                                <button onClick={() => signOut({ callbackUrl: '/' })} className="text-sm font-medium text-muted-foreground hover:text-foreground">로그아웃</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">로그인</Link>
                                <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90">+ 멤버</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full border-b border-border bg-background z-40 shadow-lg">
                    <div className="container mx-auto px-4 py-4 space-y-4">
                        <nav className="flex flex-col gap-4">
                            {mainCategories.map((category) => (
                                <Link
                                    key={category.label}
                                    href={category.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`text-base font-medium transition-colors ${isActive(category.path)
                                        ? 'text-foreground font-bold'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {category.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {pathname === '/projects' && (
                <div className="bg-muted/50 border-b border-border">
                    <div className="container mx-auto px-4">
                        <nav className="flex items-center gap-8 h-12 overflow-x-auto scrollbar-hide">
                            {subCategories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    className={`text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === category
                                        ? 'text-foreground border-b-2 border-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* Toast Message */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce flex items-center gap-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    <span className="text-sm font-medium">{toastMessage}</span>
                    <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </header>
    );
}
