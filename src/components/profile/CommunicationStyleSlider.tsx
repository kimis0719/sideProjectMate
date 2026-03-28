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
    <div className="space-y-8 p-4 bg-card rounded-lg shadow-sm border border-border">
      {/* 커뮤니케이션 스타일 슬라이더 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">커뮤니케이션 스타일</h3>
        <div className="relative pt-6 pb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={preference}
            onChange={(e) => onChangePreference(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between mt-2 text-sm font-medium text-muted-foreground">
            <span className={preference < 50 ? 'text-primary font-bold' : ''}>
              비동기 (텍스트) 💬
            </span>
            <span className={preference > 50 ? 'text-primary font-bold' : ''}>
              동기 (음성/미팅) 📞
            </span>
          </div>
          <div className="text-center mt-2 text-xs text-muted-foreground">
            {preference}% (0: 완전 비동기, 100: 완전 동기)
          </div>
        </div>
      </div>

      {/* Personality Lingo 태그 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          협업 성향 (Personality Lingo)
          <span className="ml-2 text-xs font-normal text-muted-foreground">최대 3개 선택</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONALITY_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`flex items-center p-3 rounded-lg border transition-all duration-200 text-left ${
                tags.includes(tag.id)
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted'
              }`}
            >
              <div className="flex-1">
                <div
                  className={`font-bold ${tags.includes(tag.id) ? 'text-primary' : 'text-foreground'}`}
                >
                  {tag.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{tag.desc}</div>
              </div>
              {tags.includes(tag.id) && <span className="text-primary text-xl">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
