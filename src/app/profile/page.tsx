'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileView from '@/components/profile/ProfileView';

/**
 * @page ProfilePage (나의 프로필)
 * @description
 * 사용자가 자신의 프로필을 보고 수정할 수 있는 페이지입니다.
 * 온보딩은 middleware에서 /onboarding으로 redirect 처리.
 */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchMyData();
    }
  }, [status, router]);

  const fetchMyData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users/me');
      const data = await res.json();
      if (data.success) {
        setUserData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-muted-foreground">프로필 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!session || !userData) return null;

  return <ProfileView initialUserData={userData} readOnly={false} />;
}
