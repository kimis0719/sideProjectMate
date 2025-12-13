'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import StatusDashboard from '@/components/profile/StatusDashboard';
import GitHubStats from '@/components/profile/external/GitHubStats';
import BlogPostCard from '@/components/profile/external/BlogPostCard';
import SkillSection from '@/components/profile/SkillSection';
import AvailabilityScheduler from '@/components/profile/AvailabilityScheduler';
import CommunicationStyleSlider from '@/components/profile/CommunicationStyleSlider';
import BlockEditor from '@/components/editor/BlockEditor';
import SolvedAcCard from '@/components/profile/external/SolvedAcCard';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 가용성 및 스타일 상태 관리
  const [schedule, setSchedule] = useState<any[]>([]);
  const [preference, setPreference] = useState<number>(50);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);

  // 자기소개 상태 관리
  const [introduction, setIntroduction] = useState<string>('');

  // 사용자 데이터 상태 (병합됨)
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 1. 사용자 기본 정보 가져오기 (현재는 모의 데이터, 추후 API 연동)
      // 실제 앱에서는 /api/users/me 에서 호출
      const basicInfo = {
        nName: session?.user?.name || '사용자',
        email: session?.user?.email || '',
        position: 'Frontend Developer',
        career: '3년차',
        status: '구직중',
        socialLinks: {
          github: 'https://github.com/kimis0719',
          blog: 'https://velog.io/@hansanghun',
          solvedAc: 'koosaga', // 테스트용 모의 핸들
        },
        introduction: '안녕하세요! 저는 열정적인 프론트엔드 개발자입니다. 🚀',
      };
      setUserData(basicInfo);

      // 2. 가용성 정보 가져오기
      const availRes = await fetch('/api/users/me/availability');
      if (availRes.ok) {
        const { data } = await availRes.json();
        console.log('[ProfilePage] Fetched Availability:', data);
        if (data) {
          setSchedule(data.schedule || []);
          setPreference(data.preference ?? 50);
          setPersonalityTags(data.personalityTags || []);
        }
      }

      // 3. 자기소개 가져오기 (사용자 프로필이나 별도 API에 있다고 가정)
      // 현재는 기본 정보에 있는 것을 사용하거나 비워둠
      setIntroduction(basicInfo.introduction || ''); // API가 제공한다면 사용

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setIsLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      console.log('Sending Availability Data:', { schedule, preference, personalityTags }); // Debug Log
      const res = await fetch('/api/users/me/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          preference,
          personalityTags,
        }),
      });

      if (res.ok) {
        alert('가용성 및 성향 정보가 저장되었습니다! 💾');
      } else {
        alert('저장에 실패했습니다. 😢');
      }
    } catch (error) {
      console.error('Save failed', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSaveIntroduction = async () => {
    // TODO: 자기소개 저장 API 구현 필요
    // await fetch('/api/users/me/introduction', ...);
    console.log('Saving introduction:', introduction);
    alert('자기소개가 저장되었습니다! (임시) 📝');
  };

  if (status === 'loading' || isLoading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* 분할 헤더 섹션 (Split-Header Section) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 왼쪽: 프로필 헤더 (데스크탑 기준 2/3 너비) */}
        <div className="md:col-span-2">
          <ProfileHeader user={userData} />
        </div>

        {/* 오른쪽: 상태 대시보드 (데스크탑 기준 1/3 너비) */}
        <div className="md:col-span-1">
          <StatusDashboard status={userData?.status} />
        </div>
      </section>

      {/* 3단계: GitHub 통계, 기술 스택, 블로그, Solved.ac (7:3 레이아웃) */}
      <section className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Row 1 Left: GitHub Stats (70%) */}
        <div className="lg:col-span-7">
          {userData?.socialLinks?.github && (
            <GitHubStats githubUrl={userData.socialLinks.github} />
          )}
        </div>

        {/* Row 1 Right: Skill Section (30%) */}
        <div className="lg:col-span-3">
          <SkillSection
            githubUsername={userData?.socialLinks?.github?.split('/').pop()}
          />
        </div>

        {/* Row 2 Left: Blog Posts (70%) */}
        <div className="lg:col-span-7">
          {userData?.socialLinks?.blog && (
            <BlogPostCard blogUrl={userData.socialLinks.blog} />
          )}
        </div>

        {/* Row 2 Right: Solved.ac (30%) */}
        <div className="lg:col-span-3">
          {userData?.socialLinks?.solvedAc && (
            <SolvedAcCard handle={userData.socialLinks.solvedAc} />
          )}
        </div>
      </section>


      {/* Phase 2: 가용성 및 스타일 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">📅 가용성 및 협업 성향</h2>
          <button
            onClick={handleSaveAvailability}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            저장하기
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 주간 스케줄러 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">주간 가능한 시간</h3>
            <div className="border rounded-xl p-4 bg-gray-50">
              <AvailabilityScheduler
                initialSchedule={schedule}
                onChange={setSchedule}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                드래그하여 가능한 시간을 선택해주세요.
              </p>
            </div>
          </div>

          {/* 오른쪽: 커뮤니케이션 스타일 */}
          <div>
            <CommunicationStyleSlider
              preference={preference}
              onChangePreference={setPreference}
              tags={personalityTags}
              onChangeTags={setPersonalityTags}
            />
          </div>
        </div>
      </section>

      {/* Phase 2: 자기소개 (블록 에디터) */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">📝 자기소개</h2>
          <button
            onClick={handleSaveIntroduction}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            저장하기
          </button>
        </div>

        <div className="min-h-[400px]">
          <BlockEditor
            content={introduction}
            onChange={setIntroduction}
          />
        </div>
      </section>
    </div>
  );
}
