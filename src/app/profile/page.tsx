'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileView from '@/components/profile/ProfileView';
import OnboardingWizard from '@/components/profile/onboarding/OnboardingWizard';

/**
 * @page ProfilePage (나의 프로필)
 * @description
 * 사용자가 자신의 프로필을 보고 수정할 수 있는 페이지입니다.
 * 
 * [리팩토링 변경사항]
 * 기존의 거대한 UI 로직을 `ProfileView` 컴포넌트로 분리했습니다.
 * 이 페이지는 오직 "데이터 패칭(Fetching)"과 "권한 체크(Auth)"만 담당합니다.
 * - readOnly={false} 전달하여 수정 가능 모드로 렌더링.
 */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  // 온보딩 스킵 여부
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchMyData();
    }
  }, [status, router]);

  // 내 데이터 가져오기
  const fetchMyData = async () => {
    try {
      setIsLoading(true);

      const res = await fetch('/api/users/me');
      const data = await res.json();

      if (data.success) {
        // 세션 이미지(GitHub 프로필 등)를 avatarUrl로 병합
        const dataWithAvatar = {
          ...data.data,
          avatarUrl: data.data.avatarUrl // DB에 저장된 값을 우선 사용
        };
        setUserData(dataWithAvatar);
      } else {
        console.error('Failed to load profile:', data.message);
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
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500">프로필 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!session || !userData) {
    return null;
  }



  // 필수 정보가 없으면 온보딩 위저드 실행
  // 조건: 포지션이나 경력이 없고, 스킵하지도 않았을 때
  const showOnboarding = (!userData.position || !userData.career) && !hasSkipped;

  if (showOnboarding) {
    return (
      <OnboardingWizard
        initialData={userData}
        onComplete={(saved) => {
          if (saved) {
            // 저장하고 완료했으면 새로고침하여 데이터 갱신
            window.location.reload();
          } else {
            // '다음에 하기'를 누르면 위저드 닫고 빈 프로필 보여주기
            setHasSkipped(true);
          }
        }}
      />
    );
  }

  // 핵심: 재사용 컴포넌트 호출 (readOnly = false)
  return <ProfileView initialUserData={userData} readOnly={false} />;
}
