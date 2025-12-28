'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DetailProfileCard from '@/components/profile/DetailProfileCard';
import ImageEditModal from '@/components/profile/modals/ImageEditModal';

interface MyApplication {
    _id: string;
    projectId: {
        title: string;
        pid: number;
    };
    role: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [myApplications, setMyApplications] = useState<MyApplication[]>([]);

    const fetchMyApplications = useCallback(async () => {
        try {
            const response = await fetch('/api/applications');
            const data = await response.json();
            if (data.success) {
                setMyApplications(data.data);
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('지원 내역을 불러오는 중 오류 발생', error);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
        if (status === 'authenticated') {
            fetchMyApplications();
        }
    }, [status, router, fetchMyApplications]);

    // Avatar Edit Logic
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const handleSaveAvatar = async (url: string) => {
        const res = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: url })
        });

        if (res.ok) {
            setUserData({ ...userData, avatarUrl: url });
        } else {
            alert('이미지 변경 실패');
        }
    };

    const handleCancelApplication = async (appId: string) => {
        if (confirm('정말 지원을 취소하시겠습니까?')) {
            try {
                const response = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    alert('지원서가 삭제되었습니다.');
                    fetchMyApplications(); // 목록 새로고침
                } else {
                    throw new Error(data.message);
                }
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    if (status === 'loading' || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">로딩 중...</div>
            </div>
        );
    }

    const user = session.user as any;

    const [userData, setUserData] = useState<any>(null);

    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/users/me');
            const data = await res.json();
            if (data.success) {
                setUserData(data.data);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchUserProfile();
        }
    }, [status, fetchUserProfile]);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Profile Header Section */}
            {/* Profile Card Section (Detail Preview) */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">내 프로필 카드</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Preview</span>
                </div>
                {userData && (
                    <DetailProfileCard
                        user={userData}
                        onClick={() => router.push(`/profile`)} // go to full profile view
                        isEditing={true} // 항상 수정 가능 상태로 (아바타 오버레이 노출)
                        onEditAvatar={() => setIsAvatarModalOpen(true)}
                    />
                )}
            </section>

            <ImageEditModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSave={handleSaveAvatar}
                currentUrl={userData?.avatarUrl}
            />

            <div className="bg-card shadow rounded-lg p-6 border border-border">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-foreground">내 지원 현황</h2>
                    <button
                        onClick={() => router.push(`/projects?authorId=${user._id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors text-sm"
                    >
                        내 프로젝트 보기
                    </button>
                </div>

                <div className="space-y-4">
                    {myApplications.length > 0 ? (
                        myApplications.map(app => (
                            <div key={app._id} className="p-4 border border-border rounded-lg flex justify-between items-center bg-card">
                                <div>
                                    {app.projectId ? (
                                        <Link href={`/projects/${app.projectId.pid}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                            {app.projectId.title}
                                        </Link>
                                    ) : (
                                        <span className="font-semibold text-gray-400">삭제된 프로젝트</span>
                                    )}
                                    <p className="text-sm text-muted-foreground">지원 역할: {app.role}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${app.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        app.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}>
                                        {app.status === 'pending' ? '대기중' : app.status === 'accepted' ? '수락됨' : '거절됨'}
                                    </span>
                                    {app.status === 'pending' && (
                                        <button onClick={() => handleCancelApplication(app._id)} className="text-sm text-red-500 hover:underline">
                                            지원 취소
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground">아직 지원한 프로젝트가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
