'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 배너 데이터
  const banners = [
    {
      id: 1,
      title: '함께 만드는\n즐거운 사이드 프로젝트',
      description: '디자이너, 기획자, 개발자를 위한 프로젝트 매칭 플랫폼',
      bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100',
    },
    {
      id: 2,
      title: '당신의 아이디어를\n현실로 만들어보세요',
      description: '열정 넘치는 팀원들과 함께 성장하세요',
      bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100',
    },
    {
      id: 3,
      title: '새로운 협업의 시작\nSide Project Mate',
      description: '지금 바로 프로젝트를 시작해보세요',
      bgColor: 'bg-gradient-to-r from-green-100 to-teal-100',
    },
  ];

  // 프로젝트 카드 데이터
  const projects = [
    {
      id: 1,
      title: '🎨 디자인 포트폴리오 사이트 제작',
      category: '디자인',
      author: '김디자인',
      date: '2025.11.05',
      members: '2/4',
      tags: ['Figma', 'UI/UX', 'React'],
      image: '🎨',
    },
    {
      id: 2,
      title: '📱 헬스케어 모바일 앱 개발',
      category: '개발',
      author: '박개발',
      date: '2025.11.04',
      members: '3/5',
      tags: ['React Native', 'Node.js', 'MongoDB'],
      image: '📱',
    },
    {
      id: 3,
      title: '🎮 인디 게임 기획 및 개발',
      category: '게임',
      author: '이게임',
      date: '2025.11.03',
      members: '1/4',
      tags: ['Unity', '기획', '3D'],
      image: '🎮',
    },
    {
      id: 4,
      title: '🛒 이커머스 플랫폼 구축',
      category: '개발',
      author: '최코딩',
      date: '2025.11.02',
      members: '4/6',
      tags: ['Next.js', 'TypeScript', 'Tailwind'],
      image: '🛒',
    },
    {
      id: 5,
      title: '📊 데이터 시각화 대시보드',
      category: '데이터',
      author: '정데이터',
      date: '2025.11.01',
      members: '2/3',
      tags: ['Python', 'D3.js', 'PostgreSQL'],
      image: '📊',
    },
    {
      id: 6,
      title: '🎵 음악 스트리밍 서비스',
      category: '개발',
      author: '강음악',
      date: '2025.10.31',
      members: '3/5',
      tags: ['Vue.js', 'Express', 'AWS'],
      image: '🎵',
    },
    {
      id: 7,
      title: '📝 마크다운 에디터 개발',
      category: '개발',
      author: '윤에디터',
      date: '2025.10.30',
      members: '1/2',
      tags: ['React', 'Electron', 'Markdown'],
      image: '📝',
    },
    {
      id: 8,
      title: '🤖 AI 챗봇 서비스',
      category: 'AI',
      author: '신인공',
      date: '2025.10.29',
      members: '2/4',
      tags: ['Python', 'GPT', 'FastAPI'],
      image: '🤖',
    },
  ];

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white">
      {/* 이미지 배너 영역 */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`min-w-full h-full flex items-center justify-center ${banner.bgColor}`}
            >
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 whitespace-pre-line">
                  {banner.title}
                </h2>
                <p className="text-lg md:text-xl text-gray-700 mb-8">
                  {banner.description}
                </p>
                <Link
                  href="/register"
                  className="inline-block px-8 py-3 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  지금 시작하기
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 좌우 버튼 */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 인디케이터 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index ? 'bg-gray-800 w-8' : 'bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 검색 및 필터링 영역 */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* 검색 */}
            <div className="w-full md:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="프로젝트를 검색하세요"
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* 필터 */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option>전체 카테고리</option>
                <option>디자인</option>
                <option>개발</option>
                <option>기획</option>
                <option>마케팅</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option>모집중</option>
                <option>진행중</option>
                <option>완료</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option>최신순</option>
                <option>인기순</option>
                <option>마감임박순</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 게시판 목록 영역 */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">추천 프로젝트</h2>
          <Link href="/projects" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            전체보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer"
            >
              {/* 썸네일 */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl">
                {project.image}
              </div>

              {/* 내용 */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                    {project.category}
                  </span>
                  <span className="text-xs text-gray-500">{project.members}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                  {project.title}
                </h3>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>{project.author}</span>
                  <span>{project.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 더보기 버튼 */}
        <div className="text-center mt-12">
          <button className="px-12 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200">
            더 많은 프로젝트 보기
          </button>
        </div>
      </section>
    </div>
  );
}
