'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdBanner from '@/components/common/AdBanner';

export interface SidebarMenuItem {
  href: string;
  icon: string; // Material Symbols icon name
  label: string;
}

interface SidebarShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  menuItems: SidebarMenuItem[];
  ctaButton?: { href: string; label: string; icon: string };
  adBannerUnitId?: string;
  /** 특정 경로에서 사이드바 트리거를 숨김 (칸반 등) */
  hideTriggerPaths?: string[];
}

function SidebarContent({
  title,
  subtitle,
  menuItems,
  ctaButton,
  adBannerUnitId,
  showAd = false,
  isActive,
  onClose,
}: {
  title: string;
  subtitle?: string;
  menuItems: SidebarMenuItem[];
  ctaButton?: { href: string; label: string; icon: string };
  adBannerUnitId?: string;
  showAd?: boolean;
  isActive: (path: string) => boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* 헤더 */}
      <div className="p-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold font-headline text-on-surface">{title}</h2>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {onClose && (
          <button
            className="lg:hidden p-2 hover:bg-surface-container-high rounded-full transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        )}
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onClose?.()}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive(item.href)
                ? 'bg-surface-container-lowest text-primary-container shadow-sm font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-lowest/50 hover:translate-x-1 transition-transform duration-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {/* CTA 버튼 */}
        {ctaButton && (
          <Link
            href={ctaButton.href}
            onClick={() => onClose?.()}
            className="flex items-center justify-center gap-2 mt-6 py-3 bg-primary-container text-on-primary rounded-lg font-bold text-sm hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">{ctaButton.icon}</span>
            <span>{ctaButton.label}</span>
          </Link>
        )}
      </nav>

      {/* 하단: 데스크톱 고정 사이드바에서만 광고 표시 (중복 방지) */}
      <div className="mt-auto p-4">
        {showAd && adBannerUnitId ? (
          <div className="rounded-xl overflow-hidden scale-[0.82] origin-top-left">
            <AdBanner unitId={adBannerUnitId} size="rectangle" />
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              Side Project Mate
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default function SidebarShell({
  children,
  title,
  subtitle,
  menuItems,
  ctaButton,
  adBannerUnitId,
  hideTriggerPaths = [],
}: SidebarShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const shouldHideTrigger = hideTriggerPaths.some((p) => pathname?.includes(p));

  // 라우트 변경 시 드로어 닫기
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const contentProps = {
    title,
    subtitle,
    menuItems,
    ctaButton,
    adBannerUnitId,
    isActive,
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] relative bg-surface">
      {/* 데스크톱 고정 사이드바 */}
      <aside className="hidden lg:flex w-64 bg-surface-container-low flex-col sticky top-[64px] h-[calc(100vh-64px)]">
        <SidebarContent {...contentProps} showAd />
      </aside>

      {/* 모바일 드로어 백드롭 */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[100] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 모바일 드로어 사이드바 */}
      <aside
        className={`fixed inset-y-0 left-0 z-[101] w-64 bg-surface-container-low flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent {...contentProps} onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* 모바일 트리거 버튼 */}
      {!isSidebarOpen && !shouldHideTrigger && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-[40] w-4 h-20 bg-surface-container-lowest rounded-r-2xl shadow-[4px_0_15px_rgba(0,0,0,0.06)] flex items-center justify-center hover:w-8 transition-all group overflow-hidden"
          title="메뉴 열기"
        >
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors text-[16px] ml-[-2px] group-hover:ml-0">
            chevron_right
          </span>
        </button>
      )}

      {/* 메인 콘텐츠 */}
      <main className="flex-1 relative w-full min-w-0">{children}</main>
    </div>
  );
}
