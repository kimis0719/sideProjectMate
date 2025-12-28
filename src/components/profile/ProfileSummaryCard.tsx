'use client';

import React from 'react';

interface ProfileSummaryCardProps {
    user: {
        _id: string;
        nName: string;
        position: string;
        career: string;
        avatarUrl?: string; // Optional
        level?: number;     // GitHub Dev Level
        techTags?: string[]; // Top Skills
    };
    onClick?: () => void; // 카드 클릭 시 상세 페이지 이동 등
}

/**
 * @component ProfileSummaryCard
 * @description
 * 사용자 정보를 명함처럼 간략하게 보여주는 컴포넌트입니다.
 * 프로젝트 참여자 목록, 지원자 목록 등에서 사용됩니다.
 */
export default function ProfileSummaryCard({ user, onClick }: ProfileSummaryCardProps) {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
            {/* 아바타 영역 */}
            <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.nName} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl bg-gradient-to-br from-gray-100 to-gray-200">
                            {user.nName.charAt(0)}
                        </div>
                    )}
                </div>
                {/* 레벨 배지 (우측 하단) */}
                {user.level && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                        LV.{user.level}
                    </div>
                )}
            </div>

            {/* 텍스트 정보 영역 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-800 text-base truncate group-hover:text-indigo-600 transition-colors">
                        {user.nName}
                    </h3>
                    <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {user.career}
                    </span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-2">
                    {user.position}
                </p>

                {/* 기술 스택 태그 (최대 3개) */}
                {user.techTags && user.techTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {user.techTags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-medium rounded"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* 화살표 아이콘 */}
            <div className="text-gray-300 group-hover:text-gray-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}
