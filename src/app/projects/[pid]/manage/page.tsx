'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useNotificationStore } from '@/lib/store/notificationStore';
import SimpleProfileCard from '@/components/profile/SimpleProfileCard';
import { useModal } from '@/hooks/useModal';

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
  const { alert, confirm } = useModal();

  // 상태 관리
  const [project, setProject] = useState<any>(null); // 프로젝트 정보 (멤버 포함)
  const [applications, setApplications] = useState<Application[]>([]); // 지원자 목록
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { fetchNotifications } = useNotificationStore();

  // 1. 지원자 목록 가져오기
  const fetchApplications = useCallback(async () => {
    if (!pid) return;
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
    }
  }, [pid]);

  // 2. 프로젝트 정보 (멤버 포함) 가져오기
  const fetchProjectData = useCallback(async () => {
    if (!pid) return;
    try {
      const response = await fetch(`/api/projects/${pid}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch project:', err);
    }
  }, [pid]);

  // 초기 데이터 로딩
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (sessionStatus === 'authenticated') {
        await Promise.all([fetchApplications(), fetchProjectData()]);
      } else if (sessionStatus === 'unauthenticated') {
        router.push('/login');
      }
      setIsLoading(false);
    };
    init();
  }, [sessionStatus, fetchApplications, fetchProjectData, router]);

  // 지원 상태 변경 핸들러
  const handleStatusChange = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        // 성공 시 목록 갱신
        fetchApplications();
        fetchNotifications();
        if (status === 'accepted') {
          fetchProjectData(); // 수락 시 멤버 리스트가 변경되므로 갱신
        }
      } else {
        throw new Error(data.message || '상태 변경에 실패했습니다.');
      }
    } catch (err: any) {
      await alert('에러', err.message);
    }
  };

  // 지원 내역 삭제 핸들러
  const handleDeleteApplication = async (appId: string) => {
    const ok = await confirm(
      '지원 내역 삭제',
      '정말 이 지원 내역을 목록에서 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      { isDestructive: true, closeOnBackdropClick: false }
    );
    if (ok === true) {
      try {
        const response = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          await alert('삭제 완료', '지원 내역이 삭제되었습니다.');
          fetchApplications();
        } else {
          throw new Error(data.message);
        }
      } catch (err: any) {
        await alert('에러', err.message);
      }
    }
  };

  if (isLoading || sessionStatus === 'loading') return <div className="text-center py-20 text-foreground">로딩 중...</div>;
  if (error) return <div className="text-center py-20 text-destructive">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-12 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-foreground">프로젝트 관리</h1>

      {/* 1. 현재 참여 멤버 섹션 */}
      {project && project.projectMembers && project.projectMembers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-foreground">현재 참여 멤버 ({project.projectMembers.length}명)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.projectMembers.map((pm: any) => {
              const user = pm.userId;
              if (!user) return null;
              return (
                <SimpleProfileCard
                  key={pm._id || Math.random()}
                  user={{
                    _id: user._id,
                    nName: user.nName || '알 수 없음',
                    position: user.position || pm.role || '팀원',
                    career: user.career || '신입',
                    level: user.level || 1,
                    techTags: user.techTags || [],
                    avatarUrl: user.avatarUrl
                  }}
                  onClick={() => router.push(`/profile/${user._id}`)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 지원자 목록 섹션 */}
      <h2 className="text-xl font-bold mb-4 text-foreground">지원자 목록</h2>
      {applications.length === 0 ? (
        <p className="text-muted-foreground">아직 지원자가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {applications.map(app => (
            <div key={app._id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-foreground">{app.applicantId.nName} <span className="text-sm font-normal text-muted-foreground">({app.applicantId.authorEmail})</span></p>
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
                    <button onClick={() => handleStatusChange(app._id, 'accepted')} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">수락</button>
                    <button onClick={() => handleStatusChange(app._id, 'rejected')} className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors">거절</button>
                  </>
                )}
                {app.status !== 'accepted' && (
                  <button onClick={() => handleDeleteApplication(app._id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors">삭제</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
