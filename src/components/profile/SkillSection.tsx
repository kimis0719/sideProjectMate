'use client';

import React, { useEffect, useState } from 'react';
import { getIconSlug, getSkillCategory, CATEGORY_ORDER, SkillCategory } from '@/lib/iconUtils';

interface Skill {
    name: string;
    score: number;
    active: boolean;
    category: SkillCategory;
}

interface SkillSectionProps {
    githubUsername?: string;
}

export default function SkillSection({ githubUsername }: SkillSectionProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!githubUsername) return;

        const fetchSkills = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/github-stats?username=${githubUsername}`);
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();

                // 단순 리스트로 변환 (티어 로직 제거) 및 카테고리 분류
                const techSkills = (data.techTiers || []).map((tier: any) => ({
                    name: tier.language,
                    score: tier.score,
                    active: true, // GitHub에서 가져온 건 활동 중인 것으로 간주
                    category: getSkillCategory(tier.language)
                }));

                const envSkills = (data.envTiers || []).map((tier: any) => ({
                    name: tier.topic, // 이미 정규화된 이름
                    score: tier.score,
                    active: true,
                    category: getSkillCategory(tier.topic)
                }));

                // 점수순 정렬
                const allSkills = [...techSkills, ...envSkills].sort((a, b) => b.score - a.score);
                setSkills(allSkills);
            } catch (error) {
                console.error('Skill fetching error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSkills();
    }, [githubUsername]);

    if (!githubUsername || skills.length === 0) {
        if (loading) return <div className="p-6 text-center text-muted-foreground">기술 스택 분석 중... 🔄</div>;
        return null;
    }

    // 카테고리별로 그룹화
    const groupedSkills = skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<SkillCategory, Skill[]>);

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span>🛠️</span> 기술 스택
                </h2>

                {/* Green Light Legend (Header로 이동) */}
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>Recent Activity</span>
                </div>
            </div>

            <div className="space-y-8">
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
                                                {/* 초록불 (Active Indicator) - 아이콘 우측 상단 */}
                                                {skill.active && (
                                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-gray-800"></span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* 스킬 이름 */}
                                            <span className="text-sm font-medium text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                                {skill.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 기술 추가 버튼 (맨 아래로 이동) */}
            <div className="mt-8 pt-4 border-t border-border text-center">
                <button className="text-sm text-muted-foreground hover:text-blue-500 flex items-center justify-center gap-1 w-full py-2 hover:bg-muted/50 rounded-lg transition-colors dashed-border">
                    <span>+ 기술 직접 추가하기</span>
                </button>
            </div>
        </div>
    );
}
