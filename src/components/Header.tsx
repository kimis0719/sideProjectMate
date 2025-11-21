'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useNotificationStore } from '@/lib/store/notificationStore';

interface Notification {
  _id: string;
  sender: { nName: string };
  type: 'new_applicant' | 'application_accepted' | 'application_rejected';
  project: { title: string, pid: number };
  read: boolean;
  createdAt: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const { notifications, unreadCount, fetchNotifications } = useNotificationStore();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('추천');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, pathname, fetchNotifications]);

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
      default:
        return '새로운 알림';
    }
  };

  const mainCategories = [
    { label: '기술서', path: '/tech' },
    { label: '프로젝트', path: '/projects' },
    { label: '칸반보드', path: '/kanban' },
  ];
  const subCategories = ['추천', '최신', '인기', '마감임박'];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">SPM</Link>
            <nav className="hidden md:flex items-center gap-6">
              {mainCategories.map((category) => (
                <Link key={category.label} href={category.path} className="text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900">
                  {category.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {status === 'loading' ? <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" /> : session ? (
              <>
                <button className="hidden md:block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="hidden md:block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>

                <div className="relative flex items-center">
                  <button onClick={() => setIsNotificationOpen(prev => !prev)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </button>
                  {isNotificationOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden z-20">
                      <div className="p-4 font-bold text-gray-900 dark:text-white">알림</div>
                      <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.map(n => (
                          <li key={n._id} onClick={() => handleNotificationClick(n)} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer ${!n.read ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{getNotificationMessage(n)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('ko-KR')}</p>
                          </li>
                        )) : <li className="p-4 text-center text-sm text-gray-500">새로운 알림이 없습니다.</li>}
                      </ul>
                    </div>
                  )}
                </div>

                <Link href="/profile" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900">마이페이지</Link>
                <button onClick={() => signOut()} className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900">로그인</Link>
                <Link href="/register" className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg hover:bg-gray-900">+ 멤버</Link>
              </>
            )}
          </div>
        </div>
      </div>
      {pathname === '/projects' && (
        <div className="bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-8 h-12 overflow-x-auto scrollbar-hide">
              {subCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === category
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
