import { create } from 'zustand';
import { ReactNode } from 'react';

/**
 * 모달 타입을 정의합니다.
 */
export type ModalType = 'alert' | 'confirm';

/**
 * 모달 스토어의 상태를 정의합니다.
 */
interface ModalState {
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    closeOnBackdropClick?: boolean;
    showCloseButton?: boolean;
    resolve: (value: any) => void;

    // Actions
    openConfirm: (
        title: string,
        message: ReactNode,
        options?: {
            confirmText?: string;
            cancelText?: string;
            isDestructive?: boolean;
            closeOnBackdropClick?: boolean;
            showCloseButton?: boolean;
        }
    ) => Promise<boolean | null>;

    openAlert: (
        title: string,
        message: ReactNode,
        options?: {
            confirmText?: string;
            closeOnBackdropClick?: boolean;
            showCloseButton?: boolean;
        }
    ) => Promise<void>;

    close: () => void;
}

/**
 * 전역 모달 상태 관리를 위한 Zustand 스토어
 */
export const useModalStore = create<ModalState>((set, get) => ({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: '확인',
    cancelText: '취소',
    isDestructive: false,
    closeOnBackdropClick: true, // 기본값
    showCloseButton: true,      // 기본값
    resolve: () => { },

    /**
     * Confirm 모달을 엽니다. 
     * @returns 확인(true), 취소(false), 닫기 또는 백드롭 클릭(null)을 Promise로 반환합니다.
     */
    openConfirm: (title, message, options = {}) => {
        return new Promise((resolve) => {
            set({
                isOpen: true,
                type: 'confirm',
                title,
                message,
                confirmText: options.confirmText || '확인',
                cancelText: options.cancelText || '취소',
                isDestructive: options.isDestructive || false,
                closeOnBackdropClick: options.closeOnBackdropClick ?? true,
                showCloseButton: options.showCloseButton ?? true,
                resolve: (value: boolean | null) => {
                    resolve(value);
                    get().close();
                },
            });
        });
    },

    /**
     * Alert 모달을 엽니다. 확인 버튼을 누를 때까지 대기할 수 있는 Promise를 반환합니다.
     */
    openAlert: (title, message, options = {}) => {
        return new Promise((resolve) => {
            set({
                isOpen: true,
                type: 'alert',
                title,
                message,
                confirmText: options.confirmText || '확인',
                closeOnBackdropClick: options.closeOnBackdropClick ?? true,
                showCloseButton: options.showCloseButton ?? true,
                resolve: () => {
                    resolve();
                    get().close();
                },
            });
        });
    },

    /**
     * 모달을 닫고 상태를 초기화합니다.
     */
    close: () => {
        set({
            isOpen: false,
            title: '',
            message: '',
            confirmText: '확인',
            cancelText: '취소',
            isDestructive: false,
            closeOnBackdropClick: true,
            showCloseButton: true,
        });
    },
}));
