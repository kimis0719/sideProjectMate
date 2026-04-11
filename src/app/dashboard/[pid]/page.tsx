'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IProject } from '@/lib/models/Project';
import { getSocket } from '@/lib/socket';
import { useModalStore } from '@/store/modalStore';

// 프로젝트 멤버 populate된 타입
interface PopulatedProjectMember {
  userId?: { _id: string; nName?: string; authorEmail?: string; avatarUrl?: string };
  role: string;
  status: 'active' | 'inactive' | 'removed';
}

// 리소스 메타데이터 타입
interface ResourceMetadata {
  title?: string;
  image?: string;
  [key: string]: string | undefined;
}

// 프로젝트 데이터 타입 확장
interface PopulatedProject extends Omit<IProject, 'tags' | 'ownerId' | 'members'> {
  ownerId: { _id: string; nName: string } | string;
  tags: { _id: string; name: string; category: string }[];
  likesCount: number;
  members: PopulatedProjectMember[];
}

import ProjectHeader from '@/components/dashboard/ProjectHeader';
import ResourceModal from '@/components/dashboard/ResourceModal';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import MemberWidget from '@/components/dashboard/MemberWidget';
import SprintPulseWidget from '@/components/dashboard/SprintPulseWidget';
import RecentChatWidget from '@/components/dashboard/RecentChatWidget';

export default function DashboardPage({ params }: { params: { pid: string } }) {
  const { pid } = params;
  const [project, setProject] = useState<PopulatedProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  const { data: session } = useSession();
  const { openAlert } = useModalStore();

  // 1. 프로젝트 데이터 조회
  const fetchProject = async () => {
    try {
      const projectRes = await fetch(`/api/projects/${pid}`);
      const projectData = await projectRes.json();
      if (!projectData.success) throw new Error(projectData.message);

      const project = projectData.data;
      setProject(project);
    } catch (err: unknown) {
      console.error('[DD] 에러:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pid) fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pid 변경 시에만 프로젝트 재조회; fetchProject를 deps에 넣으면 매 렌더마다 재호출
  }, [pid]);

  // ✨ 소켓 연결 및 프로젝트 입장
  useEffect(() => {
    if (!pid || !session?.user?._id) return;

    const socket = getSocket();

    // 연결되면 프로젝트 룸 입장
    if (socket.connected) {
      socket.emit('join-project', { projectId: pid, userId: session.user._id });
    } else {
      socket.on('connect', () => {
        socket.emit('join-project', { projectId: pid, userId: session.user._id });
      });
    }

    // ✨ 리소스/프로젝트 실시간 동기화
    const handleSync = () => {
      console.warn('Real-time sync triggered');
      fetchProject();
    };

    socket.on('resource-updated', handleSync);
    socket.on('project-updated', handleSync);

    return () => {
      socket.off('resource-updated', handleSync);
      socket.off('project-updated', handleSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchProject를 deps에 추가하면 소켓 리스너가 매 렌더마다 재등록되어 성능 저하; pid/session 변경 시에만 재설정
  }, [pid, session?.user?._id]);

  // ✨ 프로젝트 정보 업데이트 핸들러
  const handleUpdateProject = async (updates: { status?: string; overview?: string }) => {
    try {
      const res = await fetch(`/api/projects/${pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (data.success) {
        fetchProject();
        // 📡 소켓 알림
        const type = updates.status ? 'status' : 'overview';
        getSocket().emit('project-update', { projectId: pid, type, data: updates });
      } else {
        await openAlert('오류', data.message);
      }
    } catch (e) {
      console.error(e);
      await openAlert('오류', '업데이트 중 오류가 발생했습니다.');
    }
  };

  // ✨ 리소스 추가 핸들러
  const handleAddResource = async (
    type: 'LINK' | 'TEXT',
    category: string,
    content: string,
    metadata?: ResourceMetadata
  ) => {
    try {
      const res = await fetch(`/api/projects/${pid}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, category, content, metadata }),
      });
      const data = await res.json();

      if (data.success) {
        fetchProject();
        // 📡 소켓 알림
        getSocket().emit('resource-update', {
          projectId: pid,
          action: 'create',
          resource: data.data,
        });
      } else {
        await openAlert('오류', data.message);
      }
    } catch (e) {
      console.error(e);
      await openAlert('오류', '리소스 추가 중 오류가 발생했습니다.');
    }
  };

  // ✨ 리소스 삭제 핸들러
  const handleDeleteResource = async (resourceId: string) => {
    // Confirm은 Modal 내부에서 처리하므로 삭제
    try {
      const res = await fetch(`/api/projects/${pid}/resources?resourceId=${resourceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        fetchProject();
        // 📡 소켓 알림
        getSocket().emit('resource-update', { projectId: pid, action: 'delete', resourceId });
      } else {
        await openAlert('오류', data.message);
      }
    } catch (e) {
      console.error(e);
      await openAlert('오류', '리소스 삭제 중 오류가 발생했습니다.');
    }
  };

  // ✨ 리소스 수정 핸들러
  const handleUpdateResource = async (
    resourceId: string,
    category: string,
    content: string,
    metadata?: ResourceMetadata
  ) => {
    try {
      const res = await fetch(`/api/projects/${pid}/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, category, content, metadata }),
      });
      const data = await res.json();

      if (data.success) {
        fetchProject();
        // 📡 소켓 알림
        getSocket().emit('resource-update', {
          projectId: pid,
          action: 'update',
          resource: data.data,
        });
      } else {
        await openAlert('오류', data.message);
      }
    } catch (e) {
      console.error(e);
      await openAlert('오류', '리소스 수정 중 오류가 발생했습니다.');
    }
  };

  // ✨ 팀 채팅방 입장/생성 핸들러
  const handleTeamChat = async () => {
    if (!project || !project.members) return;

    // 현재 프로젝트의 모든 멤버 ID 추출 (본인 포함)
    const memberIds = project.members
      .map((pm: PopulatedProjectMember) => pm.userId?._id)
      .filter((id): id is string => !!id);

    // 유효성 검사: 멤버가 너무 적으면 팀 채팅 의미가 없음 (옵션)
    if (memberIds.length < 2) {
      await openAlert('알림', '대화할 팀원이 부족합니다. (최소 2명 이상의 멤버 필요)');
      return;
    }

    try {
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'TEAM',
          participants: memberIds,
          projectId: project._id, // 🔥 프로젝트의 실제 ObjectId (_id)로 수정
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Next.js Router를 이용해 채팅 페이지로 이동
        // window.location.href = `/chat?roomId=${data.data._id}`; // 혹은 router
        // 위에서 router를 import 안했음. router 추가 필요?
        // DashboardPage는 'use client' 이지만 router hook이 없음. import 필요.
        // 아, page.tsx 상단에 import 나 router 선언이 없는지 확인해야 함.
        // 확인해보니 import { useRouter } from 'next/navigation'이 없음!
        // window.location.href를 임시로 쓰거나, useRouter를 추가해야 함.
        // 코드 품질을 위해 useRouter를 추가하는 게 맞음.
        // 하지만 이 replace 블록에서는 함수만 추가하고 싶음.
        // 일단 window.location.href 사용 (간편함).
        window.location.href = `/chat?roomId=${data.data._id}`;
      } else {
        const errorMsg = data.error
          ? `${data.message}\n(${data.error})`
          : data.message || '팀 채팅방 입장에 실패했습니다.';
        await openAlert('오류', errorMsg);
      }
    } catch (e: unknown) {
      console.error(e);
      await openAlert(
        '오류',
        `요청 중 문제가 발생했습니다.\n${e instanceof Error ? e.message : '알 수 없는 오류'}`
      );
    }
  };

  if (isLoading) return <div className="p-8 text-on-surface">로딩 중...</div>;
  if (error) return <div className="p-8 text-error">에러: {error}</div>;
  if (!project) return <div className="p-8 text-on-surface">프로젝트를 찾을 수 없습니다.</div>;

  // 작성자 권한 확인
  const authorId = typeof project.ownerId === 'string' ? project.ownerId : project.ownerId._id;
  const userId = session?.user?._id;
  const isAuthor = userId === authorId;

  return (
    <div className="px-6 lg:px-8 py-8 bg-surface">
      {/* 1. Header Area */}
      <ProjectHeader
        project={project as unknown as IProject}
        categoryLabel=""
        isAuthor={isAuthor || false}
        onStatusChange={(newStatus) => handleUpdateProject({ status: newStatus })}
        onTeamChat={handleTeamChat}
      />

      {/* 2. Bento Grid Layout */}
      <div className="space-y-6">
        {/* Row 1: Overview + Member — 높이 동기화 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:items-stretch">
          <div className="md:col-span-8">
            <ProjectOverview
              project={project as unknown as IProject}
              isAuthor={isAuthor || false}
              onUpdate={(newOverview) => handleUpdateProject({ overview: newOverview })}
            />
          </div>
          <div className="md:col-span-4">
            {project && session?.user && (
              <MemberWidget
                members={(project.members || [])
                  .filter((pm: PopulatedProjectMember) => pm.userId?._id)
                  .map((pm: PopulatedProjectMember) => ({
                    _id: pm.userId!._id,
                    nName: pm.userId?.nName,
                    email: pm.userId?.authorEmail,
                    image: pm.userId?.avatarUrl,
                    role: pm.role,
                  }))}
                currentUserId={session.user._id}
                projectId={pid}
              />
            )}
          </div>
        </div>

        {/* Row 2: Sprint Pulse + Recent Chat — 높이 동기화 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:items-stretch">
          <div className="md:col-span-6">
            <SprintPulseWidget pid={pid} />
          </div>
          <div className="md:col-span-6">
            <RecentChatWidget
              projectId={(project as unknown as { _id: string })._id}
              pid={pid}
              currentUserId={session?.user?._id || ''}
            />
          </div>
        </div>
      </div>

      {/* ✨ Floating Action Button (FAB) */}
      <button
        onClick={() => setIsResourceModalOpen(!isResourceModalOpen)}
        className={`fixed right-8 bottom-8 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isResourceModalOpen
            ? 'bg-primary-container text-on-primary rotate-45'
            : 'bg-surface-container-lowest text-on-surface shadow-[0_4px_12px_rgba(26,28,28,0.08)] hover:shadow-[0_8px_24px_rgba(26,28,28,0.12)]'
        }`}
        aria-label="Toggle Resource Box"
      >
        <span className="text-2xl">{isResourceModalOpen ? '＋' : '📦'}</span>
      </button>

      {/* ✨ Resource Modal (Popup Style) */}
      <ResourceModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resources={project.resources || []}
        onAddResource={handleAddResource}
        onDeleteResource={handleDeleteResource}
        onUpdateResource={handleUpdateResource}
        currentUserId={session?.user?._id || ''} // ✨ Prop 전달
        projectAuthorId={authorId} // ✨ Prop 전달
      />
    </div>
  );
}
