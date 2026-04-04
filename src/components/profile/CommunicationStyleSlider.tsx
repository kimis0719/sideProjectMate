'use client';

import React from 'react';
import { useModal } from '@/hooks/useModal';

interface CommunicationStyleSliderProps {
  preference: number;
  onChangePreference: (value: number) => void;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
}

const PERSONALITY_TAGS = [
  { id: 'analyst', label: '🧐 분석가형', desc: '논리와 데이터를 중시해요' },
  { id: 'doer', label: '🏃 행동가형', desc: '빠른 실행과 결과를 선호해요' },
  { id: 'mediator', label: '🤝 중재자형', desc: '팀의 조화를 중요하게 생각해요' },
  { id: 'visionary', label: '🔭 비전가형', desc: '큰 그림을 그리고 영감을 줘요' },
  { id: 'planner', label: '📅 계획형', desc: '철저한 일정 관리를 좋아해요' },
  { id: 'flexible', label: '🌊 유연형', desc: '상황에 맞춰 유연하게 대처해요' },
];

export default function CommunicationStyleSlider({
  preference,
  onChangePreference,
  tags,
  onChangeTags,
}: CommunicationStyleSliderProps) {
  const { alert } = useModal();

  const toggleTag = async (tagId: string) => {
    if (tags.includes(tagId)) {
      onChangeTags(tags.filter((t) => t !== tagId));
    } else {
      if (tags.length >= 3) {
        await alert('선택 제한', '성향 태그는 최대 3개까지 선택 가능합니다.');
        return;
      }
      onChangeTags([...tags, tagId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* 커뮤니케이션 스타일 슬라이더 */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-bold text-outline uppercase tracking-widest">
            커뮤니케이션
          </span>
          <span className="material-symbols-outlined text-primary">chat_bubble</span>
        </div>
        <div className="space-y-6">
          <input
            type="range"
            min="0"
            max="100"
            value={preference}
            onChange={(e) => onChangePreference(Number(e.target.value))}
            className="w-full h-3 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-sm font-medium">
            <span className={preference < 50 ? 'text-on-surface font-bold' : 'text-outline'}>
              💬 비동기 (텍스트)
            </span>
            <span className={preference > 50 ? 'text-on-surface font-bold' : 'text-outline'}>
              동기 (음성/미팅) 📞
            </span>
          </div>
        </div>
      </div>

      {/* Personality Lingo 태그 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-outline uppercase tracking-widest">
            협업 성향
          </span>
          <span className="text-xs text-on-surface-variant">최대 3개 선택</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONALITY_TAGS.map((tag) => {
            const isSelected = tags.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 text-left ${
                  isSelected
                    ? 'bg-primary-container/10 ring-2 ring-primary'
                    : 'bg-surface-container-low hover:bg-surface-container-high'
                }`}
              >
                <div className="flex-1">
                  <div
                    className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-on-surface'}`}
                  >
                    {tag.label}
                  </div>
                  <div className="text-xs text-on-surface-variant mt-1">{tag.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
