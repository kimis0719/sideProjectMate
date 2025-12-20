'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useNotificationStore } from '@/lib/store/notificationStore';

interface Applicant {
  _id: string;
  nName: string;
  authorEmail: string;
}

interface Application {
  _id: string;
  applicantId: Applicant;
  role: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function ManageApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const pid = params.pid as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchNotifications } = useNotificationStore();

  const fetchApplications = useCallback(async () => {
    if (!pid) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${pid}/applications`);
      const data = await response.json();
      if (data.success) {
        setApplications(data.data);
      } else {
        throw new Error(data.message || '지원자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchApplications();
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, fetchApplications, router]);

  const handleStatusChange = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchApplications();
        fetchNotifications();
      } else {
        throw new Error(data.message || '상태 변경에 실패했습니다.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (confirm('정말 이 지원 내역을 목록에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const response = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          alert('지원 내역이 삭제되었습니다.');
          fetchApplications(); // 목록 새로고침
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  if (isLoading || sessionStatus === 'loading') return <div className="text-center py-20">로딩 중...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">지원자 관리</h1>
      {applications.length === 0 ? (
        <p>아직 지원자가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {applications.map(app => (
            <div key={app._id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{app.applicantId.nName} <span className="text-sm font-normal text-muted-foreground">({app.applicantId.authorEmail})</span></p>
                  <p className="text-blue-600 font-semibold">{app.role} 역할 지원</p>
                  <p className="mt-4 text-foreground">{app.message}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${app.status === 'accepted' ? 'text-green-500' :
                      app.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'
                    }`}>
                    {app.status}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(app.createdAt).toLocaleString('ko-KR')}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {app.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusChange(app._id, 'accepted')} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">수락</button>
                    <button onClick={() => handleStatusChange(app._id, 'rejected')} className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">거절</button>
                  </>
                )}
                {app.status !== 'accepted' && (
                  <button onClick={() => handleDeleteApplication(app._id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">삭제</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
