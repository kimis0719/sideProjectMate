'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const features = [
  {
    icon: 'group_add',
    title: 'AI 스마트 도메인 매칭',
    description:
      '당신의 경력과 기술 스택, 그리고 프로젝트의 성향을 AI가 정밀 분석하여 가장 시너지가 날 수 있는 팀원을 추천합니다.',
    tags: ['Recruiting', 'Domain Expert'],
    colSpan: 'md:col-span-8',
  },
  {
    icon: 'dashboard',
    title: '실시간 AI 칸반 보드',
    description:
      'AI가 프로젝트 맥락을 읽고 실행 지시서를 자동 생성합니다. 드래그 앤 드롭으로 실시간 협업하세요.',
    tags: ['Real-time', 'AI Powered'],
    colSpan: 'md:col-span-4',
  },
  {
    icon: 'route',
    title: '자동 로드맵 생성',
    description: 'WBS 기반 로드맵을 AI가 자동으로 생성하고, 마일스톤별 진행률을 한눈에 추적하세요.',
    tags: ['Automation'],
    colSpan: 'md:col-span-4',
  },
  {
    icon: 'chat_bubble',
    title: '팀 커뮤니케이션',
    description:
      '실시간 채팅과 알림으로 팀원과 소통하세요. 프로젝트별 채팅방에서 맥락을 잃지 않고 대화할 수 있습니다.',
    tags: ['Chat', 'Notifications'],
    colSpan: 'md:col-span-8',
  },
];

export default function HeroSection() {
  const { data: session } = useSession();

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 px-8 lg:px-24 bg-surface">
        <div className="max-w-7xl mx-auto min-h-[480px] lg:min-h-[560px] flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 flex flex-col gap-8">
            <h1 className="text-4xl md:text-[3.5rem] leading-[1.1] font-bold font-headline tracking-tight text-on-surface">
              아이디어를 현실로,
              <br />
              최적의 팀원을 만나보세요
            </h1>
            <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed">
              AI 기반 도메인 매칭과 자동 생성되는 로드맵으로 사이드 프로젝트의 시작부터 끝까지,
              SPM이 당신의 완벽한 메이트가 되어드립니다.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              {session ? (
                <>
                  <Link
                    href="/projects"
                    className="bg-primary-container text-on-primary px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:translate-x-1 shadow-sm"
                  >
                    프로젝트 탐색
                  </Link>
                  <Link
                    href="/projects/new"
                    className="text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-surface-container-low transition-all"
                  >
                    + 새 프로젝트
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="bg-primary-container text-on-primary px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:translate-x-1 shadow-sm"
                  >
                    시작하기
                  </Link>
                  <Link
                    href="/projects"
                    className="text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-surface-container-low transition-all"
                  >
                    프로젝트 둘러보기
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2 mt-16 md:mt-0 relative">
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_40px_80px_rgba(26,28,28,0.08)] transform md:rotate-2">
              <div className="rounded-lg w-full h-64 md:h-80 bg-surface-container-low flex items-center justify-center border border-outline-variant/15">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">
                  dashboard
                </span>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-8 bg-surface-container-lowest p-6 rounded-xl shadow-lg hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">AI Matching Complete</p>
                  <p className="text-xs text-on-surface-variant">
                    3명의 새로운 팀원이 제안되었습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 px-8 lg:px-24 bg-surface-container-low" aria-label="주요 기능">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase mb-4 block">
              Key Features
            </span>
            <h2 className="text-4xl font-bold font-headline text-on-surface">
              프로젝트 성공을 위한 올인원 솔루션
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className={`${feat.colSpan} bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between min-h-[280px]`}
              >
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-6">
                    {feat.icon}
                  </span>
                  <h3 className="text-2xl font-bold text-on-surface mb-4">{feat.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed max-w-md">
                    {feat.description}
                  </p>
                </div>
                <div className="mt-8 flex gap-2">
                  {feat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
