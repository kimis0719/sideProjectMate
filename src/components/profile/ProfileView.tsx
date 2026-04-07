'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';
import { useToastStore } from '@/components/common/Toast';
import DetailProfileCard from '@/components/profile/DetailProfileCard';
import StatusDashboard from '@/components/profile/StatusDashboard';

import GitHubStats from '@/components/profile/external/GitHubStats';
import BlogPostCard from '@/components/profile/external/BlogPostCard';
import SkillSection from '@/components/profile/SkillSection';
import AvailabilityScheduler from '@/components/profile/AvailabilityScheduler';
import CommunicationStyleSlider from '@/components/profile/CommunicationStyleSlider';
import BlockEditor from '@/components/editor/BlockEditor';
import SolvedAcCard from '@/components/profile/external/SolvedAcCard';
import PortfolioCard from '@/components/profile/portfolio/PortfolioCard';
import LinkInput from '@/components/profile/portfolio/LinkInput';
import ImageEditModal from '@/components/profile/modals/ImageEditModal';
import ReviewSection from '@/components/profile/ReviewSection';

/**
 * @interface ProfileViewProps
 * @description ProfileView 컴포넌트가 받을 Props 정의
 */
/** 프로필 사용자 데이터 타입 */
interface ProfileUserData {
  _id: string;
  nName: string;
  authorEmail?: string;
  position?: string;
  career?: string;
  status?: string;
  avatarUrl?: string;
  introduction?: string;
  socialLinks?: {
    github?: string;
    blog?: string;
    linkedin?: string;
    other?: string;
    solvedAc?: string;
  };
  portfolioLinks?: string[];
  techTags?: string[];
  githubStats?: {
    followers: number;
    following: number;
    totalStars: number;
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    contributions: number;
    techStack: string[];
  };
  level?: number;
  schedule?: { day: string; timeRanges: { start: string; end: string }[] }[];
  preference?: number;
  personalityTags?: string[];
  [key: string]: unknown;
}

interface ProfileViewProps {
  initialUserData: ProfileUserData; // 초기 사용자 데이터 (SSR 또는 상위 컴포넌트에서 전달)
  readOnly: boolean; // 수정 가능 여부 (true: 타인 프로필, false: 내 프로필)
}

/**
 * @component ProfileView
 * @description
 * 프로필 상세 화면을 보여주는 재사용 가능한 컴포넌트입니다.
 *
 * [설계 의도]
 * 기존 `src/app/profile/page.tsx`에 모든 로직이 뭉쳐있어서,
 * 타인 프로필(`[id]/page.tsx`)을 만들 때 코드 중복이 발생할 수밖에 없었습니다.
 * 이를 해결하기 위해 UI 렌더링 로직을 이 컴포넌트로 분리(Extract)했습니다.
 *
 * - **readOnly={false}**: 내 프로필. 모든 수정/저장 버튼이 활성화됩니다.
 * - **readOnly={true}**: 남의 프로필. 단순 조회만 가능하며 수정 버튼이 숨겨집니다.
 */
export default function ProfileView({ initialUserData, readOnly }: ProfileViewProps) {
  const { alert } = useModal();
  // 사용자 데이터 상태
  const [userData, setUserData] = useState<ProfileUserData>(initialUserData);

  // [Inline Edit] 상시 수정 모드 (내 프로필이면 항상 true)
  const isEditing = !readOnly;

  // 하위 컴포넌트 상태들
  const [schedule, setSchedule] = useState<
    { day: string; timeRanges: { start: string; end: string }[] }[]
  >(initialUserData?.schedule || []);
  const [preference, setPreference] = useState<number>(initialUserData?.preference ?? 50);
  const [personalityTags, setPersonalityTags] = useState<string[]>(
    initialUserData?.personalityTags || []
  );
  const [introduction, setIntroduction] = useState<string>(initialUserData?.introduction || '');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(
    initialUserData?.portfolioLinks || []
  );
  const [techTags, setTechTags] = useState<string[]>(initialUserData?.techTags || []);

  // Social Links States
  const [socialLinks, setSocialLinks] = useState({
    github: initialUserData?.socialLinks?.github || '',
    blog: initialUserData?.socialLinks?.blog || '',
    solvedAc: initialUserData?.socialLinks?.solvedAc || '',
  });

  // Props가 변경되면 상태도 업데이트 (데이터 동기화)
  useEffect(() => {
    setUserData(initialUserData);
    setSchedule(initialUserData?.schedule || []);
    setPreference(initialUserData?.preference ?? 50);
    setPersonalityTags(initialUserData?.personalityTags || []);
    setIntroduction(initialUserData?.introduction || '');
    setPortfolioLinks(initialUserData?.portfolioLinks || []);
    setTechTags(initialUserData?.techTags || []);
    setSocialLinks({
      github: initialUserData?.socialLinks?.github || '',
      blog: initialUserData?.socialLinks?.blog || '',
      solvedAc: initialUserData?.socialLinks?.solvedAc || '',
    });
  }, [initialUserData]);

  // ── 소셜 링크: 개별 즉시 저장 (GitHub 연동 시 서버에서 Stats 업데이트 필요)
  const handleSaveSocialLink = async (key: string, value: string) => {
    const newLinks = { ...socialLinks, [key]: value };
    setSocialLinks(newLinks);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: newLinks }),
      });
      if (!res.ok) throw new Error('소셜 링크 저장 실패');

      const data = await res.json();
      if (data.success && data.data) {
        setUserData(data.data);
        if (data.data.techTags) setTechTags(data.data.techTags);
      }
      useToastStore.getState().show('소셜 링크가 저장되었습니다.', 'success');
    } catch (error) {
      console.error(error);
      useToastStore.getState().show('소셜 링크 저장에 실패했습니다.', 'error');
    }
  };

  const handleUpdateSkills = (newTags: string[]) => {
    setTechTags(newTags);
    setUserData((prev: ProfileUserData) => ({ ...prev, techTags: newTags }));
  };

  const handleUpdateBasicInfo = (field: string, value: string) => {
    setUserData((prev: ProfileUserData) => ({ ...prev, [field]: value }));
  };

  const handleAddPortfolio = (url: string) => {
    if (!portfolioLinks.includes(url)) {
      setPortfolioLinks((prev) => [...prev, url]);
    } else {
      alert('중복 링크', '이미 추가된 링크입니다.');
    }
  };

  const handleDeletePortfolio = (url: string) => {
    setPortfolioLinks((prev) => prev.filter((l) => l !== url));
  };

  // ── 아바타는 즉시 저장 (파일 업로드 후 URL 반영이므로 글로벌 저장과 별개)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const handleEditAvatar = () => setIsAvatarModalOpen(true);
  const handleSaveAvatar = async (url: string) => {
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    });
    if (res.ok) {
      setUserData((prev: ProfileUserData) => ({ ...prev, avatarUrl: url }));
    } else {
      throw new Error('이미지 변경 실패');
    }
  };

  // ── 글로벌 저장: 모든 변경사항을 한 번에 저장
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. 프로필 기본 정보 저장 (User 모델)
      const profileRes = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: userData.position,
          career: userData.career,
          status: userData.status,
          introduction,
          techTags,
          portfolioLinks,
        }),
      });

      if (!profileRes.ok) throw new Error('프로필 저장 실패');

      const profileData = await profileRes.json();
      if (profileData.success && profileData.data) {
        setUserData(profileData.data);
        if (profileData.data.techTags) setTechTags(profileData.data.techTags);
      }

      // 2. 가용성 정보 저장 (Availability 모델 — 별도 API)
      const availRes = await fetch('/api/users/me/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, preference, personalityTags }),
      });

      if (!availRes.ok) throw new Error('가용성 저장 실패');

      useToastStore.getState().show('프로필이 저장되었습니다.', 'success');
    } catch (error) {
      console.error('Save failed:', error);
      await alert('에러', error instanceof Error ? error.message : '저장 실패');
    } finally {
      setIsSaving(false);
    }
  }, [
    userData,
    introduction,
    techTags,
    portfolioLinks,
    schedule,
    preference,
    personalityTags,
    alert,
  ]);

  if (!userData) {
    return <div className="p-8 text-center text-on-surface-variant">데이터가 없습니다.</div>;
  }

  return (
    <>
      {/* 페이지 헤더 */}
      <header className="bg-surface-container-low border-b border-outline-variant/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 flex justify-between items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
              My Space
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tighter text-on-surface">
              {readOnly ? `${userData.nName}의 프로필` : '내 프로필'}
            </h1>
          </div>
          {!readOnly && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-primary text-white px-6 sm:px-8 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-sm disabled:opacity-60"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 pb-32">
        <div className="grid grid-cols-12 gap-6 lg:gap-12 mt-8 lg:mt-12 items-start">
          {/* ── 좌측 컬럼 (8칸) */}
          <div className="col-span-12 lg:col-span-8 space-y-8 lg:space-y-12">
            {/* 1. 기본 정보 (DetailProfileCard) */}
            <DetailProfileCard
              user={userData}
              isEditing={isEditing}
              onEditAvatar={handleEditAvatar}
              onUpdateUser={handleUpdateBasicInfo}
            />

            {/* 2. 기술 스택 */}
            <SkillSection
              techTags={techTags}
              githubVerifiedTags={userData.githubStats?.techStack || []}
              onUpdateTags={readOnly ? undefined : handleUpdateSkills}
            />

            {/* 3. 외부 연동 (GitHub, Blog, Solved.ac) */}
            <GitHubStats githubUrl={userData.socialLinks?.github} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BlogPostCard blogUrl={userData.socialLinks?.blog} />
              <SolvedAcCard handle={userData.socialLinks?.solvedAc ?? ''} />
            </div>

            {/* 4. 포트폴리오 */}
            <section className="bg-surface-container-lowest p-6 lg:p-10 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold font-headline text-on-surface mb-8">포트폴리오</h2>
              {!readOnly && isEditing && (
                <div className="mb-6">
                  <LinkInput onAdd={handleAddPortfolio} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioLinks.map((url, idx) => (
                  <PortfolioCard
                    key={`${url}-${idx}`}
                    url={url}
                    readOnly={readOnly || !isEditing}
                    onDelete={() => handleDeletePortfolio(url)}
                  />
                ))}
                {portfolioLinks.length === 0 && (
                  <div className="col-span-full py-8 text-center text-on-surface-variant/50 text-sm bg-surface-container-low rounded-xl">
                    등록된 포트폴리오가 없습니다.
                  </div>
                )}
              </div>
            </section>

            {/* 5. 자기소개 */}
            <section className="bg-surface-container-lowest p-6 lg:p-10 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold font-headline text-on-surface mb-8">자기소개</h2>
              <div className="min-h-[300px]">
                <div className={readOnly || !isEditing ? 'pointer-events-none' : ''}>
                  <BlockEditor
                    content={introduction}
                    onChange={readOnly || !isEditing ? () => {} : setIntroduction}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* ── 우측 컬럼 (4칸) */}
          <div className="col-span-12 lg:col-span-4 space-y-8 lg:space-y-12 lg:sticky lg:top-24">
            {/* 소셜 링크 + 프로필 완성도 */}
            <StatusDashboard
              status={userData.status}
              user={userData}
              isEditing={isEditing}
              socialLinks={socialLinks}
              onSaveLink={handleSaveSocialLink}
            />

            {/* 주간 가능 시간 */}
            <section className="bg-surface-container-lowest p-6 lg:p-8 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold font-headline text-on-surface mb-6">
                주간 가능한 시간
              </h2>
              <div className={readOnly ? 'pointer-events-none' : ''}>
                <AvailabilityScheduler
                  initialSchedule={schedule}
                  onChange={readOnly ? () => {} : setSchedule}
                />
              </div>
            </section>

            {/* 협업 스타일 */}
            <section className="bg-surface-container-lowest p-6 lg:p-8 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold font-headline text-on-surface mb-6">협업 스타일</h2>
              <div className={readOnly || !isEditing ? 'pointer-events-none' : ''}>
                <CommunicationStyleSlider
                  preference={preference}
                  onChangePreference={readOnly || !isEditing ? () => {} : setPreference}
                  tags={personalityTags}
                  onChangeTags={readOnly || !isEditing ? () => {} : setPersonalityTags}
                />
              </div>
            </section>
          </div>
        </div>

        {/* 6. 팀원 리뷰 (전체 너비) */}
        {userData._id && (
          <div className="mt-8 lg:mt-12">
            <ReviewSection userId={userData._id.toString()} />
          </div>
        )}
      </main>

      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleSaveAvatar}
        currentUrl={userData.avatarUrl}
      />
    </>
  );
}
