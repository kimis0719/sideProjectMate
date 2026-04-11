'use client';

import { useState, useEffect } from 'react';
import { IProject } from '@/lib/models/Project';

const MAX_LENGTH = 4000;

interface ProjectOverviewProps {
  project: IProject;
  isAuthor: boolean;
  onUpdate: (newOverview: string) => Promise<void>;
}

export default function ProjectOverview({ project, isAuthor, onUpdate }: ProjectOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [overview, setOverview] = useState(project.overview || project.description || '');
  const [isLoading, setIsLoading] = useState(false);

  // ✨ 프로젝트 데이터가 변경되면 로컬 상태도 업데이트해야 함
  useEffect(() => {
    setOverview(project.overview || project.description || '');
  }, [project.overview, project.description]);

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
    setOverview(project.overview || project.description || '');
    setIsEditing(false);
  };

  const isOverLimit = overview.length > MAX_LENGTH;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)] p-6 md:p-8 h-full md:max-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-lg font-semibold font-headline text-on-surface">프로젝트 개요</h2>
        {isAuthor && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-on-surface-variant hover:text-primary-container font-medium px-2 py-1 rounded-lg bg-surface-container-low transition-colors"
          >
            수정
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          <textarea
            value={overview}
            onChange={(e) => setOverview(e.target.value.slice(0, MAX_LENGTH + 100))}
            maxLength={MAX_LENGTH + 100}
            className={`w-full min-h-[160px] max-h-[240px] p-4 text-sm text-on-surface bg-surface-container-low border-none rounded-xl focus:outline-none focus:ring-2 resize-none ${
              isOverLimit ? 'focus:ring-error/30' : 'focus:ring-primary-container/20'
            }`}
            placeholder="프로젝트의 목표, 마일스톤, 현재 상황 등을 자유롭게 작성해주세요."
          />
          <div className="flex justify-between items-center shrink-0">
            <span
              className={`text-xs tabular-nums ${
                isOverLimit ? 'text-error font-bold' : 'text-on-surface-variant/50'
              }`}
            >
              {overview.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}자
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-on-primary bg-primary-container hover:opacity-90 rounded-lg transition-colors disabled:opacity-50"
                disabled={isLoading || isOverLimit}
              >
                {isLoading ? '저장 중...' : '저장 완료'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="max-w-none text-on-surface-variant whitespace-pre-wrap text-sm leading-relaxed break-all">
            {project.overview ? (
              project.overview
            ) : (
              <span className="text-on-surface-variant/50 italic">
                작성된 개요가 없습니다.
                {isAuthor && ' 우측 상단의 수정 버튼을 눌러 개요를 작성해보세요.'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
