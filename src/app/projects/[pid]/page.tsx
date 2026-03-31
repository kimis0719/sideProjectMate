'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { IProject } from '@/lib/models/Project';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useApplicationStore } from '@/store/applicationStore';
import DetailProfileCard from '@/components/profile/DetailProfileCard';
import ProjectThumbnail from '@/components/projects/ProjectThumbnail';
import { useModal } from '@/hooks/useModal';
import ReviewModal from '@/components/projects/ReviewModal';
import ApplyModal from '@/components/projects/ApplyModal';
import AdBanner from '@/components/common/AdBanner';
import {
  STAGE_LABELS,
  STYLE_LABELS,
  STATUS_LABELS,
  ProjectStage,
  ExecutionStyle,
  ProjectStatus,
} from '@/constants/project';

// 동적 임포트를 사용하여 이미지 슬라이더 컴포넌트를 로드 (SSR 제외)
const ProjectImageSlider = dynamic(() => import('@/components/ProjectImageSlider'), {
  ssr: false,
  loading: () => <div className="aspect-video bg-gray-100 rounded-lg animate-pulse" />,
});

// 프로젝트 소유자 populate된 타입
interface PopulatedOwner {
  _id: string;
  nName: string;
  position?: string;
  career?: string;
  level?: number;
  introduction?: string;
  techTags?: string[];
  status?: string;
  avatarUrl?: string;
  socialLinks?: {
    github?: string;
    blog?: string;
    linkedin?: string;
    other?: string;
    solvedAc?: string;
  };
}

// 프로젝트 멤버 populate된 타입 (embedded)
interface PopulatedMember {
  userId?: { _id: string; nName?: string; avatarUrl?: string; position?: string } | string;
  role: string;
  status: 'active' | 'inactive' | 'removed';
}

// 공통 코드 항목 타입
interface CommonCodeItem {
  code: string;
  label: string;
}

// 프로젝트 데이터 타입 확장 (populate된 필드 포함)
interface PopulatedProject extends Omit<IProject, 'ownerId' | 'members'> {
  ownerId: PopulatedOwner | string;
  members: PopulatedMember[];
  likesCount: number;
}

interface ProjectPageProps {
  params: { pid: string };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { pid } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const { alert, confirm } = useModal();

  const [project, setProject] = useState<PopulatedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  // 상태 라벨 표시를 위한 상태
  const [statusLabel, setStatusLabel] = useState('');

  // 리뷰 관련 상태
  const [reviewTarget, setReviewTarget] = useState<{
    _id: string;
    nName: string;
    avatarUrl?: string;
    position?: string;
  } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const { fetchNotifications } = useNotificationStore();
  const { fetchMyApplications, getStatus, loaded: appLoaded } = useApplicationStore();

  const isOwner =
    session?.user?._id &&
    typeof project?.ownerId === 'object' &&
    project.ownerId._id === session.user._id;

  // 현재 사용자가 프로젝트 멤버인지 확인
  const isMember = project?.members?.some((m: PopulatedMember) => {
    if (!m.userId) return false;
    const userId = typeof m.userId === 'object' ? m.userId._id : m.userId;
    return userId === session?.user?._id;
  });

  useEffect(() => {
    if (!pid) return;

    // 프로젝트 데이터와 카테고리/상태 정보를 함께 가져오는 비동기 함수
    const fetchData = async () => {
      try {
        // 1. 프로젝트 데이터 조회
        const projectRes = await fetch(`/api/projects/${pid}`);
        const projectData = await projectRes.json();

        if (!projectData.success) {
          throw new Error(projectData.message || '프로젝트를 불러오는데 실패했습니다.');
        }

        const project = projectData.data;
        setProject(project);
        setLikeCount(project.likesCount || 0);

        // 상태 라벨은 상수에서 직접 가져옴
        setStatusLabel(STATUS_LABELS[project.status as ProjectStatus] || project.status);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    // ... (previous code)
    fetchData();
  }, [pid, session]);

  // 지원 상태 스토어 로딩 (최초 1회)
  useEffect(() => {
    if (session?.user?._id && !appLoaded) {
      fetchMyApplications();
    }
  }, [session?.user?._id, appLoaded, fetchMyApplications]);

  // 프로젝트 완료 상태이고 팀원/작성자인 경우 기존 리뷰 여부 조회
  useEffect(() => {
    if (!project || project.status !== 'completed' || !session?.user?._id) return;
    if (!isMember && !isOwner) return;

    const reviewableUsers = getReviewableUsers();
    if (reviewableUsers.length === 0) return;

    Promise.all(
      reviewableUsers.map((u) =>
        fetch(`/api/reviews/check?projectId=${project._id}&revieweeId=${u._id}`)
          .then((r) => r.json())
          .then((data) => (data.data?.hasReviewed ? u._id : null))
          .catch(() => null)
      )
    ).then((results) => {
      const ids = results.filter(Boolean) as string[];
      setReviewedIds(new Set(ids));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?._id, project?.status, session?.user?._id]);

  /** 리뷰 가능한 팀원 목록 (자신 제외) */
  const getReviewableUsers = () => {
    if (!project || !session?.user?._id) return [];
    const users: { _id: string; nName: string; avatarUrl?: string; position?: string }[] = [];

    // 프로젝트 작성자
    if (typeof project.ownerId === 'object' && project.ownerId._id !== session.user._id) {
      const owner = project.ownerId as PopulatedOwner;
      users.push({
        _id: owner._id,
        nName: owner.nName || '작성자',
        avatarUrl: owner.avatarUrl,
        position: owner.position,
      });
    }

    // 활성 팀원
    project.members?.forEach((m: PopulatedMember) => {
      const memberUser = typeof m.userId === 'object' ? m.userId : null;
      const userId = memberUser?._id || (typeof m.userId === 'string' ? m.userId : undefined);
      if (userId && userId !== session.user?._id && m.status === 'active') {
        users.push({
          _id: userId,
          nName: memberUser?.nName || '팀원',
          avatarUrl: memberUser?.avatarUrl,
          position: memberUser?.position,
        });
      }
    });

    return users;
  };

  // ✨ [채팅] 1:1 문의하기 핸들러
  const handleInquiry = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (!project || typeof project.ownerId !== 'object') {
      await alert('오류', '프로젝트 작성자 정보를 찾을 수 없습니다.');
      return;
    }

    if (isOwner) {
      await alert('알림', '본인의 프로젝트에는 문의할 수 없습니다.');
      return;
    }

    try {
      // 채팅방 생성 요청 (INQUIRY)
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'INQUIRY',
          participants: [project.ownerId._id], // 작성자 ID (나 자신은 API에서 자동 추가됨)
          projectId: project._id, // 🔥 프로젝트의 실제 ObjectId (_id)로 수정
        }),
      });

      const data = await res.json();

      if (data.success) {
        // 채팅방으로 이동 (임시 라우트 /chat)
        router.push(`/chat?roomId=${data.data._id}`);
      } else {
        // ✨ 에러 디버깅을 위해 상세 메시지 표시
        const errorMsg = data.error
          ? `${data.message}\n(${data.error})`
          : data.message || '채팅방 생성에 실패했습니다.';
        await alert('오류', errorMsg);
      }
    } catch (e: unknown) {
      console.error(e);
      await alert(
        '오류',
        `문의하기 요청 중 문제가 발생했습니다.\n${e instanceof Error ? e.message : '알 수 없는 오류'}`
      );
    }
  };

  const handleLike = async () => {
    // ... (rest of code)
    if (!session) {
      router.push('/login');
      return;
    }
    try {
      const response = await fetch(`/api/projects/${pid}/like`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setLikeCount(data.data.likeCount);
        setIsLiked(true);
        fetchNotifications();
      } else {
        await alert('알림', data.message || '요청에 실패했습니다.');
      }
    } catch (err) {
      await alert('에러', '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    const ok = await confirm(
      '프로젝트 삭제',
      '정말 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      { isDestructive: true, closeOnBackdropClick: false }
    );
    if (ok === true) {
      try {
        const response = await fetch(`/api/projects/${pid}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          await alert('삭제 완료', '프로젝트가 삭제되었습니다.');
          router.push('/projects');
        } else {
          throw new Error(data.message || '삭제에 실패했습니다.');
        }
      } catch (err: unknown) {
        await alert('에러', err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const getOwnerName = (owner: PopulatedOwner | string | undefined | null): string => {
    if (typeof owner === 'object' && owner !== null && 'nName' in owner) {
      return owner.nName;
    }
    if (typeof owner === 'string') {
      return owner;
    }
    return '작성자';
  };

  const handleOpenApplyModal = () => {
    if (!session) {
      router.push('/login');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleWithdraw = async () => {
    if (!project) return;
    const appEntry = getStatus(project._id.toString());
    if (!appEntry) return;

    const ok = await confirm('지원 취소', '정말 지원을 취소하시겠습니까?', { isDestructive: true });
    if (ok !== true) return;

    try {
      const res = await fetch(`/api/applications/${appEntry.applicationId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        useApplicationStore.getState().withdrawApplication(project._id.toString());
        await alert('완료', '지원이 취소되었습니다.');
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      await alert('오류', err instanceof Error ? err.message : '취소 중 오류가 발생했습니다.');
    }
  };

  const handleLeaveProject = async () => {
    if (!project) return;
    const appEntry = getStatus(project._id.toString());
    if (!appEntry) return;

    const ok = await confirm(
      '프로젝트 탈퇴',
      '정말 이 프로젝트에서 탈퇴하시겠습니까? 다시 참여하려면 새로 지원해야 합니다.',
      { isDestructive: true }
    );
    if (ok !== true) return;

    try {
      const res = await fetch(`/api/applications/${appEntry.applicationId}/leave`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.success) {
        useApplicationStore.getState().withdrawApplication(project._id.toString());
        await alert('완료', '프로젝트에서 탈퇴했습니다.');
        router.refresh();
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      await alert('오류', err instanceof Error ? err.message : '탈퇴 중 오류가 발생했습니다.');
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        로딩 중...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-destructive">
        오류: {error}
      </div>
    );
  if (!project)
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        프로젝트를 찾을 수 없습니다.
      </div>
    );

  // 버튼 상태 분기 (6가지)
  const appEntry = project ? getStatus(project._id.toString()) : null;
  type ApplyButtonState = 'owner' | 'closed' | 'none' | 'pending' | 'accepted' | 'rejected';
  let applyState: ApplyButtonState = 'none';

  if (isOwner) {
    applyState = 'owner';
  } else if (project.status !== 'recruiting' && !appEntry) {
    applyState = 'closed';
  } else if (appEntry) {
    applyState = appEntry.status as ApplyButtonState;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* 목록으로 돌아가기 */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            목록으로
          </Link>
          {isOwner && (
            <div className="flex gap-2">
              <Link
                href={`/projects/${pid}/manage`}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                지원자 관리
              </Link>
              <Link
                href={`/projects/${pid}/edit`}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          )}
        </div>
        <div className="mb-8 md:mb-12">
          {/* 배지: currentStage + status */}
          <div className="flex items-center gap-2 mb-3">
            {project.currentStage && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                {STAGE_LABELS[project.currentStage as ProjectStage] || project.currentStage}
              </span>
            )}
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                project.status === 'recruiting'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {statusLabel || project.status}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{project.title}</h1>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <span>작성자: {getOwnerName(project.ownerId)}</span>
              <span className="mx-2">|</span>
              <span>{new Date(project.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>{project.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{likeCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            {/* 프로젝트 동기 (problemStatement) */}
            {project.problemStatement && (
              <div className="bg-muted/30 border border-border rounded-lg p-6 mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">프로젝트 동기</h2>
                <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground">
                  {project.problemStatement}
                </p>
              </div>
            )}

            {/* 실행 방식 + lookingFor */}
            <div className="flex flex-wrap gap-4 mb-8">
              {project.executionStyle && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">실행 방식:</span>
                  <span className="px-2.5 py-1 text-sm font-medium rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {STYLE_LABELS[project.executionStyle as ExecutionStyle] ||
                      project.executionStyle}
                  </span>
                </div>
              )}
              {project.weeklyHours && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">주당:</span>
                  <span className="text-sm font-medium text-foreground">
                    {project.weeklyHours}h
                  </span>
                </div>
              )}
            </div>

            {/* lookingFor 태그 */}
            {project.lookingFor && project.lookingFor.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">찾는 사람</h3>
                <div className="flex flex-wrap gap-2">
                  {project.lookingFor.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 이미지 */}
            <div className="prose dark:prose-invert max-w-none">
              {project.images && project.images.length > 0 && project.images[0] !== '🚀' ? (
                <ProjectImageSlider images={project.images} title={project.title} />
              ) : null}

              {/* 부가 설명 */}
              {project.description && (
                <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground mt-6">
                  {project.description}
                </p>
              )}
            </div>

            {/* 프로젝트 리더 상세 프로필 */}
            {project.ownerId && (
              <div className="mt-12 border-t border-border pt-8">
                <DetailProfileCard
                  title="👑 프로젝트 리더"
                  user={
                    typeof project.ownerId === 'object'
                      ? project.ownerId
                      : { _id: '', nName: '알 수 없음' }
                  }
                  onClick={() => {
                    if (typeof project.ownerId === 'object') {
                      router.push(`/profile/${project.ownerId._id}`);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-lg p-6 border border-border">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-foreground">프로젝트 요약</h3>
                <button
                  onClick={handleLike}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <svg
                    className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                    fill={isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">모집 현황</p>
                  <ul className="space-y-1 mt-1">
                    {/* TODO(Phase 3): 새 팀원 모집 UI로 교체 */}
                    <li className="text-foreground">
                      팀원 {project.members?.filter((m) => m.status === 'active').length ?? 0} /{' '}
                      {project.maxMembers ?? 4}명
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">상태</p>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${project.status === 'recruiting' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-muted text-muted-foreground'}`}
                  >
                    {statusLabel || project.status}
                  </span>
                </div>
                {project.domains && project.domains.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">도메인</p>
                    <div className="flex flex-wrap gap-2">
                      {project.domains.map((d) => (
                        <span
                          key={d}
                          className="px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm rounded-full"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {project.techStacks && project.techStacks.length > 0 && (
                  <details className="group">
                    <summary className="text-sm font-semibold text-muted-foreground cursor-pointer list-none flex items-center gap-1">
                      기술 스택 ({project.techStacks.length})
                      <svg
                        className="w-3 h-3 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.techStacks.map((stack) => (
                        <span
                          key={stack}
                          className="px-3 py-1 bg-card border border-border text-foreground text-sm rounded-full"
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  </details>
                )}
              </div>
              {/* 지원 버튼 — 6가지 상태 분기 */}
              <div className="mt-8 space-y-2">
                {applyState === 'owner' ? null : applyState === 'closed' ? (
                  <button
                    disabled
                    className="w-full font-bold py-3 rounded-lg bg-muted cursor-not-allowed text-muted-foreground"
                  >
                    모집 마감
                  </button>
                ) : applyState === 'none' ? (
                  <button
                    onClick={handleOpenApplyModal}
                    className="w-full font-bold py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    프로젝트 지원하기
                  </button>
                ) : applyState === 'pending' ? (
                  <button
                    onClick={handleWithdraw}
                    className="w-full font-bold py-3 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors"
                  >
                    지원 완료 · 취소
                  </button>
                ) : applyState === 'accepted' ? (
                  <div className="space-y-2">
                    <div className="w-full font-bold py-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 text-center">
                      팀원
                    </div>
                    <button
                      onClick={handleLeaveProject}
                      className="w-full text-sm py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      프로젝트 탈퇴
                    </button>
                  </div>
                ) : applyState === 'rejected' ? (
                  <button
                    disabled
                    className="w-full font-bold py-3 rounded-lg bg-muted cursor-not-allowed text-muted-foreground"
                  >
                    지원 마감
                  </button>
                ) : null}

                {/* 1:1 문의하기 — 본인 프로젝트가 아닌 경우만 표시 */}
                {!isOwner && (
                  <button
                    onClick={handleInquiry}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    작성자에게 1:1 문의
                  </button>
                )}
              </div>

              {/* 팀원 리뷰 섹션 — 완료 프로젝트의 멤버/작성자에게만 표시 */}
              {project.status === 'completed' &&
                (isMember || isOwner) &&
                (() => {
                  const reviewable = getReviewableUsers();
                  if (reviewable.length === 0) return null;
                  return (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3">팀원 리뷰 작성</h4>
                      <div className="space-y-2">
                        {reviewable.map((u) => (
                          <div key={u._id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {u.avatarUrl ? (
                                <Image
                                  src={u.avatarUrl}
                                  alt={u.nName}
                                  width={28}
                                  height={28}
                                  className="w-7 h-7 rounded-full object-cover shrink-0"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary">
                                    {u.nName.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-foreground truncate">{u.nName}</span>
                            </div>
                            {reviewedIds.has(u._id) ? (
                              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                작성 완료
                              </span>
                            ) : (
                              <button
                                onClick={() => setReviewTarget(u)}
                                className="shrink-0 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              >
                                리뷰 쓰기
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              {/* 광고 배너 — 프로젝트 요약 카드 하단 (sticky 내부) */}
              <div className="mt-4 pt-4 border-t border-border">
                <AdBanner
                  unitId={process.env.NEXT_PUBLIC_ADFIT_PROJECT_DETAIL}
                  size="rectangle"
                  className="py-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 리뷰 작성 모달 */}
      {reviewTarget && project && (
        <ReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          projectId={project._id?.toString() ?? ''}
          reviewee={reviewTarget}
          onSuccess={() => {
            setReviewedIds((prev) => new Set(Array.from(prev).concat(reviewTarget._id)));
            setReviewTarget(null);
          }}
        />
      )}

      {isApplyModalOpen && project && (
        <ApplyModal
          project={{
            _id: project._id.toString(),
            pid: typeof pid === 'string' ? Number(pid) : pid,
            title: project.title,
            problemStatement: project.problemStatement,
            weeklyHours: project.weeklyHours,
            lookingFor: project.lookingFor,
          }}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setIsApplyModalOpen(false);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
}
