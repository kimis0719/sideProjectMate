'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const slides = [
  {
    id: 1,
    label: '팀 매칭',
    title: '함께 만드는\n즐거운 사이드 프로젝트',
    description: '디자이너, 기획자, 개발자를 위한 팀 매칭 플랫폼',
    accent: '#4f46e5',
  },
  {
    id: 2,
    label: '협업 툴',
    title: '당신의 아이디어를\n현실로 만들어보세요',
    description: '칸반 보드와 WBS로 팀 협업을 더 스마트하게',
    accent: '#7c3aed',
  },
  {
    id: 3,
    label: '성장',
    title: '새로운 협업의 시작\nSide Project Mate',
    description: '열정 넘치는 팀원들과 함께 성장하세요',
    accent: '#0891b2',
  },
];

const stats = [
  { value: '200+', label: '등록된 프로젝트', icon: '📋' },
  { value: '500+', label: '활동 중인 멤버', icon: '👥' },
  { value: '50+', label: '완성된 팀', icon: '🤝' },
  { value: '3가지', label: '협업 도구', icon: '⚡' },
];

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    title: '팀원 매칭',
    description:
      '역할별 모집과 기술 스택 필터로 딱 맞는 팀원을 찾아보세요. 프로필로 서로를 더 잘 알 수 있어요.',
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
    ),
    title: '칸반 보드',
    description:
      '드래그 앤 드롭으로 할 일을 관리하고, 실시간으로 팀원과 함께 작업 상태를 공유하세요.',
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    title: 'WBS 일정 관리',
    description:
      '간트 차트로 프로젝트 일정을 한눈에 파악하고, 태스크 의존성까지 체계적으로 관리하세요.',
    color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
];

export default function HeroSection() {
  const { data: session } = useSession();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const goPrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // 자동 슬라이드 (4초 간격, hover 시 일시 정지)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [isPaused, goNext]);

  const slide = slides[currentSlide];

  return (
    <>
      {/* ══════════════════════════════════════
                Hero Section
            ══════════════════════════════════════ */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="메인 배너"
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: slide.accent, transition: 'background-color 0.8s ease' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: slide.accent, transition: 'background-color 0.8s ease' }}
          />
          {/* 그리드 패턴 */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-2xl mx-auto text-center">
            {/* 슬라이드 레이블 */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6"
              style={{ transition: 'all 0.4s ease' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {slide.label}
            </div>

            {/* 메인 타이틀 — SEO h1 */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight whitespace-pre-line"
              style={{ transition: 'opacity 0.4s ease' }}
            >
              {slide.title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
              {slide.description}
            </p>

            {/* CTA — 로그인 상태에 따라 분기 */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {session ? (
                <>
                  <Link href="/projects" className="btn-primary px-6 py-3 text-base">
                    프로젝트 탐색
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                  <Link href="/projects/new" className="btn-secondary px-6 py-3 text-base">
                    + 새 프로젝트
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-primary px-6 py-3 text-base">
                    무료로 시작하기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                  <Link href="/projects" className="btn-secondary px-6 py-3 text-base">
                    프로젝트 둘러보기
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 슬라이드 컨트롤 */}
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background p-2.5 rounded-full shadow-md border border-border transition-all"
          aria-label="이전 슬라이드"
        >
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background p-2.5 rounded-full shadow-md border border-border transition-all"
          aria-label="다음 슬라이드"
        >
          <svg
            className="w-5 h-5 text-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 슬라이드 인디케이터 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`슬라이드 ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? 'bg-primary w-8'
                  : 'bg-foreground/20 w-1.5 hover:bg-foreground/40'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
                통계 섹션
            ══════════════════════════════════════ */}
      <section className="border-y border-border bg-card" aria-label="서비스 통계">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center py-2">
                <span className="text-2xl mb-1">{stat.icon}</span>
                <span className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</span>
                <span className="text-sm text-muted-foreground mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
                핵심 기능 소개 섹션
            ══════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-background" aria-label="주요 기능">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              왜 Side Project Mate인가요?
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              프로젝트 시작부터 완성까지
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              팀 매칭부터 협업 도구까지, 사이드 프로젝트에 필요한 모든 것을 한 곳에서
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="group p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}
                >
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
