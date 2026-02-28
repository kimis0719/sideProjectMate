import AdminDashboard from '@/components/admin/AdminDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '대시보드' };

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
