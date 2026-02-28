'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';

/* ============================================================
   Toast 상태 스토어 (Zustand)
   사용법: toastStore.getState().show('저장되었습니다.', 'success')
   또는 훅: const { show } = useToastStore();
============================================================ */
export type ToastType = 'default' | 'success' | 'error' | 'warning';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastStoreState {
    toasts: ToastItem[];
    show: (message: string, type?: ToastType, duration?: number) => void;
    remove: (id: string) => void;
}

export const useToastStore = create<ToastStoreState>((set) => ({
    toasts: [],
    show: (message, type = 'default', duration = 3000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, duration);
    },
    remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/* ============================================================
   Toast 아이콘
============================================================ */
function ToastIcon({ type }: { type: ToastType }) {
    if (type === 'success') {
        return (
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        );
    }
    if (type === 'error') {
        return (
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        );
    }
    if (type === 'warning') {
        return (
            <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
        );
    }
    // default: 알림 벨 아이콘
    return (
        <svg className="w-5 h-5 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    );
}

/* ============================================================
   개별 Toast 아이템 (마운트 애니메이션 포함)
============================================================ */
function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-border
        bg-card text-card-foreground text-sm font-medium
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
        >
            <ToastIcon type={toast.type} />
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => { setVisible(false); setTimeout(onRemove, 300); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="알림 닫기"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

/* ============================================================
   Toast 컨테이너 — layout.tsx에서 한 번만 마운트
============================================================ */
export default function Toast() {
    const { toasts, remove } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]"
            aria-live="polite"
            aria-atomic="false"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => remove(toast.id)} />
            ))}
        </div>
    );
}
