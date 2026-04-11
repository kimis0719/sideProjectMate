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
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">
        내 메모
      </label>
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="지원자에 대한 메모를 남겨보세요"
          className="flex-1 px-4 py-2.5 text-sm bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary-container/20 placeholder:text-on-surface-variant/30"
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
            className="px-4 py-2.5 text-xs font-bold bg-primary-container text-on-primary rounded-xl hover:opacity-90 disabled:opacity-50"
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

  // 멤버 강퇴 핸들러
  const handleKickMember = async (userId: string, memberName: string) => {
    const ok = await confirm(
      '멤버 강퇴',
      `정말 ${memberName}님을 프로젝트에서 강퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      { isDestructive: true, closeOnBackdropClick: false }
    );
    if (ok === true) {
      try {
        const response = await fetch(`/api/projects/${pid}/members/${userId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          await alert('강퇴 완료', `${memberName}님이 프로젝트에서 제거되었습니다.`);
          fetchProjectData();
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
    return <div className="text-center py-20 text-on-surface">로딩 중...</div>;
  if (error) return <div className="text-center py-20 text-error">{error}</div>;

  return (
    <div className="px-6 lg:px-8 py-10 bg-surface min-h-screen">
      <h1 className="text-4xl font-bold font-headline tracking-tight text-on-surface mb-8">
        프로젝트 관리
      </h1>

      {/* 1. 현재 참여 멤버 섹션 */}
      {project && project.members && project.members.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6 text-on-surface font-headline flex items-center gap-2">
            현재 참여 멤버
            <span className="text-sm font-normal text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
              {project.members.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {project.members.map((pm) => {
              const user = pm.userId;
              if (!user) return null;
              const isOwner = user._id === session?.user?._id;
              return (
                <div key={pm._id || Math.random()} className="relative group">
                  <SimpleProfileCard
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
                  {!isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKickMember(user._id, user.nName || '알 수 없음');
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-error-container/80 text-error hover:bg-error-container transition-all"
                      title="멤버 강퇴"
                    >
                      <span className="material-symbols-outlined text-base">person_remove</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. 지원자 목록 섹션 */}
      <h2 className="text-xl font-bold mb-6 text-on-surface font-headline">지원자 목록</h2>
      {applications.length === 0 ? (
        <p className="text-on-surface-variant">아직 지원자가 없습니다.</p>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div
              key={app._id}
              className={`bg-surface-container-lowest p-8 rounded-xl border-l-4 transition-all duration-300 ${
                app.status === 'accepted'
                  ? 'border-emerald-500'
                  : app.status === 'rejected'
                    ? 'border-error opacity-70 grayscale-[0.5] hover:grayscale-0 hover:opacity-100'
                    : app.status === 'withdrawn'
                      ? 'border-surface-container-high opacity-70 grayscale-[0.5] hover:grayscale-0 hover:opacity-100'
                      : 'border-primary-container'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xl text-on-surface">
                    {app.applicantId.nName}{' '}
                    <span className="text-sm font-normal text-on-surface-variant">
                      ({app.applicantId.authorEmail})
                    </span>
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-on-surface-variant">
                      주 {app.weeklyHours}h 가능
                    </span>
                  </div>
                  {/* 지원 동기 */}
                  <div className="mt-4 relative pl-6 py-2 border-l-4 border-primary-container/20">
                    <p className="italic text-on-surface-variant leading-relaxed">
                      {app.motivation}
                    </p>
                  </div>
                  {/* 추가 메시지 */}
                  {app.message && (
                    <p className="mt-2 text-sm text-on-surface-variant italic">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right ml-4 shrink-0">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      app.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'rejected'
                          ? 'bg-error-container/40 text-error'
                          : app.status === 'withdrawn'
                            ? 'bg-surface-container-high text-on-surface-variant'
                            : 'bg-primary-container/15 text-primary-container'
                    }`}
                  >
                    {app.status === 'accepted'
                      ? '수락됨'
                      : app.status === 'rejected'
                        ? '거절됨'
                        : app.status === 'withdrawn'
                          ? '취소됨'
                          : '대기중'}
                  </span>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {new Date(app.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
              {/* 오너 메모 */}
              <div className="mt-6">
                <OwnerNoteInput
                  initialValue={app.ownerNote || ''}
                  onSave={(note) => handleSaveOwnerNote(app._id, note)}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                {/* 대화하기 버튼 */}
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
                          projectId: project?._id,
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-low text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chat_bubble</span>
                  대화하기
                </button>

                {app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(app._id, 'accepted')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-bold text-sm hover:opacity-90 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      수락
                    </button>
                    <button
                      onClick={() => handleStatusChange(app._id, 'rejected')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-error-container/10 text-error font-bold text-sm hover:bg-error-container/20 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      거절
                    </button>
                  </>
                )}
                {app.status !== 'accepted' && (
                  <button
                    onClick={() => handleDeleteApplication(app._id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-error-container/10 text-error font-bold text-sm hover:bg-error-container/20 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
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
