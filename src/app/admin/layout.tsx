import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import GlobalModal from '@/components/common/GlobalModal';
import Toast from '@/components/common/Toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '관리자 패널',
    template: '%s | 관리자 패널',
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.memberType !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <GlobalModal />
      <Toast />
    </div>
  );
}
