import type { Metadata } from 'next';
import React from 'react';
import HeroSection from '@/components/HeroSection';
import ProjectList from '@/components/projects/ProjectList';
import LandingPreview from '@/components/LandingPreview';
import AdBanner from '@/components/common/AdBanner';

export const metadata: Metadata = {
  title: 'Side Project Mate — 아이디어를 빠르게 실행할 동료를 찾아요',
  description:
    '기술 역할이 아니라 같은 문제에 꽂힌 사람을 찾는 팀 매칭 플랫폼. AI 칸반 보드로 함께 만들어가세요.',
  openGraph: {
    title: 'Side Project Mate — 사이드 프로젝트 팀 매칭',
    description:
      '아이디어를 빠르게 실행할 동료를 찾아요. AI 칸반 보드로 함께 만들어가는 팀 매칭 플랫폼.',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <HeroSection />

      <div className="container mx-auto px-4">
        <AdBanner
          unitId={process.env.NEXT_PUBLIC_ADFIT_HOME_PC}
          unitIdMobile={process.env.NEXT_PUBLIC_ADFIT_HOME_MOBILE}
          size="auto"
          className="py-4"
        />
      </div>

      {/* LandingPreview: 세션에 따라 비회원 미리보기 / 로그인 전체 목록 분기 */}
      <LandingPreview>
        <ProjectList />
      </LandingPreview>
    </div>
  );
}
