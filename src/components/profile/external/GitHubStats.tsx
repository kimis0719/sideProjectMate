'use client';

import React, { useEffect, useState } from 'react';
import { GitHubStats } from '@/lib/github/utils';
import { getIconSlug } from '@/lib/iconUtils';

interface GitHubStatsProps {
    githubUrl?: string; // e.g., https://github.com/username
}

export default function GitHubStatsSection({ githubUrl }: GitHubStatsProps) {
    const [stats, setStats] = useState<GitHubStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Extract username from URL
    const getUsername = (url: string) => {
        try {
            if (!url) return null;
            const urlObj = new URL(url);
            const pathSegments = urlObj.pathname.split('/').filter(Boolean);
            // Return the first segment as username (e.g. /username or /username/repo)
            return pathSegments[0] || null;
        } catch (e) {
            // Fallback for non-standard URLs
            const cleanUrl = url.replace(/\/$/, '');
            const parts = cleanUrl.split('/');
            return parts[parts.length - 1];
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            const username = getUsername(githubUrl || '');
            if (!username) return;

            setLoading(true);
            try {
                const res = await fetch(`/api/users/github-stats?username=${username}`);
                if (!res.ok) throw new Error('Failed to load GitHub stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error(err);
                setError('GitHub 정보를 불러올 수 없습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (githubUrl) {
            fetchStats();
        }
    }, [githubUrl]);

    if (!githubUrl) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                    <svg height="32" viewBox="0 0 16 16" width="32" className="fill-current text-muted-foreground">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">GitHub 연동이 필요합니다</h3>
                <p className="text-sm text-muted-foreground mb-4">GitHub 계정을 연결하면 활동 분석과 기여도를 확인할 수 있습니다.</p>
            </div>
        );
    }
    if (loading) return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex items-center justify-center min-h-[300px]">
            <div className="text-muted-foreground animate-pulse">GitHub 데이터 분석 중...</div>
        </div>
    );
    if (error) return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex items-center justify-center min-h-[300px]">
            <div className="text-destructive">{error}</div>
        </div>
    );
    if (!stats) return null;

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <svg height="24" viewBox="0 0 16 16" width="24" className="fill-current text-foreground">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                GitHub Analysis
            </h2>

            {/* Top Section: Analysis & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Left: Activity Score / Level */}
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/30">
                    <div className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-2">DEV LEVEL</div>
                    <div className="text-4xl font-extrabold text-indigo-900 dark:text-indigo-300 mb-1">LV. {stats.level.value}</div>
                    <div className="text-lg text-indigo-700 dark:text-indigo-200 font-medium bg-card px-3 py-1 rounded-full shadow-sm mb-4">
                        {stats.level.label}
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-card p-2 rounded text-center">
                            <div className="text-muted-foreground text-xs">Commits</div>
                            <div className="font-bold text-foreground">{stats.activity.totalCommits.toLocaleString()}</div>
                        </div>
                        <div className="bg-card p-2 rounded text-center">
                            <div className="text-muted-foreground text-xs">Merged PRs</div>
                            <div className="font-bold text-foreground">{stats.activity.totalPRs}</div>
                        </div>
                        <div className="bg-card p-2 rounded text-center">
                            <div className="text-muted-foreground text-xs">Code Reviews</div>
                            <div className="font-bold text-foreground">{stats.activity.totalReviews}</div>
                        </div>
                        <div className="bg-card p-2 rounded text-center">
                            <div className="text-muted-foreground text-xs">Issues</div>
                            <div className="font-bold text-foreground">{stats.activity.totalIssues}</div>
                        </div>
                    </div>
                </div>

                {/* Right: Top Skills */}
                <div className="flex flex-col h-full">
                    <div className="text-sm text-muted-foreground font-semibold mb-3 uppercase tracking-wider">Top Skills via Contribution</div>
                    <div className="space-y-2 flex-grow overflow-y-auto pr-1 custom-scrollbar" style={{ maxHeight: '250px' }}>
                        {(() => {
                            const langs = stats.techTiers.map(t => ({ name: t.language, ...t, type: 'Lang' }));
                            const envs = (stats.envTiers || []).map(t => ({ name: t.topic, ...t, type: 'Env' }));
                            const topSkills = [...langs, ...envs].sort((a, b) => b.score - a.score).slice(0, 5);

                            if (topSkills.length === 0) return <div className="text-gray-400 text-sm italic">기여한 리포지토리가 없습니다.</div>;

                            return topSkills.map((tier) => {
                                const iconSlug = getIconSlug(tier.name);
                                const iconUrl = `https://skillicons.dev/icons?i=${iconSlug}`;
                                return (
                                    <div key={tier.name} className="flex items-center justify-between bg-card p-2 rounded-lg border border-border hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center p-0.5">
                                                <img src={iconUrl} alt={tier.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-sm">{tier.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold w-6 text-center 
                                                ${tier.grade.startsWith('A') ? 'bg-purple-100 text-purple-700' : ''}
                                                ${tier.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' : ''}
                                                ${tier.grade.startsWith('C') ? 'bg-green-100 text-green-700' : ''}
                                                ${tier.grade.startsWith('D') ? 'bg-yellow-100 text-yellow-700' : ''}
                                                ${['E', 'F'].includes(tier.grade) ? 'bg-gray-100 text-gray-600' : ''}
                                            `}>
                                                {tier.grade}
                                            </span>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Heatmap & Repos (New) */}
            <div className="pt-6 border-t border-border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mini Heatmap */}
                    <div>
                        <div className="text-sm text-muted-foreground font-semibold mb-3 flex justify-between items-center">
                            <span>RECENT CONTRIBUTIONS</span>
                            <span className="text-xs font-normal bg-muted px-2 py-0.5 rounded text-foreground">Last 16 Weeks</span>
                        </div>
                        {stats.contributionCalendar?.weeks ? (
                            <div className="flex gap-1 overflow-hidden" style={{ height: '80px', alignItems: 'flex-end' }}>
                                {stats.contributionCalendar.weeks.slice(-16).map((week, wIdx) => (
                                    <div key={wIdx} className="flex flex-col gap-1">
                                        {week.contributionDays.map((day, dIdx) => {
                                            let bgClass = 'bg-gray-100 dark:bg-gray-800';
                                            if (day.contributionCount > 0) bgClass = 'bg-green-200 dark:bg-green-900/40';
                                            if (day.contributionCount >= 3) bgClass = 'bg-green-300 dark:bg-green-800/60';
                                            if (day.contributionCount >= 5) bgClass = 'bg-green-400 dark:bg-green-600';
                                            if (day.contributionCount >= 10) bgClass = 'bg-green-500 dark:bg-green-500';

                                            return (
                                                <div
                                                    key={dIdx}
                                                    title={`${day.date}: ${day.contributionCount} contributions`}
                                                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm ${bgClass}`}
                                                ></div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No contribution data available.</div>
                        )}
                    </div>

                    {/* Most Active Repos */}
                    <div>
                        <div className="text-sm text-muted-foreground font-semibold mb-3 uppercase tracking-wider">Most Active Projects</div>
                        <div className="space-y-2">
                            {stats.topRepos && stats.topRepos.length > 0 ? (
                                stats.topRepos.slice(0, 2).map((repo, idx) => (
                                    <div key={idx} className="bg-muted/30 p-2.5 rounded-lg border border-border/50 flex justify-between items-center">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="text-lg">📚</div>
                                            <div className="truncate font-medium text-sm text-foreground" title={repo.name}>{repo.name}</div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs flex-shrink-0">
                                            <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
                                                <span>★</span> {repo.stars}
                                            </span>
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-semibold bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                                +{repo.contributions}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground">No active repositories found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
