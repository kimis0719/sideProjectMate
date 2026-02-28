import React from 'react';

/* ============================================================
   Skeleton — 로딩 상태용 애니메이션 플레이스홀더
   사용법:
     <Skeleton className="h-5 w-32" />
     <Skeleton.Avatar size="md" />
     <Skeleton.Card />
============================================================ */

interface SkeletonProps {
    className?: string;
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

/** 기본 Skeleton 블록 */
function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
    const roundedClass = {
        none: '',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
    }[rounded];

    return (
        <div
            className={`animate-pulse bg-muted ${roundedClass} ${className}`}
            aria-hidden="true"
        />
    );
}

/** 아바타 Skeleton */
Skeleton.Avatar = function SkeletonAvatar({
    size = 'md',
}: {
    size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
    const sizeClass = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-14 h-14',
        xl: 'w-20 h-20',
    }[size];

    return <Skeleton className={sizeClass} rounded="full" />;
};

/** 텍스트 줄 Skeleton */
Skeleton.Text = function SkeletonText({
    lines = 1,
    lastLineFull = false,
}: {
    lines?: number;
    lastLineFull?: boolean;
}) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && !lastLineFull ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
};

/** 카드 Skeleton */
Skeleton.Card = function SkeletonCard() {
    return (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3" aria-hidden="true">
            {/* 썸네일 */}
            <Skeleton className="h-40 w-full" rounded="lg" />
            {/* 텍스트 줄 */}
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            {/* 하단 메타 */}
            <div className="flex items-center gap-2 pt-1">
                <Skeleton.Avatar size="sm" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
};

/** 프로필 Skeleton */
Skeleton.Profile = function SkeletonProfile() {
    return (
        <div className="flex items-center gap-4 p-4" aria-hidden="true">
            <Skeleton.Avatar size="xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
};

/** 리스트 항목 Skeleton */
Skeleton.ListItem = function SkeletonListItem() {
    return (
        <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0" aria-hidden="true">
            <Skeleton.Avatar size="md" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-6 w-16" rounded="full" />
        </div>
    );
};

export default Skeleton;
