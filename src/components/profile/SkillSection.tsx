'use client';

import React, { useEffect, useState } from 'react';
import SkillTier from './SkillTier';

interface Skill {
    name: string;
    level: string;
    score: number;
    active: boolean;
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

                // 등급 매핑 함수
                const mapGradeToLevel = (grade: string) => {
                    if (['A+', 'A'].includes(grade)) return 'Pro';
                    if (['B+', 'B'].includes(grade)) return 'Advanced';
                    if (['C+', 'C'].includes(grade)) return 'Intermediate';
                    return 'Beginner';
                };

                // Language 데이터 변환
                const techSkills = (data.techTiers || []).map((tier: any) => ({
                    name: tier.language,
                    level: mapGradeToLevel(tier.grade),
                    score: tier.score,
                    active: true, // 기본적으로 최근 활동이 있는 것으로 간주
                }));

                // Environment (Framework/Topic) 데이터 변환
                const envSkills = (data.envTiers || []).map((tier: any) => ({
                    // 토픽 이름 첫 글자 대문자화 및 정리
                    name: tier.topic.charAt(0).toUpperCase() + tier.topic.slice(1),
                    level: mapGradeToLevel(tier.grade),
                    score: tier.score,
                    active: true,
                }));

                // 통합 및 점수순 정렬
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
        if (loading) return <div className="p-6 text-center text-gray-400">기술 스택 분석 중... 🔄</div>;
        // 데이터가 없으면 기존 mock 데이터라도 보여주는 게 나을 수 있음 (선택 사항)
        // 여기서는 일단 아무것도 안 보여주거나, 빈 상태 메시지
        return null;
    }

    // 레벨별로 데이터 분류
    const proSkills = skills.filter(s => s.level === 'Pro');
    const advancedSkills = skills.filter(s => s.level === 'Advanced');
    const intermediateSkills = skills.filter(s => s.level === 'Intermediate');
    const beginnerSkills = skills.filter(s => s.level === 'Beginner');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🛠️</span> 기술 스택
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span>Recent Activity (Based on GitHub)</span>
                </div>
            </div>

            <div className="space-y-2">
                {proSkills.length > 0 && <SkillTier tierName="Pro" skills={proSkills} />}
                {advancedSkills.length > 0 && <SkillTier tierName="Advanced" skills={advancedSkills} />}

                {(intermediateSkills.length > 0 || beginnerSkills.length > 0) && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {intermediateSkills.length > 0 && <SkillTier tierName="Intermediate" skills={intermediateSkills} />}
                        {beginnerSkills.length > 0 && <SkillTier tierName="Beginner" skills={beginnerSkills} />}
                    </div>
                )}
            </div>
        </div>
    );
}
