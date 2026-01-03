'use client';

import React, { useState, useEffect } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
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

/**
 * @interface ProfileViewProps
 * @description ProfileView 컴포넌트가 받을 Props 정의
 */
interface ProfileViewProps {
    initialUserData: any; // 초기 사용자 데이터 (SSR 또는 상위 컴포넌트에서 전달)
    readOnly: boolean;    // 수정 가능 여부 (true: 타인 프로필, false: 내 프로필)
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
    // 사용자 데이터 상태
    const [userData, setUserData] = useState<any>(initialUserData);

    // [Inline Edit] 상시 수정 모드 (내 프로필이면 항상 true)
    const isEditing = !readOnly;

    // 하위 컴포넌트 상태들
    const [schedule, setSchedule] = useState<any[]>(initialUserData?.schedule || []);
    const [preference, setPreference] = useState<number>(initialUserData?.preference ?? 50);
    const [personalityTags, setPersonalityTags] = useState<string[]>(initialUserData?.personalityTags || []);
    const [introduction, setIntroduction] = useState<string>(initialUserData?.introduction || '');
    const [portfolioLinks, setPortfolioLinks] = useState<string[]>(initialUserData?.portfolioLinks || []);
    const [techTags, setTechTags] = useState<string[]>(initialUserData?.techTags || []);

    // Social Links States
    const [socialLinks, setSocialLinks] = useState({
        github: initialUserData?.socialLinks?.github || '',
        blog: initialUserData?.socialLinks?.blog || '',
        solvedAc: initialUserData?.socialLinks?.solvedAc || ''
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
            solvedAc: initialUserData?.socialLinks?.solvedAc || ''
        });
    }, [initialUserData]);

    /** 
     * [교육적 설명] 핸들러 함수들
     * readOnly 모드일 때는 저장 버튼 자체가 렌더링되지 않으므로,
     * 보안상/로직상 핸들러 내부에서도 방어 코드를 짤 수는 있지만 여기선 UI 제어로 처리합니다.
     */

    const handleSaveSocialLink = async (key: string, value: string) => {
        const newLinks = { ...socialLinks, [key]: value };
        setSocialLinks(newLinks);

        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ socialLinks: newLinks })
            });

            if (!res.ok) throw new Error('Failed to save social links');

            const data = await res.json();
            if (data.success && data.data) {
                // 서버에서 계산된 최신 데이터(GitHub Stats, Tech Tags 등)로 전체 업데이트
                setUserData(data.data);

                // 개별 상태도 동기화 (SkillSection 등에 반영)
                if (data.data.techTags) setTechTags(data.data.techTags);
            }

            alert('소셜 링크가 저장되었습니다! ✅');
        } catch (error) {
            console.error(error);
            alert('링크 저장 실패');
        }
    };

    const handleSaveAvailability = async () => {
        try {
            // 실제 API 호출 로직은 여기에 구현 (현재는 로그만 출력)
            console.log('가용성 정보 저장:', { schedule, preference, personalityTags });

            // TODO: API 구현 필요 (Availability 테이블 등)
            // 임시로 user collection에 저장한다고 가정
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    availability: { schedule, preference, personalityTags } // 스키마에 맞게 조정 필요
                })
            });

            if (res.ok) {
                alert('가용성 정보가 저장되었습니다! ✅');
            } else {
                throw new Error('Save Failed');
            }
        } catch (error) {
            console.error(error);
            alert('저장 실패');
        }
    };

    const handleSaveIntroduction = async () => {
        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ introduction })
            });
            const data = await res.json();
            if (data.success) {
                setUserData({ ...userData, introduction });
                alert('자기소개가 저장되었습니다! ✅');
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            console.error('Failed to save intro:', error);
            alert(`저장 실패: ${error.message}`);
        }
    };

    const handleUpdateSkills = async (newTags: string[]) => {
        // 즉시 반영
        setTechTags(newTags);
        setUserData((prev: any) => ({ ...prev, techTags: newTags }));

        try {
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ techTags: newTags })
            });
            if (!res.ok) throw new Error('Failed to save tags');

            // 저장 완료 알림 (너무 잦은 알림이 싫다면 Toast로 대체 가능하나 요청사항에 따라 Alert 사용)
            alert('기술 스택이 저장되었습니다! ✅');
        } catch (error) {
            console.error(error);
            alert('기술 스택 저장 실패');
        }
    };

    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const handleEditAvatar = () => {
        setIsAvatarModalOpen(true);
    };

    const handleSaveAvatar = async (url: string) => {
        const res = await fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl: url })
        });

        if (res.ok) {
            setUserData({ ...userData, avatarUrl: url });
        } else {
            throw new Error('이미지 변경 실패');
        }
    };

    // 포트폴리오 추가/삭제 핸들러
    const handleAddPortfolio = (url: string) => {
        if (!portfolioLinks.includes(url)) {
            const newLinks = [...portfolioLinks, url];
            setPortfolioLinks(newLinks);
            // Auto Save
            fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolioLinks: newLinks })
            }).catch(console.error);
        } else {
            alert('이미 추가된 링크입니다.');
        }
    };

    const handleDeletePortfolio = (url: string) => {
        const newLinks = portfolioLinks.filter(l => l !== url);
        setPortfolioLinks(newLinks);
        // Auto Save
        fetch('/api/users/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolioLinks: newLinks })
        }).catch(console.error);
    };


    if (!userData) {
        return <div className="p-8 text-center">데이터가 없습니다.</div>;
    }

    // 기본 정보(직군, 경력) 수정 및 자동 저장
    const handleUpdateBasicInfo = async (field: string, value: string) => {
        // 1. 상태 즉시 업데이트 (UI 반응성)
        setUserData((prev: any) => ({ ...prev, [field]: value }));

        // 2. API 저장 (De-bouncing 없이 일단 단순 구현, 필요시 최적화)
        // 실제로는 텍스트 입력의 경우 Debounce가 필요하지만, 여기선 간단히 처리
        try {
            // 직군(input)의 경우 너무 잦은 요청을 방지하기 위해 
            // 실제 앱에서는 lodash.debounce 등을 사용 권장.
            // 여기서는 경력(Select) 변경이나 포지션 입력 후 포커스 아웃 등을 가정하지 않고
            // 편의상 바로 요청하되, 에러 로그만 남김.
            await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            // [UX] 직군/경력 등 중요 정보 저장 시 사용자 피드백 제공 (요청사항)
            alert('정보가 저장되었습니다! ✅');
        } catch (error) {
            console.error('Failed to save basic info:', error);
            alert('저장 실패 ❌');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 relative">
            {/* 1. 헤더 섹션 (DetailProfileCard로 교체) */}
            {/* 1. 헤더 섹션 (DetailProfileCard + StatusDashboard) */}
            <section className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                <div className="lg:col-span-7 h-full">
                    <DetailProfileCard
                        user={userData}
                        title="프로필 상세"
                        isEditing={isEditing}
                        onEditAvatar={handleEditAvatar}
                        onUpdateUser={handleUpdateBasicInfo}
                    />
                </div>
                <div className="lg:col-span-3 h-full">
                    <StatusDashboard
                        status={userData.status}
                        user={userData}
                        isEditing={isEditing}
                        socialLinks={socialLinks}
                        onSaveLink={handleSaveSocialLink}
                    />
                </div>
            </section>

            {/* 2. 통계 및 활동 섹션 (GitHub, Skill, Blog, Solved.ac) */}
            <section className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                {/* Row 1: GitHub (70%) + Skill (30%) */}
                <div className="lg:col-span-7">
                    <GitHubStats githubUrl={userData.socialLinks?.github} />
                </div>
                <div className="lg:col-span-3">
                    <SkillSection
                        techTags={userData.techTags || []}
                        githubVerifiedTags={userData.githubStats?.techStack || []}
                        onUpdateTags={readOnly ? undefined : handleUpdateSkills}
                    />
                </div>

                {/* Row 2: Blog (70%) + Solved.ac (30%) */}
                <div className="lg:col-span-7">
                    <BlogPostCard blogUrl={userData.socialLinks?.blog} />
                </div>
                <div className="lg:col-span-3">
                    <SolvedAcCard handle={userData.socialLinks?.solvedAc} />
                </div>
            </section>

            {/* 3. 포트폴리오 섹션 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    📂 포트폴리오
                </h2>

                {/* 수정 모드일 때만 입력창 노출 */}
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
                        <div className="col-span-full py-8 text-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            등록된 포트폴리오가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            {/* 4. 가용성 및 협업 성향 섹션 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">📅 가용성 및 협업 성향</h2>
                    {!readOnly && isEditing && (
                        <button
                            onClick={handleSaveAvailability}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            저장하기
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div className="flex flex-col h-full">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">주간 가능한 시간</h3>
                        <div className={`border rounded-xl p-4 bg-gray-50 flex-1 ${readOnly ? 'pointer-events-none opacity-90' : ''}`}>
                            <AvailabilityScheduler
                                initialSchedule={schedule}
                                onChange={readOnly ? () => { } : setSchedule} // readOnly면 변경 불가
                            />
                            {!readOnly && (
                                <p className="text-xs text-gray-500 mt-2 text-center">드래그하여 가능한 시간을 선택해주세요.</p>
                            )}
                        </div>
                    </div>
                    <div className={`flex flex-col h-full ${(readOnly || !isEditing) ? 'pointer-events-none opacity-90' : ''}`}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">협업 스타일</h3>
                        <span className="flex-1">
                            <CommunicationStyleSlider
                                preference={preference}
                                onChangePreference={(readOnly || !isEditing) ? () => { } : setPreference}
                                tags={personalityTags}
                                onChangeTags={(readOnly || !isEditing) ? () => { } : setPersonalityTags}
                            />
                        </span>
                    </div>
                </div>
            </section>

            {/* 5. 자기소개 섹션 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">📝 자기소개</h2>
                    {!readOnly && isEditing && (
                        <button
                            onClick={handleSaveIntroduction}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            저장하기
                        </button>
                    )}
                </div>

                <div className="min-h-[400px]">
                    {/* BlockEditor는 readOnly prop을 지원해야 함. 지원 안 한다면 pointer-events-none 등으로 막아야 함 */}
                    <div className={(readOnly || !isEditing) ? 'pointer-events-none' : ''}>
                        <BlockEditor
                            content={introduction}
                            onChange={(readOnly || !isEditing) ? () => { } : setIntroduction}
                        />
                    </div>
                </div>
            </section>
            {/* Image Edit Modal */}
            <ImageEditModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSave={handleSaveAvatar}
                currentUrl={userData.avatarUrl}
            />
        </div>
    );
}
