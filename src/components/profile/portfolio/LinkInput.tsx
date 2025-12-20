'use client';

import React, { useState, KeyboardEvent } from 'react';

interface LinkInputProps {
    onAdd: (url: string) => void; // URL 추가 시 실행될 부모 함수
}

/**
 * @component LinkInput
 * @description
 * 사용자가 포트폴리오 URL을 입력하고 추가할 수 있는 컴포넌트입니다.
 * 
 * [주요 기능]
 * 1. 입력창에 URL 입력 후 엔터 키 또는 '추가' 버튼 클릭 시 등록.
 * 2. 간단한 유효성 검사 (빈 값 체크).
 * 3. 추가 후 입력창 초기화.
 */
export default function LinkInput({ onAdd }: LinkInputProps) {
    const [inputValue, setInputValue] = useState('');

    // URL 추가 핸들러
    const handleAdd = () => {
        if (!inputValue.trim()) return;

        // TODO: 필요하다면 여기서 정규식(Regex)으로 URL 포맷 검사를 강화할 수 있습니다.

        onAdd(inputValue.trim());
        setInputValue(''); // 입력창 비우기
    };

    // 키보드 엔터 이벤트 감지
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Form submit 방지
            handleAdd();
        }
    };

    return (
        <div className="flex gap-2 w-full">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* 링크 아이콘 */}
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </div>
                <input
                    type="url"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all"
                    placeholder="https://..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
            <button
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200
            ${inputValue.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
        `}
            >
                추가
            </button>
        </div>
    );
}
