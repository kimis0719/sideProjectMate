'use client';

import Link from 'next/link';

interface ProfileHeaderProps {
    user: {
        nName?: string;
        email: string;
        position?: string;
        career?: string;
        introduction?: string;
        socialLinks?: {
            github?: string;
            blog?: string;
            linkedin?: string;
            other?: string;
        };
    };
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
            <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* 아바타 영역 */}
                <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
                        {user.nName ? user.nName.substring(0, 1).toUpperCase() : 'U'}
                    </div>
                </div>

                {/* 정보 영역 */}
                <div className="flex-grow space-y-3">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-foreground">
                                {user.nName || '이름 없음'}
                            </h1>
                            {user.position && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                    {user.position}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    {user.introduction && (
                        <p className="text-foreground text-sm leading-relaxed">
                            {user.introduction}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                        {user.career && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                                🏢 {user.career}
                            </span>
                        )}
                        {/* 소셜 링크 아이콘들 (임시 텍스트 버튼) */}
                        {user.socialLinks?.github && (
                            <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                GitHub
                            </a>
                        )}
                        {user.socialLinks?.blog && (
                            <a href={user.socialLinks.blog} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                Blog
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
