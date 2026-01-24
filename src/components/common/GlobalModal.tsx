'use client';

import React, { useEffect, useState } from 'react';
import { useModalStore } from '@/store/modalStore';

/**
 * 전역 모달 컴포넌트
 * modalStore의 상태를 구독하여 Alert/Confirm 모달을 렌더링합니다.
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
        resolve
    } = useModalStore();

    const [mounted, setMounted] = useState(false);
    const [isAnimate, setIsAnimate] = useState(false);

    // 클라이언트 사이드 렌더링 보장
    useEffect(() => {
        setMounted(true);
    }, []);

    // 애니메이션 제어
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsAnimate(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimate(false);
        }
    }, [isOpen]);

    // 모달이 열려있을 때 배경 스크롤 방지
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    /**
     * 확인 버튼 클릭 시 resolve(true) 호출
     */
    const handleConfirm = () => {
        resolve(true);
    };

    /**
     * 취소 버튼 클릭 시 resolve(false) 호출
     */
    const handleCancel = () => {
        resolve(false);
    };

    /**
     * X 버튼 또는 백드롭 클릭 시 resolve(null) 호출 (아무 로직도 실행하지 않음)
     */
    const handleDismiss = () => {
        resolve(null);
    };

    /**
     * 백드롭 클릭 처리
     */
    const handleBackdropClick = () => {
        if (closeOnBackdropClick) {
            handleDismiss();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div
                className={`
                    fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300
                    ${isAnimate ? 'opacity-100' : 'opacity-0'}
                `}
                onClick={handleBackdropClick}
            />

            {/* Modal Container */}
            <div
                className={`
                    relative w-full max-w-sm overflow-hidden 
                    bg-white dark:bg-gray-800 
                    rounded-2xl shadow-2xl 
                    transform transition-all duration-300 ease-out
                    ${isAnimate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
                `}
            >
                {/* Close Button ('X') */}
                {showCloseButton && (
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-[110]"
                        aria-label="닫기"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="p-6">
                    {/* Title */}
                    {title && (
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-8">
                            {title}
                        </h3>
                    )}

                    {/* Message */}
                    <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {message}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex border-t border-gray-100 dark:border-gray-700">
                    {type === 'confirm' && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-r border-gray-100 dark:border-gray-700"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`
                            flex-1 px-4 py-4 text-sm font-bold transition-colors
                            ${isDestructive
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}
                        `}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalModal;
