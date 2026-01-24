import { useModalStore } from '@/store/modalStore';
import { ReactNode } from 'react';

/**
 * 모달 기능을 편리하게 사용하기 위한 커스텀 훅입니다.
 */
export const useModal = () => {
    const openConfirm = useModalStore((state) => state.openConfirm);
    const openAlert = useModalStore((state) => state.openAlert);
    const close = useModalStore((state) => state.close);

    /**
     * 확인/취소 선택이 필요한 모달을 띄웁니다.
     * @returns 
     * - true: 확인 버튼 클릭
     * - false: 취소 버튼 클릭
     * - null: X 버튼 클릭 또는 백드롭 클릭(옵션 활성 시)
     */
    const confirm = async (
        title: string,
        message: ReactNode,
        options?: {
            confirmText?: string;
            cancelText?: string;
            isDestructive?: boolean;
            closeOnBackdropClick?: boolean;
            showCloseButton?: boolean;
        }
    ) => {
        return await openConfirm(title, message, options);
    };

    /**
     * 단순 알림 모달을 띄웁니다.
     * @returns 확인을 누르거나 닫을 때까지 대기하는 Promise
     */
    const alert = async (
        title: string,
        message: ReactNode,
        options?: {
            confirmText?: string;
            closeOnBackdropClick?: boolean;
            showCloseButton?: boolean;
        }
    ) => {
        return await openAlert(title, message, options);
    };

    return {
        confirm,
        alert,
        close,
    };
};
