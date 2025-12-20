'use client';

import React, { useState, useEffect } from 'react';

/**
 * Open Graph API 응답 데이터 타입 정의
 */
interface OGData {
    title: string;
    description: string;
    image: string | null;
    url: string;
    siteName: string;
}

interface PortfolioCardProps {
    url: string;
    onDelete?: () => void; // 삭제 기능이 필요할 때를 대비한 콜백
    readOnly?: boolean;    // 조회 전용 모드인지 여부
}

/**
 * @component PortfolioCard
 * @description
 * URL을 입력받아 해당 링크의 썸네일, 제목, 설명을 카드 형태로 보여주는 컴포넌트입니다.
 * 
 * [동작 원리]
 * 1. 컴포넌트가 마운트되거나 URL이 변경되면 `/api/utils/og` API를 호출합니다.
 * 2. 로딩 중에는 스켈레톤(Skeleton) UI를 보여줍니다.
 * 3. 데이터 로드 완료 시 썸네일 이미지를 포함한 카드를 렌더링합니다.
 * 4. 이미지 로드 실패 시 기본 아이콘으로 대체(Fallback)합니다.
 */
export default function PortfolioCard({ url, onDelete, readOnly = false }: PortfolioCardProps) {
    const [data, setData] = useState<OGData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        // URL이 없으면 아무것도 하지 않음
        if (!url) return;

        const fetchOGData = async () => {
            try {
                setLoading(true);
                setError(false);

                // 우리가 만든 Proxy API 호출
                const res = await fetch(`/api/utils/og?url=${encodeURIComponent(url)}`);

                if (!res.ok) throw new Error('Failed to fetch OG data');

                const result = await res.json();
                setData(result);
            } catch (err) {
                console.error('OG Fetch Error:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchOGData();
    }, [url]);

    // --- 1. 로딩 상태 UI (Skeleton) ---
    if (loading) {
        return (
            <div className="w-full h-28 border border-gray-100 rounded-lg bg-gray-50 flex overflow-hidden animate-pulse">
                {/* 썸네일 영역 스켈레톤 */}
                <div className="w-28 h-full bg-gray-200"></div>
                {/* 텍스트 영역 스켈레톤 */}
                <div className="flex-1 p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // --- 2. 에러 상태 UI (Fallback) ---
    // API 호출이 실패했거나 데이터가 잘못된 경우, 간단한 링크 박스만 보여줌
    if (error || !data) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-red-100 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
            >
                <div className="text-sm font-semibold truncate">{url}</div>
                <div className="text-xs mt-1">링크 정보를 불러올 수 없습니다. (클릭하여 이동)</div>
            </a>
        );
    }

    // --- 3. 성공 상태 UI (Card) ---
    return (
        <div className="group relative w-full border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-all duration-200">

            {/* 바로가기 링크 래퍼 */}
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-28"
            >
                {/* 썸네일 이미지 */}
                <div className="w-28 h-full flex-shrink-0 bg-gray-100 relative overflow-hidden">
                    {data.image ? (
                        <img
                            src={data.image}
                            alt={data.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                                // 이미지 로드 실패 시 회색 박스로 대체
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        // 이미지가 없을 경우 아이콘 표시
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* 텍스트 컨텐츠 */}
                <div className="flex-1 p-3 min-w-0 flex flex-col justify-center">
                    {/* 사이트 이름 (e.g. YouTube, Velog) */}
                    {data.siteName && (
                        <div className="text-xs text-indigo-500 font-semibold mb-1 uppercase tracking-wider">
                            {data.siteName}
                        </div>
                    )}

                    {/* 제목 */}
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">
                        {data.title || url}
                    </h3>

                    {/* 설명 (최대 2줄) */}
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {data.description || '설명이 없습니다.'}
                    </p>
                </div>
            </a>

            {/* 삭제 버튼 (편집 모드일 때만 노출) */}
            {!readOnly && onDelete && (
                <button
                    onClick={(e) => {
                        e.preventDefault(); // 링크 이동 방지
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-gray-400 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    title="삭제하기"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
