'use client';

import React, { useState, KeyboardEvent } from 'react';

interface LinkInputProps {
  onAdd: (url: string) => void;
}

export default function LinkInput({ onAdd }: LinkInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    onAdd(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex gap-2 w-full">
      <div className="relative flex-1">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">
          link
        </span>
        <input
          type="url"
          className="block w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40 transition-all"
          placeholder="https://..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={!inputValue.trim()}
        className={`px-5 py-3 rounded-xl font-medium text-sm transition-all ${
          inputValue.trim()
            ? 'bg-primary-container text-white hover:bg-primary-container/90 shadow-sm'
            : 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed'
        }`}
      >
        추가
      </button>
    </div>
  );
}
