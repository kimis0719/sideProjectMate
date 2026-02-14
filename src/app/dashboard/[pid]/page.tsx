'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IProject } from '@/lib/models/Project';
import { getSocket } from '@/lib/socket';
import { useModalStore } from '@/store/modalStore';

// 프로젝트 데이터 타입 확장
interface PopulatedProject extends Omit<IProject, 'tags' | 'author'> {
    author: { _id: string; nName: string } | string;
    tags: { _id: string; name: string; category: string }[];
    likesCount: number;
    projectMembers?: any[];
}

import ProjectHeader from '@/components/dashboard/ProjectHeader';
import ResourceModal from '@/components/dashboard/ResourceModal';
import ProjectOverview from '@/components/dashboard/ProjectOverview';
import MemberWidget from '@/components/dashboard/MemberWidget';

export default function DashboardPage({ params }: { params: { pid: string } }) {
    const { pid } = params;
    const [project, setProject] = useState<PopulatedProject | null>(null);
    const [categoryLabel, setCategoryLabel] = useState<string>('');
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

            // 카테고리 라벨 조회
            try {
                const categoryRes = await fetch('/api/common-codes?group=CATEGORY');
                const categoryData = await categoryRes.json();
                if (categoryData.success) {
                    const matchedCategory = categoryData.data.find((c: any) => c.code === project.category);
                    setCategoryLabel(matchedCategory ? matchedCategory.label : project.category);
                }
            } catch (e) {
                setCategoryLabel(project.category);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (pid) fetchProject();
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
            console.log('Real-time sync triggered');
            fetchProject();
        };

        socket.on('resource-updated', handleSync);
        socket.on('project-updated', handleSync);

        return () => {
            socket.off('resource-updated', handleSync);
            socket.off('project-updated', handleSync);
        };
    }, [pid, session?.user?._id]);

    // ✨ 프로젝트 정보 업데이트 핸들러
    const handleUpdateProject = async (updates: { status?: string, overview?: string }) => {
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
    const handleAddResource = async (type: 'LINK' | 'TEXT', category: string, content: string, metadata?: any) => {
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
                getSocket().emit('resource-update', { projectId: pid, action: 'create', resource: data.data });
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
    const handleUpdateResource = async (resourceId: string, category: string, content: string, metadata?: any) => {
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
                getSocket().emit('resource-update', { projectId: pid, action: 'update', resource: data.data });
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
        if (!project || !project.projectMembers) return;

        // 현재 프로젝트의 모든 멤버 ID 추출 (본인 포함)
        const memberIds = project.projectMembers
            .map((pm: any) => pm.userId?._id)
            .filter((id: string) => id);

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
                const errorMsg = data.error ? `${data.message}\n(${data.error})` : (data.message || '팀 채팅방 입장에 실패했습니다.');
                await openAlert('오류', errorMsg);
            }
        } catch (e: any) {
            console.error(e);
            await openAlert('오류', `요청 중 문제가 발생했습니다.\n${e.message}`);
        }
    };

    if (isLoading) return <div className="p-8">로딩 중...</div>;
    if (error) return <div className="p-8 text-red-500">에러: {error}</div>;
    if (!project) return <div className="p-8">프로젝트를 찾을 수 없습니다.</div>;

    // 작성자 권한 확인
    const authorId = typeof project.author === 'string' ? project.author : project.author._id;
    const userId = session?.user?._id;
    const isAuthor = userId === authorId;


    return (
        <div className="container mx-auto p-4 lg:p-8 max-w-7xl">
            {/* 1. Header Area */}
            <ProjectHeader
                project={project as unknown as IProject}
                categoryLabel={categoryLabel}
                isAuthor={isAuthor || false}
                onStatusChange={(newStatus) => handleUpdateProject({ status: newStatus })}
            />

            {/* 2. Main Layout (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Column (Main Content) - 3/4 width */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Project Overview Section */}
                    <ProjectOverview
                        project={project as unknown as IProject}
                        isAuthor={isAuthor || false}
                        onUpdate={(newOverview) => handleUpdateProject({ overview: newOverview })}
                    />
                </div>

                {/* Right Column (Sidebar) - 1/4 width */}
                <div className="lg:col-span-1 h-full space-y-4">
                    {/* ✨ 팀 채팅 진입 버튼 */}
                    <button
                        onClick={handleTeamChat}
                        className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">💬</span>
                        팀 채팅방 입장
                    </button>

                    {/* Member List Widget (Real-time) */}
                    {project && session?.user && (
                        <MemberWidget
                            members={(project.projectMembers || []).map((pm: any) => ({
                                _id: pm.userId?._id,
                                nName: pm.userId?.nName,
                                email: pm.userId?.authorEmail,
                                image: pm.userId?.avatarUrl,
                                role: pm.role
                            })).filter(m => m._id)} // 유효한 유저만 필터링
                            currentUserId={session.user._id}
                            projectId={pid}
                        />
                    )}


                </div>
            </div>

            {/* ✨ Floating Action Button (FAB) */}
            <button
                onClick={() => setIsResourceModalOpen(!isResourceModalOpen)}
                className={`fixed right-8 bottom-8 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${isResourceModalOpen
                    ? 'bg-slate-800 text-white rotate-45'
                    : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300'
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
