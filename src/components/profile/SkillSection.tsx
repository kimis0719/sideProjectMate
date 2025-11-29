'use client';

import SkillTier from './SkillTier';

// 임시 데이터 (추후 DB 연동)
const mockSkills = [
    { name: 'React', level: 'Pro', score: 95, active: true },
    { name: 'Next.js', level: 'Pro', score: 92, active: true },
    { name: 'TypeScript', level: 'Advanced', score: 85, active: true },
    { name: 'Node.js', level: 'Advanced', score: 78, active: false },
    { name: 'TailwindCSS', level: 'Advanced', score: 88, active: true },
    { name: 'MongoDB', level: 'Intermediate', score: 65, active: false },
    { name: 'PostgreSQL', level: 'Intermediate', score: 60, active: false },
    { name: 'Docker', level: 'Beginner', score: 45, active: false },
    { name: 'AWS', level: 'Beginner', score: 40, active: false },
    { name: 'Figma', level: 'Beginner', score: 30, active: true },
];

export default function SkillSection() {
    // 레벨별로 데이터 분류
    const proSkills = mockSkills.filter(s => s.level === 'Pro');
    const advancedSkills = mockSkills.filter(s => s.level === 'Advanced');
    const intermediateSkills = mockSkills.filter(s => s.level === 'Intermediate');
    const beginnerSkills = mockSkills.filter(s => s.level === 'Beginner');

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
                    <span>Recent Activity (6mo)</span>
                </div>
            </div>

            <div className="space-y-2">
                <SkillTier tierName="Pro" skills={proSkills} />
                <SkillTier tierName="Advanced" skills={advancedSkills} />

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkillTier tierName="Intermediate" skills={intermediateSkills} />
                    <SkillTier tierName="Beginner" skills={beginnerSkills} />
                </div>
            </div>
        </div>
    );
}
