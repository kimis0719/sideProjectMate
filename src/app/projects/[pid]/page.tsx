'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { IProject } from '@/lib/models/Project';
import { useNotificationStore } from '@/lib/store/notificationStore';
import DetailProfileCard from '@/components/profile/DetailProfileCard';
import ProjectThumbnail from '@/components/projects/ProjectThumbnail';
import { useModal } from '@/hooks/useModal';
import ReviewModal from '@/components/projects/ReviewModal';
import AdBanner from '@/components/common/AdBanner';

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
interface PopulatedProject extends Omit<IProject, 'ownerId'> {
  ownerId: PopulatedOwner | string;
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
  const [selectedRole, setSelectedRole] = useState('');
  const [applyMessage, setApplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 카테고리 라벨 표시를 위한 상태
  const [categoryLabel, setCategoryLabel] = useState('');
  // 상태 라벨 표시를 위한 상태
  const [statusLabel, setStatusLabel] = useState('');
  // 사용자의 지원 여부 상태
  const [hasApplied, setHasApplied] = useState(false);

  // 리뷰 관련 상태
  const [reviewTarget, setReviewTarget] = useState<{
    _id: string;
    nName: string;
    avatarUrl?: string;
    position?: string;
  } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  const { fetchNotifications } = useNotificationStore();
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

        // 2. 카테고리 라벨 조회 (공통 코드 API 호출)
        try {
          const categoryRes = await fetch('/api/common-codes?group=CATEGORY');
          const categoryData = await categoryRes.json();
          if (categoryData.success) {
            const matchedCategory = categoryData.data.find(
              (c: CommonCodeItem) => c.code === project.category
            );
            setCategoryLabel(matchedCategory ? matchedCategory.label : project.category);
          }
        } catch (e) {
          console.error('카테고리 정보 로딩 실패', e);
          setCategoryLabel(project.category);
        }

        // 3. 상태 라벨 조회 (공통 코드 API 호출)
        try {
          const statusRes = await fetch('/api/common-codes?group=STATUS');
          const statusData = await statusRes.json();
          if (statusData.success) {
            const matchedStatus = statusData.data.find(
              (c: CommonCodeItem) => c.code === project.status
            );
            setStatusLabel(matchedStatus ? matchedStatus.label : project.status);
          }
        } catch (e) {
          console.error('상태 정보 로딩 실패', e);
          setStatusLabel(project.status);
        }

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    // ... (previous code)
    fetchData();
  }, [pid, session]);

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

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      await alert('알림', '지원할 역할을 선택해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${pid}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, message: applyMessage }),
      });
      const data = await response.json();
      if (data.success) {
        await alert('지원 완료', '성공적으로 지원했습니다.');
        setIsApplyModalOpen(false);
        setApplyMessage('');
        setHasApplied(true); // 지원 상태 업데이트
        fetchNotifications();
      } else {
        throw new Error(data.message || '지원에 실패했습니다.');
      }
    } catch (err: unknown) {
      await alert('에러', err instanceof Error ? err.message : '지원 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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

  // 버튼 텍스트 및 상태 결정
  let buttonText = '프로젝트 참여하기';
  let isButtonDisabled = false;

  if (isOwner) {
    buttonText = '내 프로젝트';
    isButtonDisabled = true;
  } else if (isMember) {
    buttonText = '참여중';
    isButtonDisabled = true;
  } else if (hasApplied) {
    buttonText = '지원완료';
    isButtonDisabled = true;
  } else if (project.status !== 'recruiting') {
    // 모집중이 아닌 경우 (진행중, 완료 등)
    buttonText = '모집 마감';
    isButtonDisabled = true;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {isOwner && (
          <div className="flex justify-end gap-2 mb-4">
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
        <div className="mb-8 md:mb-12">
          {/* 카테고리 라벨 표시 (예: 개발) */}
          <p className="text-sm text-muted-foreground mb-2">{categoryLabel}</p>
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
            <div className="prose dark:prose-invert max-w-none">
              {project.images && project.images.length > 0 ? (
                <ProjectImageSlider images={project.images} title={project.title} />
              ) : (
                <div className="relative aspect-video bg-muted rounded-lg mb-8 overflow-hidden">
                  <ProjectThumbnail
                    src={null}
                    alt={project.title}
                    fallbackText={project.title.charAt(0)}
                    className="text-8xl"
                  />
                </div>
              )}
              <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground">
                {project.description}
              </p>
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

                {/* ✨ 문의하기 버튼 추가 */}
                {!isOwner && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleInquiry}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg transition-colors shadow-sm"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      작성자에게 1:1 문의하기
                    </button>
                  </div>
                )}
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
                  {/* 동적으로 가져온 상태 라벨 표시 */}
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${project.status === 'recruiting' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-muted text-muted-foreground'}`}
                  >
                    {statusLabel || project.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">기술 스택</p>
                  <div className="flex flex-wrap gap-2">
                    {project.techStacks?.map((stack) => (
                      <span
                        key={stack}
                        className="px-3 py-1 bg-card border border-border text-foreground text-sm rounded-full"
                      >
                        {stack}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={handleOpenApplyModal}
                disabled={isButtonDisabled}
                className={`mt-8 w-full font-bold py-3 rounded-lg transition-colors ${
                  isButtonDisabled
                    ? 'bg-muted cursor-not-allowed text-muted-foreground'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {buttonText}
              </button>

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

      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-card rounded-lg p-8 w-full max-w-md border border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">프로젝트 지원하기</h2>
            <form onSubmit={handleApplySubmit}>
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                  지원 역할
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                >
                  <option value="" disabled>
                    역할을 선택하세요
                  </option>
                  {/* TODO(Phase 5): 지원 플로우 개편 후 역할 선택 제거 */}
                  <option value="member">팀원</option>
                </select>
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                  지원 메시지
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  placeholder="자신을 어필하는 간단한 메시지를 남겨주세요."
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? '제출 중...' : '지원서 제출'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
