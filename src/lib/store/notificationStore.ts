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
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
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
  deleteNotification: async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const currentNotifications = get().notifications;
        const updatedNotifications = currentNotifications.filter(n => n._id !== id);
        set({
          notifications: updatedNotifications,
          unreadCount: updatedNotifications.filter(n => !n.read).length,
        });
      }
    } catch (error) {
      console.error('알림 삭제 실패', error);
    }
  },
  deleteAllNotifications: async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        set({
          notifications: [],
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error('알림 전체 삭제 실패', error);
    }
  },
}));
