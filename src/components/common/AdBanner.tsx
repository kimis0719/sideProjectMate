'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * AdBanner — 카카오 AdFit 광고 배너 컴포넌트
 *
 * [광고 금지 영역]
 * 칸반 보드, WBS, 채팅, 대시보드 내부에는 절대 사용하지 마세요.
 *
 * [SPA 동작 원리]
 * AdFit SDK(ba.min.js)는 로드 시점에 DOM을 스캔해 ins.kakao_ad_area를 초기화합니다.
 * Next.js SPA 라우팅 시 스크립트가 재실행되지 않으므로, 컴포넌트 마운트마다
 * 스크립트를 재주입해 SDK가 현재 DOM의 ins 태그를 인식하도록 합니다.
 *
 * [사이즈]
 * - 'leaderboard' : 728×90  (데스크탑 배너)
 * - 'rectangle'   : 300×250 (모바일/사이드바 배너)
 * - 'auto'        : 768px 기준으로 leaderboard ↔ rectangle 자동 전환
 */

type AdSize = 'leaderboard' | 'rectangle' | 'auto';

const SIZE_MAP: Record<Exclude<AdSize, 'auto'>, { width: number; height: number }> = {
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
};

const ADFIT_SCRIPT_ID = 'kakao-adfit-sdk';
const ADFIT_SCRIPT_SRC = '//t1.daumcdn.net/kas/static/ba.min.js';

interface AdBannerProps {
  unitId?: string;
  /** PC/모바일 단위 ID를 분리할 때 사용. 설정 시 모바일에서 unitId 대신 이 값을 사용합니다 */
  unitIdMobile?: string;
  size?: AdSize;
  /** true이면 로그인한 사용자에게 광고를 숨깁니다 */
  hideForLoggedIn?: boolean;
  className?: string;
}

export default function AdBanner({
  unitId,
  unitIdMobile,
  size = 'auto',
  hideForLoggedIn = false,
  className = '',
}: AdBannerProps) {
  const { data: session } = useSession();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // 실제 렌더링 사이즈 결정
  const resolvedSize: Exclude<AdSize, 'auto'> =
    size === 'auto' ? (isMobile ? 'rectangle' : 'leaderboard') : size;
  const { width, height } = SIZE_MAP[resolvedSize];

  // PC/모바일 단위 ID 분기 (unitIdMobile 미설정 시 unitId 공통 사용)
  const resolvedUnitId = isMobile && unitIdMobile ? unitIdMobile : unitId;

  const shouldShow = resolvedUnitId && !(hideForLoggedIn && session);

  useEffect(() => {
    if (!shouldShow) return;

    // 기존 스크립트 제거 → 재주입하여 SDK가 현재 DOM의 ins 태그를 재스캔
    document.getElementById(ADFIT_SCRIPT_ID)?.remove();

    const script = document.createElement('script');
    script.id = ADFIT_SCRIPT_ID;
    script.type = 'text/javascript';
    script.src = ADFIT_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.getElementById(ADFIT_SCRIPT_ID)?.remove();
    };
  }, [shouldShow, resolvedUnitId, width, height]);

  if (!shouldShow) {
    // unitId 없거나 로그인 사용자 숨김인 경우
    if (hideForLoggedIn && session) return null;

    return (
      <div
        className={`w-full flex flex-col items-center ${className}`}
        aria-label="광고 영역"
      >
        <p className="text-[10px] text-muted-foreground/50 mb-1 self-start select-none">
          광고
        </p>
        <div
          className="flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20"
          style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
        >
          <span className="text-xs text-muted-foreground/50 select-none">
            광고 영역 ({resolvedSize} {width}×{height})
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full flex flex-col items-center ${className}`}
      aria-label="광고 영역"
    >
      {/* 법적 의무: "광고" 레이블 명시 */}
      <p className="text-[10px] text-muted-foreground/50 mb-1 self-start select-none">
        광고
      </p>
      {/* SDK가 마운트 후 ins 태그를 인식하여 광고 노출 */}
      <ins
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={resolvedUnitId}
        data-ad-width={String(width)}
        data-ad-height={String(height)}
      />
    </div>
  );
}
