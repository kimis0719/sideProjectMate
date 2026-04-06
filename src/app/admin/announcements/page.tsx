import AnnouncementSender from '@/components/admin/AnnouncementSender';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '공지사항 발송' };

export default function AdminAnnouncementsPage() {
  return (
    <div className="p-8">
      <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">공지사항 발송</h2>
      <p className="font-body text-body-md text-on-surface-variant mb-6">
        전체 사용자에게 공지 알림을 발송합니다.
      </p>
      <AnnouncementSender />
    </div>
  );
}
