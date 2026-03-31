import type { Metadata } from 'next';
import React from 'react';
import HeroSection from '@/components/HeroSection';
import ProjectList from '@/components/projects/ProjectList';
import AdBanner from '@/components/common/AdBanner';

export const metadata: Metadata = {
  title: 'Side Project Mate — 사이드 프로젝트 팀 매칭 플랫폼',
  description:
    '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 팀 매칭 플랫폼. 칸반 보드, WBS, 실시간 협업 도구까지.',
  openGraph: {
    title: 'Side Project Mate',
    description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 팀 매칭 플랫폼',
    type: 'website',
  },
};

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero + 통계 + 기능 소개 섹션 */}
      <HeroSection />

      {/* 광고 배너 — HeroSection과 프로젝트 목록 사이 */}
      <div className="container mx-auto px-4">
        <AdBanner
          unitId={process.env.NEXT_PUBLIC_ADFIT_HOME_PC}
          unitIdMobile={process.env.NEXT_PUBLIC_ADFIT_HOME_MOBILE}
          size="auto"
          className="py-4"
        />
      </div>

      {/* 프로젝트 목록 */}
      <div className="container mx-auto px-4 py-10">
        <ProjectList />
      </div>
    </div>
  );
}
