'use client';

/**
 * AdBanner — 광고 배너 플레이스홀더 컴포넌트
 *
 * [활성화 방법 — Google AdSense 기준]
 * 1. next.config.js의 Content Security Policy에 AdSense 도메인 추가
 * 2. <head>에 AdSense 스크립트 태그 삽입 (src/app/layout.tsx)
 * 3. 이 컴포넌트 내부의 <ins class="adsbygoogle"> 태그 주석 해제
 * 4. data-ad-client / data-ad-slot 값을 AdSense 대시보드에서 발급받은 값으로 교체
 *
 * [활성화 방법 — 카카오 AdFit 기준]
 * https://adfit.kakao.com 에서 광고 단위 생성 후 스크립트를 주입하세요.
 *
 * [DEV_ROADMAP 광고 금지 영역]
 * 칸반 보드, WBS, 채팅, 대시보드 내부에는 절대 사용하지 마세요.
 */

interface AdBannerProps {
  slot: 'home-middle' | 'project-list-top';
  className?: string;
}

export default function AdBanner({ slot, className = '' }: AdBannerProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div
      className={`w-full flex items-center justify-center ${className}`}
      data-ad-slot={slot}
      aria-label="광고"
    >
      {/* ── 개발 환경: 광고 위치 시각화 ── */}
      {isDev && (
        <div className="w-full max-w-3xl mx-auto h-24 flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
          <span className="text-xs text-muted-foreground/60 select-none">
            광고 영역 ({slot}) — 개발 환경에서만 표시됩니다
          </span>
        </div>
      )}

      {/* ── 프로덕션: AdSense/AdFit 활성화 시 아래 주석 해제 ──
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      ── */}
    </div>
  );
}
