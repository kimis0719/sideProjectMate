import { create } from 'zustand';

// Header.tsx에서 필요한 모든 속성을 포함하도록 타입 확장
interface Notification {
  _id: string;
  sender: { nName: string };
  type: 'new_applicant' | 'application_accepted' | 'application_rejected';
  project: { title: string, pid: number };
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  },
  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        set({
          notifications: data.data,
          unreadCount: data.data.filter((n: Notification) => !n.read).length,
        });
      }
    } catch (error) {
      console.error('알림을 불러오는데 실패했습니다.', error);
    }
  },
}));
