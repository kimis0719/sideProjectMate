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

export default function DashboardPage({ params }: { params: { pid: string } }) {
    const { pid } = params;
    const [project, setProject] = useState<PopulatedProject | null>(null);
    const [likeCount, setLikeCount] = useState<number>(0);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    // const [categoryLabel, setCategoryLabel] = useState<string>('');
    // const [statusLabel, setStatusLabel] = useState<string>('');
    const [hasApplied, setHasApplied] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const { data: session } = useSession();

    useEffect(() => {
        if (!pid) return;

        // 프로젝트 데이터와 카테고리/상태 정보를 함께 가져오는 비동기 함수
        const fetchData = async () => {
            try {
                // 1. 프로젝트 데이터 조회
                const projectRes = await fetch(`/api/projects/${pid}`);
                const projectData = await projectRes.json();
                console.log(projectData);

                if (!projectData.success) {
                    throw new Error(projectData.message || '프로젝트를 불러오는데 실패했습니다.');
                }

                const project = projectData.data;
                setProject(project);
                setLikeCount(project.likesCount || 0);
                if (session?.user?._id) {
                    setIsLiked(project.likes.includes(session.user._id));
                }

                // // 2. 카테고리 라벨 조회 (공통 코드 API 호출)
                // try {
                //   const categoryRes = await fetch('/api/common-codes?group=CATEGORY');
                //   const categoryData = await categoryRes.json();
                //   if (categoryData.success) {
                //     const matchedCategory = categoryData.data.find((c: any) => c.code === project.category);
                //     setCategoryLabel(matchedCategory ? matchedCategory.label : project.category);
                //   }
                // } catch (e) {
                //   console.error('카테고리 정보 로딩 실패', e);
                //   setCategoryLabel(project.category);
                // }

                // // 3. 상태 라벨 조회 (공통 코드 API 호출)
                // try {
                //   const statusRes = await fetch('/api/common-codes?group=STATUS');
                //   const statusData = await statusRes.json();
                //   if (statusData.success) {
                //     const matchedStatus = statusData.data.find((c: any) => c.code === project.status);
                //     setStatusLabel(matchedStatus ? matchedStatus.label : project.status);
                //   }
                // } catch (e) {
                //   console.error('상태 정보 로딩 실패', e);
                //   setStatusLabel(project.status);
                // }

                // 4. 지원 여부 확인 (로그인한 경우)
                if (session?.user?._id) {
                    try {
                        const applyRes = await fetch(`/api/projects/${pid}/application/me`);
                        const applyData = await applyRes.json();
                        if (applyData.success) {
                            setHasApplied(applyData.applied);
                        }
                    } catch (e) {
                        console.error('지원 내역 확인 실패', e);
                    }
                }

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [pid, session]);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">대쉬보드 개요</h1>
            <p className="text-gray-600 dark:text-gray-400">
                프로젝트 "{project?.title}"의 진행 상황을 한눈에 볼 수 있는 페이지입니다.
            </p>
            {/* 추후 대쉬보드 위젯 등 추가 */}
        </div>
    );
}
