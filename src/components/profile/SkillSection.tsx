'use client';

import React, { useState } from 'react';
import { getIconSlug, getSkillCategory, CATEGORY_ORDER, SkillCategory } from '@/lib/iconUtils';

interface SkillSectionProps {
    techTags?: string[];
    githubVerifiedTags?: string[];
    onUpdateTags?: (tags: string[]) => void;
}

export default function SkillSection({ techTags = [], githubVerifiedTags = [], onUpdateTags }: SkillSectionProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleAddManualTag = () => {
        if (newTag.trim()) {
            const tagToAdd = newTag.trim();
            if (!techTags.includes(tagToAdd)) {
                const updatedTags = [...techTags, tagToAdd];
                onUpdateTags?.(updatedTags);
            }
            setNewTag('');
            setIsAdding(false);
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        const updatedTags = techTags.filter(tag => tag !== tagToDelete);
        onUpdateTags?.(updatedTags);
    };

    // 통합 스킬 리스트 생성 및 카테고리화
    // techTags(전체)를 기준으로 순회하며 GitHub 인증 여부 확인
    const processedSkills = techTags.map(tagName => ({
        name: tagName,
        category: getSkillCategory(tagName),
        isVerified: githubVerifiedTags.includes(tagName)
    }));

    const groupedSkills = processedSkills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<SkillCategory, typeof processedSkills>);

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span>🛠️</span> 기술 스택
                </h2>

                {/* 항상 표시되는 레전드, 단 Verified 데이터가 있을 때만 강조 */}
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>GitHub Activity</span>
                </div>
            </div>

            <div className="space-y-8 mb-8 flex-grow">
                {techTags.length === 0 && (
                    <p className="text-sm text-muted-foreground">등록된 기술 스택이 없습니다.</p>
                )}

                {CATEGORY_ORDER.map((category) => {
                    const categorySkills = groupedSkills[category];
                    if (!categorySkills || categorySkills.length === 0) return null;

                    return (
                        <div key={category}>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider px-1 border-b border-border pb-1 inline-block">
                                {category}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {categorySkills.map((skill) => {
                                    const iconSlug = getIconSlug(skill.name);
                                    const iconUrl = `https://skillicons.dev/icons?i=${iconSlug}`;

                                    return (
                                        <div key={skill.name} className="relative group flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-xl border border-border/50 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all duration-200">
                                            {/* 스킬 아이콘 */}
                                            <div className="relative w-6 h-6 flex-shrink-0">
                                                <img
                                                    src={iconUrl}
                                                    alt={skill.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                {/* Green Light Indicator (Verified Only) */}
                                                {skill.isVerified && (
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-gray-800"></span>
                                                    </span>
                                                )}
                                            </div>

                                            <span className="text-sm font-medium text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                                {skill.name}
                                            </span>

                                            {/* 삭제 버튼 (호버 시 표시) */}
                                            {onUpdateTags && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTag(skill.name); }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                    title="삭제"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 통합된 추가 버튼 영역 */}
            <div className="mt-auto pt-4 border-t border-border">
                {!isAdding ? (
                    onUpdateTags && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                        >
                            + 기술 스택 직접 추가하기
                        </button>
                    )
                ) : (
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm border rounded bg-background text-foreground"
                            placeholder="기술명 (예: Next.js)"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddManualTag()}
                        />
                        <button onClick={handleAddManualTag} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">추가</button>
                        <button onClick={() => { setIsAdding(false); setNewTag(''); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">취소</button>
                    </div>
                )}
            </div>
        </div>
    );
}
