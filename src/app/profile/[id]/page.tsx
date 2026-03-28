'use client';

import { useEffect, useState } from 'react';
import ProfileView from '@/components/profile/ProfileView';

interface PublicProfilePageProps {
  params: {
    id: string;
  };
}

/**
 * @page PublicProfilePage (타인 프로필)
 * @path /profile/[id]
 * @description
 * 특정 사용자의 프로필을 조회만 할 수 있는 공개 페이지입니다.
 * - readOnly={true} 모드로 ProfileView를 렌더링합니다.
 */
import { useSession } from 'next-auth/react';

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${params.id}`);
        if (!res.ok) throw new Error('사용자를 찾을 수 없습니다.');

        const { data } = await res.json();
        setUserData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUserProfile();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500">사용자 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-4xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">프로필을 찾을 수 없습니다.</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // [Fix] 내 프로필이면 수정 가능하도록 readOnly 해제
  // session.user._id는 string일 수도 있고 ObjectId일 수도 있으므로 문자열 비교
  const isMyProfile = session?.user && (session.user as any)._id === params.id;

  return <ProfileView initialUserData={userData} readOnly={!isMyProfile} />;
}
