'use client';

import { useState, useEffect } from 'react';
import { IProject } from '@/lib/models/Project';

interface ProjectOverviewProps {
    project: IProject;
    isAuthor: boolean;
    onUpdate: (newOverview: string) => Promise<void>;
}

export default function ProjectOverview({ project, isAuthor, onUpdate }: ProjectOverviewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [overview, setOverview] = useState(project.overview || project.content || '');
    const [isLoading, setIsLoading] = useState(false);

    // ✨ 프로젝트 데이터가 변경되면 로컬 상태도 업데이트해야 함
    useEffect(() => {
        setOverview(project.overview || project.content || '');
    }, [project.overview, project.content]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onUpdate(overview);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setOverview(project.overview || project.content || '');
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative group">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold dark:text-slate-100">프로젝트 개요</h2>
                {isAuthor && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="transition-opacity text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                    >
                        수정
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <textarea
                        value={overview}
                        onChange={(e) => setOverview(e.target.value)}
                        className="w-full h-48 p-3 text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-slate-50 dark:bg-slate-800"
                        placeholder="프로젝트의 목표, 마일스톤, 현재 상황 등을 자유롭게 작성해주세요."
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? '저장 중...' : '저장 완료'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="prose max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {project.overview ? (
                        project.overview
                    ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">
                            작성된 개요가 없습니다.{isAuthor && ' 우측 상단의 수정 버튼을 눌러 개요를 작성해보세요.'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
