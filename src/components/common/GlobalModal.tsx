'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useModalStore } from '@/store/modalStore';

/**
 * 전역 모달 컴포넌트 (접근성 강화)
 * - aria-labelledby / aria-describedby 적용
 * - 모달 열릴 때 확인 버튼 자동 포커스
 * - 포커스 트랩 (Tab / Shift+Tab 순환)
 * - 시스템 컬러 토큰 사용 (하드코딩 컬러 제거)
 */
const GlobalModal = () => {
  const {
    isOpen,
    type,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive,
    closeOnBackdropClick,
    showCloseButton,
    resolve,
  } = useModalStore();

  const [mounted, setMounted] = useState(false);
  const [isAnimate, setIsAnimate] = useState(false);

  // 포커스 트랩 refs
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const titleId = 'global-modal-title';
  const descId = 'global-modal-desc';

  // 클라이언트 마운트 보장
  useEffect(() => {
    setMounted(true);
  }, []);

  // 열림 시 애니메이션 + 자동 포커스
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsAnimate(true);
        // 확인 버튼에 자동 포커스 (취소 버튼 우선)
        if (type === 'confirm' && cancelBtnRef.current) {
          cancelBtnRef.current.focus();
        } else if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimate(false);
    }
  }, [isOpen, type]);

  // 스크롤 lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 포커스 트랩 (Tab / Shift+Tab)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnBackdropClick) {
        resolve(null);
        return;
      }

      if (e.key !== 'Tab') return;

      // 현재 모달 안의 포커스 가능한 요소 수집
      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex="0"]'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [closeOnBackdropClick, resolve]
  );

  if (!mounted || !isOpen) return null;

  const handleConfirm = () => resolve(true);
  const handleCancel = () => resolve(false);
  const handleDismiss = () => resolve(null);
  const handleBackdropClick = () => {
    if (closeOnBackdropClick) handleDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={descId}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop — glassmorphism */}
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${isAnimate ? 'opacity-100' : 'opacity-0'}`}
        style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(249, 249, 248, 0.8)' }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal 박스 — No-Line Rule + modal shadow */}
      <div
        ref={containerRef}
        className={`
                    relative w-full max-w-sm overflow-hidden
                    bg-surface-container-lowest text-on-surface
                    rounded-lg shadow-modal
                    transform transition-all duration-300 ease-out
                    ${isAnimate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
                `}
      >
        {/* X 버튼 */}
        {showCloseButton && (
          <button
            ref={closeBtnRef}
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 text-on-surface-variant hover:text-on-surface transition-colors z-[110]"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <div className="p-6">
          {/* 제목 */}
          {title && (
            <h3 id={titleId} className="text-lg font-bold text-on-surface mb-2 pr-8">
              {title}
            </h3>
          )}

          {/* 본문 */}
          <div
            id={descId}
            className="text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed"
          >
            {message}
          </div>
        </div>

        {/* 액션 버튼 영역 — No-Line Rule: 구분은 배경색으로 */}
        <div
          className="flex bg-surface-container-low rounded-b-lg"
          role="group"
          aria-label="모달 액션"
        >
          {type === 'confirm' && (
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-bl-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3.5 text-sm font-bold transition-colors rounded-br-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
              isDestructive
                ? 'text-error hover:bg-error-container/30'
                : 'text-primary hover:bg-surface-container-high'
            } ${type !== 'confirm' ? 'rounded-b-lg' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalModal;
