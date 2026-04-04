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
  loading: () => <div className="aspect-video bg-surface-container-low rounded-xl animate-pulse" />,
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
        setLikeCount(project.likesCount || project.likeCount || 0);

        // 현재 사용자가 좋아요 했는지 확인
        if (session?.user?._id && project.likedBy) {
          setIsLiked(
            project.likedBy.some(
              (id: string) => id === session.user._id || id.toString() === session.user._id
            )
          );
        }

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

  /** 리뷰 가능한 팀원 목록 (자신 제외, 중복 제거) */
  const getReviewableUsers = () => {
    if (!project || !session?.user?._id) return [];
    const seen = new Set<string>();
    const users: { _id: string; nName: string; avatarUrl?: string; position?: string }[] = [];

    // 프로젝트 작성자
    if (typeof project.ownerId === 'object' && project.ownerId._id !== session.user._id) {
      const owner = project.ownerId as PopulatedOwner;
      seen.add(owner._id);
      users.push({
        _id: owner._id,
        nName: owner.nName || '작성자',
        avatarUrl: owner.avatarUrl,
        position: owner.position,
      });
    }

    // 활성 팀원 (소유자와 중복 방지)
    project.members?.forEach((m: PopulatedMember) => {
      const memberUser = typeof m.userId === 'object' ? m.userId : null;
      const userId = memberUser?._id || (typeof m.userId === 'string' ? m.userId : undefined);
      if (userId && userId !== session.user?._id && m.status === 'active' && !seen.has(userId)) {
        seen.add(userId);
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
    if (!session) {
      router.push('/login');
      return;
    }
    try {
      const response = await fetch(`/api/projects/${pid}/like`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setLikeCount(data.data.likeCount);
        setIsLiked(data.data.isLiked);
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
      <div className="flex justify-center items-center min-h-screen text-on-surface">
        로딩 중...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen text-error">오류: {error}</div>
    );
  if (!project)
    return (
      <div className="flex justify-center items-center min-h-screen text-on-surface">
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
    <div className="bg-surface min-h-screen">
      <div className="px-6 lg:px-8 py-8 md:py-12">
        {/* 목록으로 돌아가기 */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            목록으로
          </Link>
          {isOwner && (
            <div className="flex gap-2">
              <Link
                href={`/projects/${pid}/manage`}
                className="px-4 py-2 text-sm font-bold text-on-primary bg-primary-container rounded-lg hover:opacity-90 transition-all"
              >
                지원자 관리
              </Link>
              <Link
                href={`/projects/${pid}/edit`}
                className="px-4 py-2 text-sm font-bold text-on-surface-variant bg-surface-container-high rounded-lg hover:bg-surface-dim transition-colors"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-bold text-error bg-error-container/10 rounded-lg hover:bg-error-container/20 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>
        <div className="mb-8 md:mb-12 space-y-4">
          {/* 배지: currentStage + status */}
          <div className="flex items-center gap-2">
            {project.currentStage && (
              <span className="px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide bg-primary-container/15 text-primary-container">
                {STAGE_LABELS[project.currentStage as ProjectStage] || project.currentStage}
              </span>
            )}
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-widest ${
                project.status === 'recruiting'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {statusLabel || project.status}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline tracking-tight text-on-surface">
            {project.title}
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed break-all">
            {project.problemStatement?.slice(0, 120)}
            {project.problemStatement && project.problemStatement.length > 120 ? '...' : ''}
          </p>
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span>작성자: {getOwnerName(project.ownerId)}</span>
              <span className="text-outline-variant">|</span>
              <span>{new Date(project.createdAt).toLocaleString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>{project.views}</span>
              </div>
              <button
                onClick={handleLike}
                className="flex items-center gap-1 hover:text-error transition-colors"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${isLiked ? 'text-error' : ''}`}
                  style={isLiked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
                <span>{likeCount}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-8">
            {/* 이미지 */}
            {project.images && project.images.length > 0 && project.images[0] !== '🚀' && (
              <ProjectImageSlider images={project.images} title={project.title} />
            )}

            {/* 프로젝트 동기 (problemStatement) */}
            {project.problemStatement && (
              <div className="bg-surface-container-low p-8 rounded-xl">
                <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  프로젝트 동기
                </h2>
                <p className="text-lg leading-relaxed whitespace-pre-wrap break-all text-on-surface">
                  {project.problemStatement}
                </p>
              </div>
            )}

            {/* 실행 방식 + lookingFor */}
            <div className="flex flex-wrap gap-4">
              {project.executionStyle && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">실행 방식:</span>
                  <span className="px-2.5 py-1 text-sm font-medium rounded-full bg-emerald-100 text-emerald-800">
                    {STYLE_LABELS[project.executionStyle as ExecutionStyle] ||
                      project.executionStyle}
                  </span>
                </div>
              )}
              {project.weeklyHours && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">주당:</span>
                  <span className="text-sm font-bold text-on-surface">{project.weeklyHours}h</span>
                </div>
              )}
            </div>

            {/* lookingFor 태그 */}
            {project.lookingFor && project.lookingFor.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  찾는 사람
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.lookingFor.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-surface-container-lowest text-on-surface text-sm rounded-full font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 부가 설명 */}
            {project.description && (
              <p className="text-base leading-relaxed whitespace-pre-wrap break-all text-on-surface-variant">
                {project.description}
              </p>
            )}

            {/* 프로젝트 리더 상세 프로필 */}
            {project.ownerId && (
              <div className="pt-8">
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
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-surface-container-lowest p-8 rounded-xl shadow-[0_20px_40px_rgba(26,28,28,0.04)] border border-outline-variant/10 space-y-8">
              {/* 소유자 프로필 */}
              {typeof project.ownerId === 'object' && (
                <div className="flex items-center gap-4 pb-6 border-b border-outline-variant/10">
                  {project.ownerId.avatarUrl ? (
                    <Image
                      src={project.ownerId.avatarUrl}
                      alt={project.ownerId.nName}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary-container/15 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-container">
                        {project.ownerId.nName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-on-surface-variant font-label uppercase tracking-widest">
                      프로젝트 개설자
                    </div>
                    <div className="text-lg font-bold text-on-surface font-headline">
                      {project.ownerId.nName}
                    </div>
                  </div>
                </div>
              )}

              {/* 프로젝트 메트릭 */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary-container">group</span>
                    <span className="text-sm font-medium">모집 현황</span>
                  </div>
                  <div className="font-bold text-on-surface">
                    {project.members?.filter((m) => m.status === 'active').length ?? 0} /{' '}
                    {project.maxMembers ?? 4}명
                  </div>
                </div>
                {project.weeklyHours && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container">
                        schedule
                      </span>
                      <span className="text-sm font-medium">주간 참여 시간</span>
                    </div>
                    <div className="font-bold text-on-surface">주 {project.weeklyHours}시간</div>
                  </div>
                )}
                {project.currentStage && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-primary-container">
                        rocket_launch
                      </span>
                      <span className="text-sm font-medium">진행 단계</span>
                    </div>
                    <div className="font-bold text-primary-container uppercase text-xs tracking-widest font-label">
                      {STAGE_LABELS[project.currentStage as ProjectStage] || project.currentStage}
                    </div>
                  </div>
                )}
              </div>

              {/* 도메인 + 기술스택 */}
              {project.domains && project.domains.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    도메인
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.domains.map((d) => (
                      <span
                        key={d}
                        className="px-3 py-1 bg-surface-container-low text-on-surface text-sm rounded-full font-semibold"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.techStacks && project.techStacks.length > 0 && (
                <details className="group">
                  <summary className="text-sm font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer list-none flex items-center gap-1">
                    기술 스택 ({project.techStacks.length})
                    <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">
                      expand_more
                    </span>
                  </summary>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.techStacks.map((stack) => (
                      <span
                        key={stack}
                        className="px-3 py-1 bg-surface-container-lowest text-on-surface text-sm rounded-full"
                      >
                        {stack}
                      </span>
                    ))}
                  </div>
                </details>
              )}
              {/* 지원 버튼 — 6가지 상태 분기 */}
              <div className="space-y-3">
                {applyState === 'owner' ? null : applyState === 'closed' ? (
                  <button
                    disabled
                    className="w-full font-bold py-4 rounded-lg bg-surface-container-high cursor-not-allowed text-on-surface-variant"
                  >
                    모집 마감
                  </button>
                ) : applyState === 'none' ? (
                  <button
                    onClick={handleOpenApplyModal}
                    className="w-full font-bold py-4 rounded-lg bg-primary-container text-on-primary hover:opacity-90 transition-all shadow-lg shadow-primary-container/20"
                  >
                    프로젝트 지원하기
                  </button>
                ) : applyState === 'pending' ? (
                  <button
                    onClick={handleWithdraw}
                    className="w-full font-bold py-4 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                  >
                    지원 완료 · 취소
                  </button>
                ) : applyState === 'accepted' ? (
                  <div className="space-y-2">
                    <div className="w-full font-bold py-4 rounded-lg bg-emerald-100 text-emerald-800 text-center">
                      팀원
                    </div>
                    <button
                      onClick={handleLeaveProject}
                      className="w-full py-4 rounded-lg bg-surface-container-lowest text-error font-bold hover:bg-error-container hover:text-on-error-container transition-colors shadow-[0_2px_8px_rgba(26,28,28,0.06)]"
                    >
                      프로젝트 탈퇴
                    </button>
                  </div>
                ) : applyState === 'rejected' ? (
                  <button
                    disabled
                    className="w-full font-bold py-4 rounded-lg bg-surface-container-high cursor-not-allowed text-on-surface-variant"
                  >
                    지원 마감
                  </button>
                ) : null}

                {/* 칸반 보드 열기 — 팀원 및 오너에게만 표시 */}
                {(isMember || isOwner) && (
                  <Link
                    href={`/dashboard/${project.pid}/kanban`}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-surface-container-lowest text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors shadow-[0_2px_8px_rgba(26,28,28,0.06)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">view_kanban</span>
                    칸반 보드 열기
                  </Link>
                )}

                {/* 1:1 문의하기 — 본인 프로젝트가 아닌 경우만 표시 */}
                {!isOwner && (
                  <button
                    onClick={handleInquiry}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-surface-container-lowest text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors shadow-[0_2px_8px_rgba(26,28,28,0.06)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    개설자에게 문의하기
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
                    <div className="pt-6 border-t border-outline-variant/10">
                      <h4 className="text-sm font-bold text-on-surface mb-3">팀원 리뷰 작성</h4>
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
                                <div className="w-7 h-7 rounded-full bg-primary-container/15 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary-container">
                                    {u.nName.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-sm text-on-surface truncate">{u.nName}</span>
                            </div>
                            {reviewedIds.has(u._id) ? (
                              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                작성 완료
                              </span>
                            ) : (
                              <button
                                onClick={() => setReviewTarget(u)}
                                className="shrink-0 text-xs px-2 py-1 rounded-full bg-primary-container/10 text-primary-container hover:bg-primary-container/20 transition-colors"
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
              <div className="pt-6 border-t border-outline-variant/10">
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
