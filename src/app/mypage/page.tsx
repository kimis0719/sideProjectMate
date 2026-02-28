'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DetailProfileCard from '@/components/profile/DetailProfileCard';
import ImageEditModal from '@/components/profile/modals/ImageEditModal';
import { useModal } from '@/hooks/useModal';
import Skeleton from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';

interface MyApplication {
    _id: string;
    projectId: {
        title: string;
        pid: number;
    };
    role: string;
    status: 'pending' | 'accepted' | 'rejected';
}

type FilterTab = 'all' | 'pending' | 'accepted' | 'rejected';

const TAB_LABELS: Record<FilterTab, string> = {
    all: '전체',
    pending: '대기중',
    accepted: '수락됨',
    rejected: '거절됨',
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    accepted: { label: '수락됨', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    rejected: { label: '거절됨', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { alert, confirm } = useModal();

    // ✅ 모든 훅을 조건부 return 이전에 선언
    const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [isAppsLoading, setIsAppsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>('all');

    const fetchMyApplications = useCallback(async () => {
        setIsAppsLoading(true);
        try {
            const response = await fetch('/api/applications');
            const data = await response.json();
            if (data.success) {
                setMyApplications(data.data);
            }
        } catch (error) {
            console.error('지원 내역을 불러오는 중 오류 발생', error);
        } finally {
            setIsAppsLoading(false);
        }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        setIsProfileLoading(true);
        try {
            const res = await fetch('/api/users/me');
            const data = await res.json();
            if (data.success) {
                setUserData(data.data);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
        if (status === 'authenticated') {
            fetchMyApplications();
            fetchUserProfile();
        }
    }, [status, router, fetchMyApplications, fetchUserProfile]);

    const handleSaveAvatar = async (url: string) => {
        const res = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: url }),
        });
        if (res.ok) {
            setUserData((prev: any) => ({ ...prev, avatarUrl: url }));
        } else {
            await alert('에러', '이미지 변경 실패');
        }
    };

    const handleCancelApplication = async (appId: string) => {
        const ok = await confirm('지원 취소', '정말 지원을 취소하시겠습니까?', {
            isDestructive: true,
            closeOnBackdropClick: false,
        });
        if (ok === true) {
            try {
                const response = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    await alert('취소 완료', '지원서가 삭제되었습니다.');
                    fetchMyApplications();
                } else {
                    throw new Error(data.message);
                }
            } catch (err: any) {
                await alert('에러', err.message);
            }
        }
    };

    // 로딩 중 상태(세션 체크)
    if (status === 'loading') {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton.Profile />
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton.ListItem key={i} />)}
                </div>
            </div>
        );
    }

    if (!session) return null;

    // 탭 필터링
    const filteredApps = activeTab === 'all'
        ? myApplications
        : myApplications.filter(app => app.status === activeTab);

    // 탭별 카운트
    const tabCounts: Record<FilterTab, number> = {
        all: myApplications.length,
        pending: myApplications.filter(a => a.status === 'pending').length,
        accepted: myApplications.filter(a => a.status === 'accepted').length,
        rejected: myApplications.filter(a => a.status === 'rejected').length,
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* ── 프로필 카드 섹션 */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">내 프로필 카드</h1>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Preview</span>
                </div>
                {isProfileLoading ? (
                    <Skeleton.Profile />
                ) : userData ? (
                    <DetailProfileCard
                        user={userData}
                        onClick={() => router.push('/profile')}
                        isEditing={true}
                        onEditAvatar={() => setIsAvatarModalOpen(true)}
                    />
                ) : null}
            </section>

            <ImageEditModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSave={handleSaveAvatar}
                currentUrl={userData?.avatarUrl}
            />

            {/* ── 지원 현황 섹션 */}
            <div className="bg-card shadow-sm rounded-xl p-6 border border-border">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-foreground">내 지원 현황</h2>
                    <Link href={`/projects?authorId=${session.user?._id}`} className="btn-secondary text-sm px-3 py-1.5">
                        내 프로젝트 보기
                    </Link>
                </div>

                {/* 탭 필터 */}
                <div className="flex gap-1 border-b border-border mb-6">
                    {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {TAB_LABELS[tab]}
                            {tabCounts[tab] > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {tabCounts[tab]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 콘텐츠 */}
                {isAppsLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton.ListItem key={i} />)}
                    </div>
                ) : filteredApps.length > 0 ? (
                    <div className="space-y-3">
                        {filteredApps.map(app => {
                            const badge = STATUS_BADGE[app.status];
                            return (
                                <div
                                    key={app._id}
                                    className="p-4 border border-border rounded-lg flex justify-between items-center bg-card hover:bg-muted/30 transition-colors"
                                >
                                    <div>
                                        {app.projectId ? (
                                            <Link
                                                href={`/projects/${app.projectId.pid}`}
                                                className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                                            >
                                                {app.projectId.title}
                                            </Link>
                                        ) : (
                                            <span className="font-semibold text-muted-foreground">삭제된 프로젝트</span>
                                        )}
                                        <p className="text-sm text-muted-foreground mt-0.5">지원 역할: {app.role}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                        {app.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancelApplication(app._id)}
                                                className="text-xs text-destructive hover:underline"
                                            >
                                                취소
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon="inbox"
                        title={activeTab === 'all' ? '아직 지원한 프로젝트가 없습니다' : `${TAB_LABELS[activeTab]} 상태의 지원이 없습니다`}
                        description={activeTab === 'all' ? '마음에 드는 프로젝트를 찾아 지원해보세요!' : undefined}
                        action={activeTab === 'all' ? { label: '프로젝트 탐색', href: '/projects' } : undefined}
                    />
                )}
            </div>
        </div>
    );
}
