'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useModal } from '@/hooks/useModal';
import AdminUserDetailModal from '@/components/admin/AdminUserDetailModal';

interface ProjectDetail {
  _id: string;
  pid: number;
  title: string;
  category: string;
  status: string;
  delYn: boolean;
  content: string;
  overview?: string;
  deadline?: string;
  views: number;
  likeCount: number;
  images: string[];
  members: { userId: string; role: string; status: string; joinedAt: string }[];
  techStacks: string[];
  ownerId: { _id: string; nName: string; authorEmail: string; avatarUrl?: string } | null;
  currentStage?: string;
  executionStyle?: string;
  domains?: string[];
  lookingFor?: string[];
  weeklyHours?: number;
  maxMembers?: number;
  links?: { github?: string; figma?: string; deploy?: string; notion?: string };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  pid: number;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: (pid: number) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  recruiting: {
    label: '모집중',
    color: 'text-primary bg-primary/5',
  },
  in_progress: {
    label: '진행중',
    color: 'text-amber-600 bg-amber-50',
  },
  completed: { label: '완료', color: 'text-on-surface-variant bg-surface-container-high' },
  paused: { label: '일시정지', color: 'text-on-surface-variant bg-surface-container-high' },
};

export default function AdminProjectDetailModal({ pid, onClose, onUpdated, onDeleted }: Props) {
  const { confirm, alert } = useModal();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorModalId, setAuthorModalId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/projects/${pid}`, { signal: controller.signal });
        const json = await res.json();
        if (!cancelled && json.success) setProject(json.data);
      } catch {
        // AbortError는 cleanup 시 정상 발생 — 무시
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProject();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pid]);

  const handleToggleDeactivate = async () => {
    if (!project) return;
    const action = project.delYn ? '재활성화' : '비활성화';
    const ok = await confirm(
      `프로젝트 ${action}`,
      `"${project.title}" 프로젝트를 ${action}하시겠습니까?${
        !project.delYn ? '\n비활성화된 프로젝트는 공개 목록에서 숨겨집니다.' : ''
      }`,
      { confirmText: action, isDestructive: !project.delYn }
    );
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${pid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delYn: !project.delYn }),
      });
      const json = await res.json();
      if (json.success) {
        setProject((prev) => (prev ? { ...prev, delYn: json.data.delYn } : prev));
        onUpdated();
      } else {
        await alert('오류', json.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    const ok = await confirm(
      '프로젝트 삭제',
      `"${project.title}" 프로젝트를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      { confirmText: '삭제', isDestructive: true }
    );
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/projects/${pid}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        onDeleted(pid);
        onClose();
      } else {
        await alert('오류', json.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const statusInfo = project
    ? (STATUS_MAP[project.status] ?? {
        label: project.status,
        color: 'text-on-surface-variant bg-surface-container-high',
      })
    : null;

  return (
    <>
      {/* 작성자 사용자 모달 — stacking context 탈출을 위해 document.body에 portal */}
      {authorModalId &&
        createPortal(
          <AdminUserDetailModal
            userId={authorModalId}
            onClose={() => setAuthorModalId(null)}
            onUpdated={onUpdated}
          />,
          document.body
        )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-[16px] p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-surface-container-lowest rounded-lg shadow-modal w-full max-w-xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 sticky top-0 bg-surface-container-lowest z-10">
            <h2 className="font-body text-body-md font-semibold text-on-surface">
              프로젝트 상세 정보
            </h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-5">
            {loading && (
              <div className="flex justify-center items-center py-12 text-on-surface-variant font-body text-body-md">
                불러오는 중...
              </div>
            )}

            {!loading && !project && (
              <div className="text-center py-12 text-on-surface-variant font-body text-body-md">
                프로젝트를 찾을 수 없습니다.
              </div>
            )}

            {!loading && project && (
              <div className="space-y-5">
                {/* 제목 & 배지 */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-body text-label-md font-mono text-on-surface-variant">
                      PID: {project.pid}
                    </span>
                    {statusInfo && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    )}
                    {project.delYn && (
                      <span className="inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium bg-error-container text-on-error-container">
                        비활성화
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface leading-snug">
                    {project.title}
                  </h3>
                </div>

                {/* 기본 정보 */}
                <div className="rounded-lg divide-y divide-outline-variant/15">
                  <InfoRow label="카테고리" value={project.category} />
                  {project.deadline && (
                    <InfoRow
                      label="마감일"
                      value={new Date(project.deadline).toLocaleDateString('ko-KR')}
                    />
                  )}
                  <InfoRow label="조회수" value={String(project.views)} />
                  <InfoRow label="좋아요" value={String(project.likeCount ?? 0)} />
                  {project.currentStage && (
                    <InfoRow label="프로젝트 단계" value={project.currentStage} />
                  )}
                  {project.executionStyle && (
                    <InfoRow label="실행 스타일" value={project.executionStyle} />
                  )}
                  {project.weeklyHours != null && project.weeklyHours > 0 && (
                    <InfoRow label="주당 시간" value={`${project.weeklyHours}시간`} />
                  )}
                  {project.maxMembers != null && (
                    <InfoRow label="최대 인원" value={`${project.maxMembers}명`} />
                  )}
                  <InfoRow
                    label="생성일"
                    value={new Date(project.createdAt).toLocaleDateString('ko-KR')}
                  />
                  <InfoRow
                    label="최종 수정"
                    value={new Date(project.updatedAt).toLocaleDateString('ko-KR')}
                  />
                </div>

                {/* 작성자 */}
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">작성자</p>
                  {project.ownerId ? (
                    <div className="flex items-center gap-3">
                      {project.ownerId.avatarUrl ? (
                        <Image
                          src={project.ownerId.avatarUrl}
                          alt={project.ownerId.nName}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center font-body text-body-md text-on-surface-variant">
                          {project.ownerId.nName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="font-body text-body-md font-medium text-on-surface">
                          {project.ownerId.nName}
                        </p>
                        <p className="font-body text-label-md text-on-surface-variant">
                          {project.ownerId.authorEmail}
                        </p>
                      </div>
                      <button
                        onClick={() => setAuthorModalId(project.ownerId!._id)}
                        className="ml-auto font-body text-label-md px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-high/70 text-on-surface-variant transition-colors"
                      >
                        사용자 정보 보기
                      </button>
                    </div>
                  ) : (
                    <span className="font-body text-body-md text-on-surface-variant">
                      알 수 없음
                    </span>
                  )}
                </div>

                {/* 팀 구성 */}
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">팀 구성</p>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const active =
                        project.members?.filter((m) => m.status === 'active').length ?? 0;
                      const inactive =
                        project.members?.filter((m) => m.status === 'inactive').length ?? 0;
                      const removed =
                        project.members?.filter((m) => m.status === 'removed').length ?? 0;
                      return (
                        <>
                          <div className="flex items-center gap-1.5 bg-surface-container-low rounded-lg px-3 py-1.5 font-body text-body-md">
                            <span className="text-emerald-600 font-medium">활동중</span>
                            <span className="text-on-surface-variant font-body text-label-md">
                              {active}
                              {project.maxMembers ? `/${project.maxMembers}` : ''}명
                            </span>
                          </div>
                          {inactive > 0 && (
                            <div className="flex items-center gap-1.5 bg-surface-container-low rounded-lg px-3 py-1.5 font-body text-body-md">
                              <span className="text-on-surface-variant font-medium">비활성</span>
                              <span className="text-on-surface-variant font-body text-label-md">
                                {inactive}명
                              </span>
                            </div>
                          )}
                          {removed > 0 && (
                            <div className="flex items-center gap-1.5 bg-surface-container-low rounded-lg px-3 py-1.5 font-body text-body-md">
                              <span className="text-error font-medium">제외</span>
                              <span className="text-on-surface-variant font-body text-label-md">
                                {removed}명
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 관련 도메인 */}
                {project.domains && project.domains.length > 0 && (
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant mb-2">
                      관련 도메인
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.domains.map((domain) => (
                        <span
                          key={domain}
                          className="bg-surface-container-low text-on-surface rounded-full px-3 py-1 font-body text-label-md"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 찾는 역할 */}
                {project.lookingFor && project.lookingFor.length > 0 && (
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant mb-2">
                      찾는 역할
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.lookingFor.map((role) => (
                        <span
                          key={role}
                          className="bg-secondary-container/30 text-on-secondary-container rounded-full px-3 py-1 font-body text-label-md"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 기술 스택 */}
                {project.techStacks && project.techStacks.length > 0 && (
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant mb-2">
                      기술 스택
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.techStacks.map((stack) => (
                        <span
                          key={stack}
                          className="bg-primary/5 text-primary rounded-full px-3 py-1 font-body text-label-md font-semibold"
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 외부 링크 */}
                {project.links && Object.values(project.links).some(Boolean) && (
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant mb-2">
                      외부 링크
                    </p>
                    <div className="flex flex-col gap-1">
                      {project.links.github && (
                        <ProjectLink label="GitHub" url={project.links.github} />
                      )}
                      {project.links.figma && (
                        <ProjectLink label="Figma" url={project.links.figma} />
                      )}
                      {project.links.deploy && (
                        <ProjectLink label="배포" url={project.links.deploy} />
                      )}
                      {project.links.notion && (
                        <ProjectLink label="Notion" url={project.links.notion} />
                      )}
                    </div>
                  </div>
                )}

                {/* 프로젝트 개요 */}
                {project.overview && (
                  <div>
                    <p className="font-body text-label-md text-on-surface-variant mb-1.5">
                      프로젝트 개요
                    </p>
                    <p className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                      {project.overview}
                    </p>
                  </div>
                )}

                {/* 프로젝트 설명 미리보기 */}
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-1.5">
                    프로젝트 설명
                  </p>
                  <div className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {project.content
                      ? project.content.replace(/<[^>]+>/g, '').slice(0, 500) +
                        (project.content.length > 500 ? '...' : '')
                      : '(내용 없음)'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 푸터 */}
          {!loading && project && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-outline-variant/15 bg-surface-container-low gap-2 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={handleToggleDeactivate}
                  disabled={saving}
                  className={`font-body text-body-md px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    project.delYn
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {project.delYn ? '재활성화' : '비활성화'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="font-body text-body-md px-3 py-2 rounded-lg bg-error text-on-error hover:bg-error/90 transition-colors disabled:opacity-50"
                >
                  영구 삭제
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <a
                  href={`/projects/${project.pid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-body-md text-primary hover:underline"
                >
                  프로젝트 보기 ↗
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 font-body text-body-md bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-high/70 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center px-3 py-2">
      <span className="font-body text-label-md text-on-surface-variant w-24 shrink-0">{label}</span>
      <span className="font-body text-body-md text-on-surface">{value}</span>
    </div>
  );
}

function ProjectLink({ label, url }: { label: string; url: string }) {
  const href = url.startsWith('http') ? url : `https://${url}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 font-body text-body-md text-primary hover:underline"
    >
      <span className="font-body text-label-md text-on-surface-variant w-16 shrink-0">{label}</span>
      <span className="truncate">{url}</span>
    </a>
  );
}
