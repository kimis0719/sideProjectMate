'use client';

// StatusDashboard.tsx
import { useEffect, useState } from 'react';
import { calculateProfileCompleteness } from '@/lib/profileUtils';

interface StatusDashboardProps {
    status?: string;
    // Completeness calculation requires user data
    user?: any;
    // Social Edit Props
    isEditing?: boolean;
    socialLinks?: {
        github?: string;
        blog?: string;
        solvedAc?: string;
    };
    onSaveLink?: (key: string, value: string) => void;
}

export default function StatusDashboard({ status = '구직중', user, isEditing, socialLinks, onSaveLink }: StatusDashboardProps) {
    const [completeness, setCompleteness] = useState(0);

    // Local state for inputs to manage edits before save
    const [links, setLinks] = useState(socialLinks || { github: '', blog: '', solvedAc: '' });

    useEffect(() => {
        if (socialLinks) {
            setLinks(socialLinks);
        }
    }, [socialLinks]);

    useEffect(() => {
        if (!user) return;
        // [Fix] 클라이언트에서 실시간 계산 (저장 전에도 반영됨) + 서버와 동일 로직 사용 (일관성 보장)
        setCompleteness(calculateProfileCompleteness(user));
    }, [user]);



    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col justify-between space-y-6">
            {/* Current Status removed as it is now in DetailProfileCard */}

            <div className="flex-1">
                {/* [Fix] 타인 프로필에서는 완성도 점수 숨김 (요청사항) */}
                {isEditing ? (
                    <>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-muted-foreground">프로필 완성도</span>
                            <span className={`text-lg font-bold ${completeness === 100 ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                {completeness}%
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${completeness === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                                style={{ width: `${completeness}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {completeness < 50 ? '기본 정보를 입력하여 신뢰도를 높여보세요!' :
                                completeness < 80 ? '기술 스택과 소셜 링크를 추가해보세요.' :
                                    '완벽한 프로필입니다! 🚀'}
                        </p>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        {/* 타인 프로필일 때 보여줄 간단한 문구 또는 공란 */}
                        <p>함께 성장하는 동료입니다 👋</p>
                    </div>
                )}
            </div>

            {/* Social Links Input Section (Only visible when editing) */}
            {isEditing && onSaveLink && (
                <div className="border-t border-border pt-4 space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Social Links</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                GitHub
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={links.github}
                                    onChange={(e) => setLinks({ ...links, github: e.target.value })}
                                    placeholder="username"
                                    className="flex-1 text-xs p-2 border rounded bg-gray-50 dark:bg-muted"
                                />
                                <button
                                    onClick={() => onSaveLink('github', links.github || '')}
                                    className="px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900 whitespace-nowrap"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Blog URL (Velog, Tistory)</label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={links.blog}
                                    onChange={(e) => setLinks({ ...links, blog: e.target.value })}
                                    placeholder="https://blog.com"
                                    className="flex-1 text-xs p-2 border rounded bg-gray-50 dark:bg-muted"
                                />
                                <button
                                    onClick={() => onSaveLink('blog', links.blog || '')}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Solved.ac</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={links.solvedAc}
                                    onChange={(e) => setLinks({ ...links, solvedAc: e.target.value })}
                                    placeholder="ID"
                                    className="flex-1 text-xs p-2 border rounded bg-gray-50 dark:bg-muted"
                                />
                                <button
                                    onClick={() => onSaveLink('solvedAc', links.solvedAc || '')}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
