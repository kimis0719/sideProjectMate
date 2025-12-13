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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Availability & Style State
  const [schedule, setSchedule] = useState<any[]>([]);
  const [preference, setPreference] = useState<number>(50);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);

  // Introduction State
  const [introduction, setIntroduction] = useState<string>('');

  // User Data State (merged)
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
      // 1. Fetch User Basic Info (mock for now, or from API)
      // In a real app, you might fetch this from /api/users/me
      const basicInfo = {
        nName: session?.user?.name || '사용자',
        email: session?.user?.email || '',
        position: 'Frontend Developer',
        career: '3년차',
        status: '구직중',
        socialLinks: {
          github: 'https://github.com/kimis0719',
          blog: 'https://velog.io',
        },
        introduction: '안녕하세요! 저는 열정적인 프론트엔드 개발자입니다. 🚀',
      };
      setUserData(basicInfo);

      // 2. Fetch Availability
      const availRes = await fetch('/api/users/me/availability');
      if (availRes.ok) {
        const { data } = await availRes.json();
        if (data) {
          setSchedule(data.schedule || []);
          setPreference(data.preference ?? 50);
          setPersonalityTags(data.personalityTags || []);
        }
      }

      // 3. Fetch Introduction (assuming it's in user profile or separate)
      // For now, we'll use the one from basic info or empty
      setIntroduction(basicInfo.introduction || ''); // If API provided it

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch data', error);
      setIsLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
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
    // TODO: Implement API for saving introduction
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
      {/* Split-Header Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Profile Header (2/3 width on desktop) */}
        <div className="md:col-span-2">
          <ProfileHeader user={userData} />
        </div>

        {/* Right: Status Dashboard (1/3 width on desktop) */}
        <div className="md:col-span-1">
          <StatusDashboard status={userData?.status} />
        </div>
      </section>

      {/* Skill Section */}
      <section>
        <SkillSection />
      </section>

      {/* Phase 3: GitHub Stats & Blog */}
      {(userData?.socialLinks?.github || userData?.socialLinks?.blog) && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {userData?.socialLinks?.github && (
            <div className="lg:col-span-2">
              <GitHubStats githubUrl={userData.socialLinks.github} />
            </div>
          )}
          {userData?.socialLinks?.blog && (
            <div className="lg:col-span-1">
              <BlogPostCard blogUrl={userData.socialLinks.blog} />
            </div>
          )}
        </section>
      )}


      {/* Phase 2: Availability & Style */}
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
          {/* Left: Weekly Schedule */}
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

          {/* Right: Communication Style */}
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

      {/* Phase 2: Self Introduction (Block Editor) */}
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
