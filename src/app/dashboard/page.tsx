'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Project {
    _id: string;
    pid: number;
    title: string;
    category: string;
    status: string;
    images: string[];
    members: any[];
}

export default function DashboardHome() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user?._id) {
            const fetchMyProjects = async () => {
                try {
                    const response = await fetch(`/api/projects?memberId=${session.user._id}`);
                    const data = await response.json();
                    if (data.success) {
                        setProjects(data.data.projects);
                    }
                } catch (error) {
                    console.error('Failed to fetch projects:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMyProjects();
        }
    }, [status, session, router]);

    if (status === 'loading' || isLoading) {
        return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">내 프로젝트 대쉬보드</h1>

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            key={project._id}
                            href={`/dashboard/${project.pid}`}
                            className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 overflow-hidden group"
                        >
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
                                {project.images && project.images.length > 0 ? (
                                    <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-4xl">🚀</div>
                                )}
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded backdrop-blur-sm">
                                    {project.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {project.title}
                                </h2>
                                <div className="flex items-center justify-between mt-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'recruiting'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {project.status === 'recruiting' ? '진행중' : '완료'}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        멤버 {project.members?.length || 0}명
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">참여 중인 프로젝트가 없습니다.</p>
                    <Link
                        href="/projects"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        프로젝트 찾아보기
                    </Link>
                </div>
            )}
        </div>
    );
}
