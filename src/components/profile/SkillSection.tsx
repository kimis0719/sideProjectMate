'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getIconSlug, getSkillCategory, CATEGORY_ORDER, SkillCategory } from '@/lib/iconUtils';
import { useModal } from '@/hooks/useModal';

interface SkillSectionProps {
  techTags?: string[];
  githubVerifiedTags?: string[];
  onUpdateTags?: (tags: string[]) => void;
}

export default function SkillSection({
  techTags = [],
  githubVerifiedTags = [],
  onUpdateTags,
}: SkillSectionProps) {
  const { alert } = useModal();
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddManualTag = async () => {
    if (newTag.trim()) {
      const tagToAdd = newTag.trim();
      if (tagToAdd.length > 20) {
        await alert('입력 제한', '기술 스택은 20자 이내로 입력해주세요. 😅');
        return;
      }
      if (!techTags.includes(tagToAdd)) {
        const updatedTags = [...techTags, tagToAdd];
        onUpdateTags?.(updatedTags);
      }
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const updatedTags = techTags.filter((tag) => tag !== tagToDelete);
    onUpdateTags?.(updatedTags);
  };

  // 통합 스킬 리스트 생성 및 카테고리화
  // techTags(전체)를 기준으로 순회하며 GitHub 인증 여부 확인
  const processedSkills = techTags.map((tagName) => ({
    name: tagName,
    category: getSkillCategory(tagName),
    isVerified: githubVerifiedTags.includes(tagName),
  }));

  const groupedSkills = processedSkills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<SkillCategory, typeof processedSkills>
  );

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 lg:p-10 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-headline text-on-surface">기술 스택</h2>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>GitHub Activity</span>
        </div>
      </div>

      <div className="space-y-8 mb-8 flex-grow">
        {techTags.length === 0 && (
          <p className="text-sm text-on-surface-variant">등록된 기술 스택이 없습니다.</p>
        )}

        {CATEGORY_ORDER.map((category) => {
          const categorySkills = groupedSkills[category];
          if (!categorySkills || categorySkills.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-widest px-1">
                {category}
              </h3>
              <div className="flex flex-wrap gap-3">
                {categorySkills.map((skill) => {
                  const iconSlug = getIconSlug(skill.name);
                  const iconUrl = `https://skillicons.dev/icons?i=${iconSlug}`;

                  return (
                    <div
                      key={skill.name}
                      className="relative group flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl hover:bg-surface-bright hover:shadow-sm transition-all duration-200"
                    >
                      {/* 스킬 아이콘 */}
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image
                          src={iconUrl}
                          alt={skill.name}
                          width={24}
                          height={24}
                          className="w-full h-full object-contain"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {/* Green Light Indicator (Verified Only) */}
                        {skill.isVerified && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-gray-800"></span>
                          </span>
                        )}
                      </div>

                      <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                        {skill.name}
                      </span>

                      {/* 삭제 버튼 (호버 시 표시) */}
                      {onUpdateTags && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTag(skill.name);
                          }}
                          className="absolute -top-2 -right-2 bg-error text-on-error rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="삭제"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 추가 버튼 영역 */}
      {onUpdateTags && (
        <div className="mt-auto pt-6">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              기술 스택 직접 추가하기
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-4 py-2 text-sm bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40"
                placeholder="기술명 (예: Next.js)"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualTag()}
              />
              <button
                onClick={handleAddManualTag}
                className="px-4 py-2 bg-primary-container text-white text-sm rounded-lg hover:bg-primary-container/90"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTag('');
                }}
                className="px-4 py-2 bg-surface-container-high text-on-surface-variant text-sm rounded-lg hover:bg-surface-dim"
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
