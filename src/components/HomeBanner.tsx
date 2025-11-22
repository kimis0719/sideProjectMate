'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// 메인 페이지의 배너 슬라이더 컴포넌트
// 클라이언트 사이드 인터랙션(슬라이드 전환)이 필요하므로 'use client' 사용
export default function HomeBanner() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const banners = [
        { id: 1, title: '함께 만드는\n즐거운 사이드 프로젝트', description: '디자이너, 기획자, 개발자를 위한 프로젝트 매칭 플랫폼', bgColor: 'bg-gradient-to-r from-purple-100 to-pink-100' },
        { id: 2, title: '당신의 아이디어를\n현실로 만들어보세요', description: '열정 넘치는 팀원들과 함께 성장하세요', bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100' },
        { id: 3, title: '새로운 협업의 시작\nSide Project Mate', description: '지금 바로 프로젝트를 시작해보세요', bgColor: 'bg-gradient-to-r from-green-100 to-teal-100' },
    ];

    // 이전 슬라이드로 이동
    const handlePrevSlide = () => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    // 다음 슬라이드로 이동
    const handleNextSlide = () => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

    return (
        <section className="relative h-[400px] md:h-[500px] overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out h-full" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {banners.map((banner) => (
                    <div key={banner.id} className={`min-w-full h-full flex items-center justify-center ${banner.bgColor} dark:from-gray-800 dark:to-gray-700`}>
                        <div className="container mx-auto px-4 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 whitespace-pre-line">{banner.title}</h2>
                            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">{banner.description}</p>
                            <Link href="/projects/new" className="inline-block px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors">지금 시작하기</Link>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handlePrevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all"><svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={handleNextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 p-3 rounded-full shadow-lg transition-all"><svg className="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                    <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-gray-800 dark:bg-white w-8' : 'bg-white/60 dark:bg-gray-400/60'}`} />
                ))}
            </div>
        </section>
    );
}
