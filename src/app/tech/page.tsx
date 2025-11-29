'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatusDashboard from '@/components/profile/StatusDashboard';

export default function TechPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            setIsLoading(false);
        }
    }, [status, router]);

    if (status === 'loading' || isLoading) {
        return <div className="p-8 text-center">로딩 중...</div>;
    }

    if (!session) {
        return null;
    }

    // 임시 사용자 데이터 (추후 DB 연동)
    const userData = {
        nName: session.user?.name || '사용자',
        email: session.user?.email || '',
        position: 'Frontend Developer',
        career: '3년차',
        status: '구직중',
        introduction: '안녕하세요! React와 Next.js를 좋아하는 개발자입니다. 사이드 프로젝트를 찾고 있어요.',
        socialLinks: {
            github: 'https://github.com',
            blog: 'https://velog.io',
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Split-Header Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Profile Header (2/3 width on desktop) */}
                <div className="md:col-span-2">
                    <ProfileHeader user={userData} />
                </div>

                {/* Right: Status Dashboard (1/3 width on desktop) */}
                <div className="md:col-span-1">
                    <StatusDashboard status={userData.status} />
                </div>
            </section>

            {/* 추후 Skill, Availability 섹션 추가 예정 */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[200px] flex items-center justify-center text-gray-400">
                기술 스택 및 가용성 섹션 준비 중...
            </section>
        </div>
    );
}
