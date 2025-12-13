'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface SolvedAcData {
    handle: string;
    tier: number;
    solvedCount: number;
    rating: number;
    rank: number;
    class: number;
    maxStreak: number;
}

interface SolvedAcCardProps {
    handle: string;
}

// 티어별 색상 매핑
const getTierColor = (tier: number) => {
    if (tier === 0) return '#2d2d2d'; // Unrated
    if (tier <= 5) return '#ad5600'; // Bronze
    if (tier <= 10) return '#435f7a'; // Silver
    if (tier <= 15) return '#ec9a00'; // Gold
    if (tier <= 20) return '#27e2a4'; // Platinum
    if (tier <= 25) return '#00b4fc'; // Diamond
    if (tier <= 30) return '#ff0062'; // Ruby
    return '#b491ff'; // Master
};

// 티어 이름 매핑
const getTierName = (tier: number) => {
    if (tier === 0) return 'Unrated';
    const level = (tier - 1) % 5 + 1; // 1~5
    const tierGroup = Math.ceil(tier / 5);

    const romanLevel = ['V', 'IV', 'III', 'II', 'I'][level - 1];

    switch (tierGroup) {
        case 1: return `Bronze ${romanLevel}`;
        case 2: return `Silver ${romanLevel}`;
        case 3: return `Gold ${romanLevel}`;
        case 4: return `Platinum ${romanLevel}`;
        case 5: return `Diamond ${romanLevel}`;
        case 6: return `Ruby ${romanLevel}`;
        default: return 'Master';
    }
};

const CardContainer = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: #374151;
    font-size: 1.125rem;
`;

const SolvedLogo = styled.img`
    width: 24px;
    height: 24px;
`;

const StatGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
`;

const StatItem = styled.div`
    background: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.5rem;
    text-align: center;
`;

const StatLabel = styled.div`
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
    font-weight: 700;
    color: #111827;
`;

const TierBadge = styled.div<{ $color: string }>`
    background: ${props => props.$color};
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.25rem;
    width: fit-content;
`;

export default function SolvedAcCard({ handle }: SolvedAcCardProps) {
    const [data, setData] = useState<SolvedAcData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!handle) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/proxy/solved?handle=${handle}`);
                if (!res.ok) throw new Error('Solved.ac 데이터를 불러오는데 실패했습니다.');
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err) {
                console.error(err);
                setError('데이터 로드 실패');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [handle]);

    if (!handle) return null;

    if (loading) {
        return (
            <CardContainer className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-100 rounded"></div>
            </CardContainer>
        );
    }

    if (error || !data) {
        return (
            <CardContainer>
                <div className="text-red-500 text-sm">{error || '정보를 찾을 수 없습니다.'}</div>
            </CardContainer>
        );
    }

    return (
        <CardContainer>
            <Header>
                <SolvedLogo src="https://static.solved.ac/logo.svg" alt="solved.ac" />
                Solved.ac
            </Header>

            <div className="flex flex-col items-center py-2">
                <div className="text-3xl font-extrabold" style={{ color: getTierColor(data.tier) }}>
                    {getTierName(data.tier)}
                </div>
                <TierBadge $color={getTierColor(data.tier)}>
                    ⭐ Rating {data.rating}
                </TierBadge>
            </div>

            <StatGrid>
                <StatItem>
                    <StatLabel>해결한 문제</StatLabel>
                    <StatValue>{data.solvedCount.toLocaleString()}</StatValue>
                </StatItem>
                <StatItem>
                    <StatLabel>최대 스트릭</StatLabel>
                    <StatValue>{data.maxStreak}일</StatValue>
                </StatItem>
                <StatItem>
                    <StatLabel>CLASS</StatLabel>
                    <StatValue>{data.class}</StatValue>
                </StatItem>
                <StatItem>
                    <StatLabel>전체 랭킹</StatLabel>
                    <StatValue>#{data.rank.toLocaleString()}</StatValue>
                </StatItem>
            </StatGrid>
        </CardContainer>
    );
}
