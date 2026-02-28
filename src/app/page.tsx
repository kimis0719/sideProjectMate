import type { Metadata } from 'next';
import React from 'react';
import HeroSection from '@/components/HeroSection';
import ProjectList from '@/components/projects/ProjectList';
import dbConnect from '@/lib/mongodb';
import CommonCode, { ICommonCode } from '@/lib/models/CommonCode';

export const metadata: Metadata = {
  title: 'Side Project Mate — 사이드 프로젝트 팀 매칭 플랫폼',
  description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 팀 매칭 플랫폼. 칸반 보드, WBS, 실시간 협업 도구까지.',
  openGraph: {
    title: 'Side Project Mate',
    description: '디자이너, 기획자, 개발자를 위한 사이드 프로젝트 팀 매칭 플랫폼',
    type: 'website',
  },
};

// 공통 코드를 가져오는 헬퍼 함수 (서버 사이드)
async function getCommonCodes(group: string) {
  await dbConnect();
  const codes: any[] = await CommonCode.find({ group, isActive: true }).sort('order').lean();
  return codes.map(code => ({
    ...code,
    _id: code._id.toString(),
  })) as ICommonCode[];
}

export default async function Home() {
  const [categoryCodes, statusCodes] = await Promise.all([
    getCommonCodes('CATEGORY'),
    getCommonCodes('STATUS'),
  ]);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero + 통계 + 기능 소개 섹션 */}
      <HeroSection />

      {/* 프로젝트 목록 */}
      <div className="container mx-auto px-4 py-10">
        <ProjectList categoryCodes={categoryCodes} statusCodes={statusCodes} />
      </div>
    </div>
  );
}
