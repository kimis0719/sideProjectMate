'use client';

import { useState, useRef, useCallback } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: { code: string; label: string }[];
  placeholder?: string;
  maxTags?: number;
  allowFreeInput?: boolean;
}

export default function TagInput({
  value,
  onChange,
  suggestions,
  placeholder = '태그를 입력하세요',
  maxTags = 10,
  allowFreeInput = true,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isMaxReached = value.length >= maxTags;

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed || value.includes(trimmed) || isMaxReached) return;
      onChange([...value, trimmed]);
    },
    [value, onChange, isMaxReached]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const toggleSuggestion = useCallback(
    (label: string) => {
      if (value.includes(label)) {
        removeTag(label);
      } else {
        addTag(label);
      }
    },
    [value, addTag, removeTag]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || (e.key === 'Tab' && inputValue.trim())) {
      e.preventDefault();
      if (allowFreeInput && inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  // 추천 칩 중 suggestions에 없는 자유 입력 태그 구분
  const suggestionLabels = new Set(suggestions.map((s) => s.label));

  return (
    <div className="space-y-3">
      {/* 추천 칩 */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => {
            const isSelected = value.includes(s.label);
            return (
              <button
                key={s.code}
                type="button"
                onClick={() => toggleSuggestion(s.label)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 선택된 태그 + 입력 */}
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-lowest min-h-[42px] cursor-text"
        style={{ border: '1px solid rgba(195, 198, 215, 0.15)' }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm ${
              suggestionLabels.has(tag)
                ? 'bg-primary-container/15 text-primary'
                : 'bg-surface-container-high text-on-surface'
            }`}
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-current opacity-60 hover:opacity-100 ml-0.5"
            >
              &times;
            </button>
          </span>
        ))}
        {allowFreeInput && !isMaxReached && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant"
          />
        )}
        {isMaxReached && value.length > 0 && (
          <span className="text-xs text-on-surface-variant">최대 {maxTags}개</span>
        )}
      </div>
    </div>
  );
}
