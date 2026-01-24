'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { IProject } from '@/lib/models/Project';
import { useNotificationStore } from '@/lib/store/notificationStore';

// 프로젝트 데이터 타입 확장 (populate된 필드 포함)
interface PopulatedProject extends Omit<IProject, 'tags' | 'author'> {
    author: { _id: string; nName: string } | string;
    tags: { _id: string; name: string; category: string }[];
    likesCount: number;
    projectMembers?: any[]; // projectMembers 필드 추가
}

// ... (imports)
import ProjectHeader from '@/components/dashboard/ProjectHeader';
import ResourceModal from '@/components/dashboard/ResourceModal';
import ProjectOverview from '@/components/dashboard/ProjectOverview';


// ... (interface PopulatedProject)

export default function DashboardPage({ params }: { params: { pid: string } }) {
    const { pid } = params;
    const [project, setProject] = useState<PopulatedProject | null>(null);
    const [categoryLabel, setCategoryLabel] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false); // ✨ 모달 상태

    const { data: session } = useSession();

    // 1. 프로젝트 데이터 조회 (기존과 동일)
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

    // ✨ 프로젝트 정보 업데이트 핸들러 (상태, 개요)
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
            } else {
                alert(data.message);
            }
        } catch (e) {
            console.error(e);
            alert('업데이트 중 오류가 발생했습니다.');
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
                // 데이터를 다시 불러오거나 로컬 상태만 업데이트
                fetchProject(); // 편의상 전체 재조회 (리소스는 무겁지 않으므로)
            } else {
                alert(data.message);
            }
        } catch (e) {
            console.error(e);
            alert('리소스 추가 중 오류가 발생했습니다.');
        }
    };

    // ✨ 리소스 삭제 핸들러
    const handleDeleteResource = async (resourceId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/projects/${pid}/resources?resourceId=${resourceId}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                fetchProject();
            } else {
                alert(data.message);
            }
        } catch (e) {
            console.error(e);
            alert('리소스 삭제 중 오류가 발생했습니다.');
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
            } else {
                alert(data.message);
            }
        } catch (e) {
            console.error(e);
            alert('리소스 수정 중 오류가 발생했습니다.');
        }
    };

    if (isLoading) return <div className="p-8">로딩 중...</div>;
    if (error) return <div className="p-8 text-red-500">에러: {error}</div>;
    if (!project) return <div className="p-8">프로젝트를 찾을 수 없습니다.</div>;

    // 작성자 권한 확인
    const authorId = typeof project.author === 'string' ? project.author : project.author._id;
    const userId = session?.user?._id;
    const isAuthor = userId === authorId;

    console.log('[Dashboard] Auth Check:', { authorId, userId, isAuthor }); // 디버깅용 로그

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

                    {/* Future Widgets (e.g. Schedule, Kanban Preview) */}
                    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
                        <p>추후 일정/칸반 위젯 영역</p>
                    </div>
                </div>

                {/* Right Column (Sidebar) - 1/4 width */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Member List Widget */}
                    <div className="bg-white rounded-xl border shadow-sm p-5">
                        <h3 className="font-semibold mb-3 flex items-center justify-between">
                            팀원 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{project.members?.length || 0}</span>
                        </h3>
                        {/* Placeholder */}
                        <div className="text-sm text-gray-500 py-4 text-center">
                            멤버 리스트 (준비중)
                        </div>
                    </div>

                    {/* Shared Resources Widget */}
                    <div className="bg-white rounded-xl border shadow-sm p-5">
                        <h3 className="font-semibold mb-3 flex items-center justify-between">
                            공유 자원 <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{project.resources?.length || 0}</span>
                        </h3>
                        <div className="text-sm text-gray-400 py-4 text-center">
                            우측 하단 버튼을 통해<br />자원을 관리하세요.
                        </div>
                    </div>
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
            />
        </div>
    );
}
