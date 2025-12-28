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
    problemStats?: { level: number; solved: number, total: number }[];
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
    background: var(--card);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 1.5rem; /* Increased gap */
    height: 100%;
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: var(--foreground);
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
    background: var(--muted);
    padding: 0.75rem;
    border-radius: 0.5rem;
    text-align: center;
`;

const StatLabel = styled.div`
    font-size: 0.75rem;
    color: var(--muted-foreground);
    margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
    font-weight: 700;
    color: var(--foreground);
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
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const DistributionContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
`;

const DistributionBar = styled.div`
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    width: 100%;
    background-color: var(--muted);
`;

const DistributionSegment = styled.div<{ $color: string; $width: number }>`
    background-color: ${props => props.$color};
    width: ${props => props.$width}%;
    height: 100%;
`;

const DistributionLegend = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
`;

const LegendItem = styled.div<{ $color: string }>`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    color: var(--muted-foreground);
    
    &::before {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: ${props => props.$color};
    }
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

    if (!handle) {
        return (
            <CardContainer style={{ minHeight: '300px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <SolvedLogo src="https://static.solved.ac/logo.svg" alt="solved.ac" style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Solved.ac 연동이 필요합니다</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>백준(BOJ) 핸들을 등록하여 알고리즘 문제 해결 능력을 증명하세요.</p>
            </CardContainer>
        );
    }

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

    // 통계 집계
    const statsByTierGroup = {
        Bronze: 0,
        Silver: 0,
        Gold: 0,
        Platinum: 0,
        Diamond: 0,
        Ruby: 0
    };

    if (data.problemStats) {
        data.problemStats.forEach((stat) => {
            const level = stat.level;
            if (level >= 1 && level <= 5) statsByTierGroup.Bronze += stat.solved;
            else if (level >= 6 && level <= 10) statsByTierGroup.Silver += stat.solved;
            else if (level >= 11 && level <= 15) statsByTierGroup.Gold += stat.solved;
            else if (level >= 16 && level <= 20) statsByTierGroup.Platinum += stat.solved;
            else if (level >= 21 && level <= 25) statsByTierGroup.Diamond += stat.solved;
            else if (level >= 26 && level <= 30) statsByTierGroup.Ruby += stat.solved;
        });
    }

    const totalCalculated = Object.values(statsByTierGroup).reduce((a, b) => a + b, 0);

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

            {/* Distribution Chart */}
            {data.problemStats && totalCalculated > 0 && (
                <DistributionContainer>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">Problem Distribution</div>
                    <DistributionBar>
                        {statsByTierGroup.Bronze > 0 && <DistributionSegment $color="#ad5600" $width={(statsByTierGroup.Bronze / totalCalculated) * 100} />}
                        {statsByTierGroup.Silver > 0 && <DistributionSegment $color="#435f7a" $width={(statsByTierGroup.Silver / totalCalculated) * 100} />}
                        {statsByTierGroup.Gold > 0 && <DistributionSegment $color="#ec9a00" $width={(statsByTierGroup.Gold / totalCalculated) * 100} />}
                        {statsByTierGroup.Platinum > 0 && <DistributionSegment $color="#27e2a4" $width={(statsByTierGroup.Platinum / totalCalculated) * 100} />}
                        {statsByTierGroup.Diamond > 0 && <DistributionSegment $color="#00b4fc" $width={(statsByTierGroup.Diamond / totalCalculated) * 100} />}
                        {statsByTierGroup.Ruby > 0 && <DistributionSegment $color="#ff0062" $width={(statsByTierGroup.Ruby / totalCalculated) * 100} />}
                    </DistributionBar>
                    <DistributionLegend>
                        {statsByTierGroup.Bronze > 0 && <LegendItem $color="#ad5600">Bronze ({statsByTierGroup.Bronze})</LegendItem>}
                        {statsByTierGroup.Silver > 0 && <LegendItem $color="#435f7a">Silver ({statsByTierGroup.Silver})</LegendItem>}
                        {statsByTierGroup.Gold > 0 && <LegendItem $color="#ec9a00">Gold ({statsByTierGroup.Gold})</LegendItem>}
                        {statsByTierGroup.Platinum > 0 && <LegendItem $color="#27e2a4">Platinum ({statsByTierGroup.Platinum})</LegendItem>}
                        {statsByTierGroup.Diamond > 0 && <LegendItem $color="#00b4fc">Diamond ({statsByTierGroup.Diamond})</LegendItem>}
                        {statsByTierGroup.Ruby > 0 && <LegendItem $color="#ff0062">Ruby ({statsByTierGroup.Ruby})</LegendItem>}
                    </DistributionLegend>
                </DistributionContainer>
            )}
        </CardContainer>
    );
}
