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
  motivation: string;
  weeklyHours: number;
  message?: string;
  ownerNote?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

function OwnerNoteInput({
  initialValue,
  onSave,
}: {
  initialValue: string;
  onSave: (note: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = value !== initialValue;

  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">내 메모</label>
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="지원자에 대한 메모를 남겨보세요"
          className="flex-1 px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground"
          maxLength={500}
        />
        {isDirty && (
          <button
            onClick={async () => {
              setIsSaving(true);
              await onSave(value);
              setIsSaving(false);
            }}
            disabled={isSaving}
            className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? '저장...' : '저장'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ManageApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const pid = params.pid as string;
  const { alert, confirm } = useModal();

  // 상태 관리
  interface ProjectWithMembers {
    _id: string;
    members: {
      _id?: string;
      userId: {
        _id: string;
        nName?: string;
        position?: string;
        career?: string;
        level?: number;
        techTags?: string[];
        avatarUrl?: string;
      };
      role: string;
      status: string;
    }[];
  }
  const [project, setProject] = useState<ProjectWithMembers | null>(null); // 프로젝트 정보 (멤버 포함)
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
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
    } catch (err: unknown) {
      await alert('에러', err instanceof Error ? err.message : '알 수 없는 오류');
    }
  };

  // 오너 메모 저장 핸들러
  const handleSaveOwnerNote = async (appId: string, ownerNote: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerNote }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, ownerNote } : a)));
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      await alert('오류', err instanceof Error ? err.message : '메모 저장 실패');
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
      } catch (err: unknown) {
        await alert('에러', err instanceof Error ? err.message : '알 수 없는 오류');
      }
    }
  };

  if (isLoading || sessionStatus === 'loading')
    return <div className="text-center py-20 text-foreground">로딩 중...</div>;
  if (error) return <div className="text-center py-20 text-destructive">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-12 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-foreground">프로젝트 관리</h1>

      {/* 1. 현재 참여 멤버 섹션 */}
      {project && project.members && project.members.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 text-foreground">
            현재 참여 멤버 ({project.members.length}명)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members.map((pm) => {
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
                    avatarUrl: user.avatarUrl,
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
          {applications.map((app) => (
            <div key={app._id} className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg text-foreground">
                    {app.applicantId.nName}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({app.applicantId.authorEmail})
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground">
                      주 {app.weeklyHours}h 가능
                    </span>
                  </div>
                  {/* 지원 동기 */}
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">지원 동기</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{app.motivation}</p>
                  </div>
                  {/* 추가 메시지 */}
                  {app.message && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                      app.status === 'accepted'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                        : app.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                          : app.status === 'withdrawn'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                    }`}
                  >
                    {app.status === 'accepted'
                      ? '수락됨'
                      : app.status === 'rejected'
                        ? '거절됨'
                        : app.status === 'withdrawn'
                          ? '취소됨'
                          : '대기 중'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(app.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
              {/* 오너 메모 */}
              <div className="mt-4 pt-3 border-t border-border">
                <OwnerNoteInput
                  initialValue={app.ownerNote || ''}
                  onSave={(note) => handleSaveOwnerNote(app._id, note)}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {/* ✨ 대화하기 버튼 (면접/인터뷰) */}
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/chat/rooms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          category: 'RECRUIT',
                          participants: [app.applicantId._id],
                          applicationId: app._id,
                          projectId: project?._id, // 🔥 프로젝트의 실제 ObjectId (_id)로 수정
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        router.push(`/chat?roomId=${data.data._id}`);
                      } else {
                        const errorMsg = data.error
                          ? `${data.message}\n(${data.error})`
                          : data.message || '채팅방 생성 실패';
                        await alert('오류', errorMsg);
                      }
                    } catch (e: unknown) {
                      await alert(
                        '오류',
                        `요청 중 문제가 발생했습니다.\n${e instanceof Error ? e.message : '알 수 없는 오류'}`
                      );
                    }
                  }}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  대화하기
                </button>

                {app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(app._id, 'accepted')}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleStatusChange(app._id, 'rejected')}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      거절
                    </button>
                  </>
                )}
                {app.status !== 'accepted' && (
                  <button
                    onClick={() => handleDeleteApplication(app._id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
