'use client';

import React from 'react';
import Image from 'next/image';

interface SimpleProfileCardProps {
    user: {
        _id: string;
        nName: string;
        position?: string;
        career?: string;
        avatarUrl?: string; // Optional
        level?: number;     // GitHub Dev Level
        techTags?: string[]; // Top Skills
        introduction?: string;
    };
    onClick?: () => void; // 카드 클릭 시 상세 페이지 이동 등
}

/**
 * @component SimpleProfileCard
 * @description
 * 사용자 정보를 명함처럼 간략하게 보여주는 컴포넌트입니다.
 * 프로젝트 참여자 목록, 지원자 목록 등에서 사용됩니다.
 * (구 ProfileSummaryCard)
 */
// 심플 카드에서도 자기소개를 보여주고, 레벨 배지를 좀 더 명확하게 개선
export default function SimpleProfileCard({ user, onClick }: SimpleProfileCardProps) {
    return (
        <div
            onClick={onClick}
            className="flex flex-col gap-3 bg-white dark:bg-card p-4 rounded-xl border border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full"
        >
            <div className="flex items-center gap-4">
                {/* 아바타 영역 */}
                <div className="relative flex-shrink-0">
                    <div className="relative w-14 h-14 rounded-full bg-gray-200 overflow-hidden border border-gray-100 dark:border-border">
                        {user.avatarUrl ? (
                            <Image
                                src={user.avatarUrl}
                                alt={user.nName}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold text-lg">
                                {user.nName?.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                </div>

                {/* 텍스트 정보 영역 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-foreground text-base truncate group-hover:text-indigo-600 transition-colors">
                            {user.nName}
                        </h3>
                        {user.level !== undefined && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 text-[10px] font-bold rounded-full">
                                LV.{user.level}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        <span>{user.position || '포지션 미설정'}</span>
                        {user.career && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span>{user.career}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 자기소개 (한 줄 말줄임) */}
            {user.introduction && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[2.5rem] bg-muted/30 p-2 rounded-lg">
                    {user.introduction.replace(/<[^>]*>?/gm, '')}
                </p>
            )}

            {/* 기술 스택 태그 (최대 5개) */}
            {user.techTags && user.techTags.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    {user.techTags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded-md border border-blue-100 dark:border-blue-900/30"
                        >
                            {tag}
                        </span>
                    ))}
                    {user.techTags.length > 4 && (
                        <span className="px-1.5 py-0.5 text-xs text-muted-foreground">+{user.techTags.length - 4}</span>
                    )}
                </div>
            ) : (
                <div className="mt-auto pt-2 text-xs text-muted-foreground">
                    등록된 스킬이 없습니다.
                </div>
            )}
        </div>
    );
}
