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
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {user.nName || '이름 없음'}
                            </h1>
                            {user.position && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                    {user.position}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>

                    {user.introduction && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {user.introduction}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                        {user.career && (
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                                🏢 {user.career}
                            </span>
                        )}
                        {/* 소셜 링크 아이콘들 (임시 텍스트 버튼) */}
                        {user.socialLinks?.github && (
                            <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                GitHub
                            </a>
                        )}
                        {user.socialLinks?.blog && (
                            <a href={user.socialLinks.blog} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                                Blog
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
