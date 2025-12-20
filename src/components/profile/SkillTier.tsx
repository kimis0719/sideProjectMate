'use client';

interface Skill {
    name: string;
    level: string; // 'Pro', 'Advanced', 'Intermediate', 'Beginner'
    score: number; // 0-100
    active: boolean; // 최근 6개월 내 활동 여부
}

interface SkillTierProps {
    tierName: string;
    skills: Skill[];
}

export default function SkillTier({ tierName, skills }: SkillTierProps) {
    if (skills.length === 0) return null;

    const isHighTier = ['Pro', 'Advanced'].includes(tierName);

    // 상위 티어 (Pro, Advanced) - 초소형 카드형 그리드 레이아웃
    if (isHighTier) {
        return (
            <div className="mb-6">
                <h3 className={`text-base font-bold mb-3 px-2 py-0.5 inline-flex items-center rounded-md ${tierName === 'Pro'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                    <span className="mr-1.5 text-sm">{tierName === 'Pro' ? '🏆' : '⚡'}</span>
                    {tierName} Level
                </h3>

                <div className="flex flex-wrap justify-center gap-2">
                    {skills.map((skill) => (
                        <div key={skill.name} className="bg-card border border-border rounded-lg p-2 hover:border-indigo-500 transition-colors duration-200 flex items-center justify-between group shadow-sm hover:shadow-md min-w-[80px]">
                            <span className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                {skill.name}
                            </span>
                            {skill.active && (
                                <span className="relative flex h-1.5 w-1.5 flex-shrink-0 ml-2" title="Recent Activity">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 하위 티어 (Intermediate, Beginner) - 태그형 클라우드 레이아웃
    return (
        <div className="mb-4 text-center">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-1">
                {tierName} Level
            </h3>

            <div className="flex flex-wrap justify-center gap-1.5">
                {skills.map((skill) => (
                    <div key={skill.name} className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/50 border border-border text-xs text-foreground hover:bg-muted transition-colors">
                        <span>{skill.name}</span>
                        {skill.active && (
                            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500" title="Recent Activity"></span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
