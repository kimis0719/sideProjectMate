'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import ImageEditModal from '@/components/profile/modals/ImageEditModal';
import { useModal } from '@/hooks/useModal';
import Skeleton from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';

interface MyApplication {
  _id: string;
  projectId: {
    title: string;
    pid: number;
  };
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface MyProject {
  pid: number;
  title: string;
  status: string;
  currentStage?: string;
  images?: string[];
}

type FilterTab = 'all' | 'my_projects' | 'pending' | 'accepted' | 'rejected';

const TAB_LABELS: Record<FilterTab, string> = {
  all: '전체',
  my_projects: '내 프로젝트',
  pending: '대기중',
  accepted: '수락됨',
  rejected: '거절됨',
};

const PROJECT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  recruiting: { label: '모집중', className: 'bg-primary-container/10 text-primary-container' },
  in_progress: { label: '진행중', className: 'bg-emerald-100 text-emerald-800' },
  completed: { label: '완료', className: 'bg-surface-container-high text-on-surface-variant' },
  paused: { label: '일시중지', className: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant' },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: {
    label: '대기중',
    className: 'bg-emerald-100 text-emerald-800',
  },
  accepted: {
    label: '수락됨',
    className: 'bg-primary-container/10 text-primary-container',
  },
  rejected: {
    label: '거절됨',
    className: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant',
  },
};

export default function MyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { alert, confirm } = useModal();

  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [myProjects, setMyProjects] = useState<MyProject[]>([]);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isAppsLoading, setIsAppsLoading] = useState(true);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const fetchMyApplications = useCallback(async () => {
    setIsAppsLoading(true);
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.success) {
        setMyApplications(data.data);
      }
    } catch (error) {
      console.error('지원 내역을 불러오는 중 오류 발생', error);
    } finally {
      setIsAppsLoading(false);
    }
  }, []);

  const fetchMyProjects = useCallback(async () => {
    setIsProjectsLoading(true);
    try {
      const userId = session?.user?._id;
      if (!userId) return;
      const response = await fetch(`/api/projects?authorId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setMyProjects(
          data.data.projects.map((p: MyProject) => ({
            pid: p.pid,
            title: p.title,
            status: p.status,
            currentStage: p.currentStage,
            images: p.images,
          }))
        );
      }
    } catch (error) {
      console.error('내 프로젝트를 불러오는 중 오류 발생', error);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [session?.user?._id]);

  const fetchUserProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const res = await fetch('/api/users/me');
      const data = await res.json();
      if (data.success) {
        setUserData(data.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      fetchMyApplications();
      fetchMyProjects();
      fetchUserProfile();
    }
  }, [status, router, fetchMyApplications, fetchMyProjects, fetchUserProfile]);

  const handleSaveAvatar = async (url: string) => {
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    });
    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUserData((prev: any) => ({ ...prev, avatarUrl: url }));
    } else {
      await alert('에러', '이미지 변경 실패');
    }
  };

  const handleCancelApplication = async (appId: string) => {
    const ok = await confirm('지원 취소', '정말 지원을 취소하시겠습니까?', {
      isDestructive: true,
      closeOnBackdropClick: false,
    });
    if (ok === true) {
      try {
        const response = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          await alert('취소 완료', '지원서가 삭제되었습니다.');
          fetchMyApplications();
        } else {
          throw new Error(data.message);
        }
      } catch (err: unknown) {
        await alert('에러', err instanceof Error ? err.message : '알 수 없는 오류');
      }
    }
  };

  // 로딩 중 상태(세션 체크)
  if (status === 'loading') {
    return (
      <div className="pt-32 pb-24 px-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4">
            <Skeleton.Profile />
          </div>
          <div className="lg:col-span-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton.ListItem key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // 탭 필터링
  const filteredApps =
    activeTab === 'all' || activeTab === 'my_projects'
      ? myApplications
      : myApplications.filter((app) => app.status === activeTab);

  // 탭별 카운트
  const tabCounts: Record<FilterTab, number> = {
    all: myApplications.length + myProjects.length,
    my_projects: myProjects.length,
    pending: myApplications.filter((a) => a.status === 'pending').length,
    accepted: myApplications.filter((a) => a.status === 'accepted').length,
    rejected: myApplications.filter((a) => a.status === 'rejected').length,
  };

  // 아바타 이니셜
  const initials = userData?.nName?.charAt(0) || '?';

  return (
    <main className="pt-32 pb-24 px-4 sm:px-8 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ── 좌측: 프로필 요약 카드 */}
        <section className="lg:col-span-4 space-y-6">
          {isProfileLoading ? (
            <Skeleton.Profile />
          ) : userData ? (
            <>
              <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center text-center shadow-[0_20px_40px_rgba(26,28,28,0.04)]">
                {/* 아바타 */}
                <div className="relative mb-6">
                  {userData.avatarUrl ? (
                    <Image
                      src={userData.avatarUrl}
                      alt={userData.nName}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full border-4 border-surface-container-low object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-4 border-surface-container-low bg-surface-container-high flex items-center justify-center text-2xl font-bold text-on-surface-variant">
                      {initials}
                    </div>
                  )}
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-primary-container rounded-full border-2 border-surface-container-lowest flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <span
                      className="material-symbols-outlined text-[14px] text-white"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bolt
                    </span>
                  </button>
                </div>

                {/* 이름 + 포지션 */}
                <h2 className="text-2xl font-bold text-on-surface font-headline mb-1">
                  {userData.nName}
                </h2>
                <p className="text-on-surface-variant font-medium mb-6">
                  {userData.position || '포지션 미설정'}
                  {userData.career ? ` · ${userData.career}` : ''}
                </p>

                {/* 기술 태그 */}
                {userData.techTags && userData.techTags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {userData.techTags.slice(0, 5).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-surface-container-low text-on-surface-variant text-[11px] font-bold uppercase tracking-wider rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 프로필 수정 버튼 */}
                <Link
                  href="/profile"
                  className="w-full py-4 bg-primary-container text-white rounded-lg font-semibold hover:translate-x-1 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  프로필 수정하기
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </Link>
              </div>

              {/* 프로젝트 바로가기 */}
              <div className="bg-surface-container-low p-6 rounded-xl">
                <h3 className="text-sm font-bold text-on-surface mb-4 font-headline uppercase tracking-widest">
                  나의 프로젝트 바로가기
                </h3>
                <Link
                  href="/projects/mine"
                  className="text-primary font-semibold text-sm flex items-center gap-2 hover:underline"
                >
                  내 프로젝트 보기
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </>
          ) : null}
        </section>

        {/* ── 우측: 지원 현황 */}
        <section className="lg:col-span-8 space-y-8">
          <header>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-headline mb-8">
              프로젝트 현황
            </h1>

            {/* 필터 칩 */}
            <div className="flex flex-wrap gap-3 mb-10">
              {(Object.keys(TAB_LABELS) as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {TAB_LABELS[tab]} {tabCounts[tab]}
                </button>
              ))}
            </div>
          </header>

          {/* 콘텐츠 */}
          {/* ── 내 프로젝트 카드 (all 또는 my_projects 탭) */}
          {(activeTab === 'all' || activeTab === 'my_projects') &&
            (isProjectsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton.ListItem key={`proj-skel-${i}`} />
                ))}
              </div>
            ) : myProjects.length > 0 ? (
              <div className="space-y-4">
                {activeTab === 'all' && (
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    내 프로젝트
                  </h3>
                )}
                {myProjects.map((project) => {
                  const badge = PROJECT_STATUS_BADGE[project.status] || {
                    label: project.status,
                    className: 'bg-surface-container-high text-on-surface-variant',
                  };
                  return (
                    <div
                      key={project.pid}
                      className="bg-surface-container-lowest p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-6 group hover:shadow-[0_20px_40px_rgba(26,28,28,0.04)] transition-all"
                    >
                      <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center">
                        {project.images &&
                        project.images.length > 0 &&
                        project.images[0] !== '🚀' ? (
                          <Image
                            src={project.images[0]}
                            alt={project.title}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-3xl font-bold text-on-surface-variant/30">
                            {project.title.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/projects/${project.pid}`}
                            className="text-lg font-bold font-headline text-on-surface hover:text-primary transition-colors"
                          >
                            {project.title}
                          </Link>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        {project.currentStage && (
                          <p className="text-sm text-on-surface-variant">
                            단계: {project.currentStage}
                          </p>
                        )}
                      </div>
                      <div className="flex md:flex-col items-center gap-3 w-full md:w-auto">
                        <Link
                          href={`/dashboard/${project.pid}`}
                          className="flex-grow md:w-32 py-2 px-4 bg-primary-container text-white rounded-lg text-sm font-medium text-center hover:bg-primary-container/90 transition-all"
                        >
                          대시보드
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : activeTab === 'my_projects' ? (
              <EmptyState
                icon="folder"
                title="아직 만든 프로젝트가 없습니다"
                description="새로운 사이드 프로젝트를 시작해보세요!"
                action={{ label: '프로젝트 만들기', href: '/projects/new' }}
              />
            ) : null)}

          {/* ── 지원 현황 카드 (all 또는 대기중/수락됨/거절됨 탭) */}
          {activeTab !== 'my_projects' &&
            (isAppsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton.ListItem key={`app-skel-${i}`} />
                ))}
              </div>
            ) : filteredApps.length > 0 ? (
              <div className="space-y-4">
                {activeTab === 'all' && (
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    지원 현황
                  </h3>
                )}
                {filteredApps.map((app) => {
                  const badge = STATUS_BADGE[app.status];
                  return (
                    <div
                      key={app._id}
                      className="bg-surface-container-lowest p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-6 group hover:shadow-[0_20px_40px_rgba(26,28,28,0.04)] transition-all"
                    >
                      <div className="w-24 h-24 flex-shrink-0 bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center">
                        <span className="text-3xl font-bold text-on-surface-variant/30">
                          {app.projectId?.title?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-grow space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          {app.projectId ? (
                            <Link
                              href={`/projects/${app.projectId.pid}`}
                              className="text-lg font-bold font-headline text-on-surface hover:text-primary transition-colors"
                            >
                              {app.projectId.title}
                            </Link>
                          ) : (
                            <span className="text-lg font-bold font-headline text-on-surface-variant">
                              삭제된 프로젝트
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant">지원 역할: {app.role}</p>
                      </div>
                      <div className="flex md:flex-col items-center gap-3 w-full md:w-auto">
                        {app.status === 'pending' ? (
                          <button
                            onClick={() => handleCancelApplication(app._id)}
                            className="flex-grow md:w-32 py-2 px-4 border border-error/20 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-all"
                          >
                            지원 취소
                          </button>
                        ) : app.status === 'accepted' ? (
                          <span className="flex-grow md:w-32 py-2 px-4 bg-surface-container-low text-on-surface-variant rounded-lg text-sm font-medium text-center">
                            참여중
                          </span>
                        ) : (
                          <span className="flex-grow md:w-32 py-2 px-4 bg-surface-container-low text-on-surface-variant/40 rounded-lg text-sm font-medium text-center cursor-not-allowed">
                            결과 확인
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="inbox"
                title={
                  activeTab === 'all'
                    ? '아직 지원한 프로젝트가 없습니다'
                    : `${TAB_LABELS[activeTab]} 상태의 지원이 없습니다`
                }
                description={
                  activeTab === 'all' ? '마음에 드는 프로젝트를 찾아 지원해보세요!' : undefined
                }
                action={
                  activeTab === 'all' ? { label: '프로젝트 탐색', href: '/projects' } : undefined
                }
              />
            ))}

          {/* all 탭에서 프로젝트도 지원도 없는 경우 */}
          {activeTab === 'all' &&
            !isAppsLoading &&
            !isProjectsLoading &&
            myApplications.length === 0 &&
            myProjects.length === 0 && (
              <EmptyState
                icon="inbox"
                title="아직 프로젝트 활동이 없습니다"
                description="프로젝트를 만들거나 마음에 드는 프로젝트에 지원해보세요!"
                action={{ label: '프로젝트 탐색', href: '/projects' }}
              />
            )}
        </section>
      </div>

      <ImageEditModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={handleSaveAvatar}
        currentUrl={userData?.avatarUrl}
      />
    </main>
  );
}
