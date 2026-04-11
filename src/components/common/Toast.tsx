'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';

/* ============================================================
   Toast 상태 스토어 (Zustand)
   사용법: useToastStore.getState().show('저장되었습니다.', 'success')
============================================================ */
export type ToastType = 'success' | 'error' | 'info';

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
  show: (message, type = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/* ============================================================
   타입별 스타일 매핑
============================================================ */
const TOAST_STYLES: Record<ToastType, { barColor: string; icon: string; iconColor: string }> = {
  success: { barColor: 'bg-emerald-500', icon: 'check_circle', iconColor: 'text-emerald-500' },
  error: { barColor: 'bg-rose-500', icon: 'error', iconColor: 'text-rose-500' },
  info: { barColor: 'bg-primary-container', icon: 'info', iconColor: 'text-primary-container' },
};

/* ============================================================
   개별 Toast 아이템
============================================================ */
function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);
  const style = TOAST_STYLES[toast.type];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        relative bg-surface-container-lowest rounded-lg
        shadow-[0_20px_40px_rgba(26,28,28,0.04)]
        flex items-stretch overflow-hidden
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 md:-translate-y-3 translate-y-3 scale-95'}
      `}
    >
      {/* 좌측 컬러 바 */}
      <div className={`w-1 shrink-0 ${style.barColor}`} />

      <div className="flex items-center gap-4 px-5 py-4 w-full">
        <span
          className={`material-symbols-outlined text-2xl shrink-0 ${style.iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {style.icon}
        </span>
        <p className="flex-grow text-[0.9375rem] font-medium text-on-surface">{toast.message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onRemove, 300);
          }}
          className="text-on-surface-variant/30 hover:text-on-surface transition-colors p-1 shrink-0"
          aria-label="알림 닫기"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Toast 컨테이너 — layout.tsx에서 한 번만 마운트
   PC: 상단 중앙, 모바일: 하단 중앙 (탭 바 위)
============================================================ */
export default function Toast() {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-[10000] flex flex-col gap-2 w-[420px] max-w-[calc(100vw-2rem)] bottom-20 left-1/2 -translate-x-1/2 md:bottom-auto md:top-20 md:left-1/2 md:-translate-x-1/2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => remove(toast.id)} />
      ))}
    </div>
  );
}
