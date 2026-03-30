'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useModal } from '@/hooks/useModal';
import AdminUserDetailModal from '@/components/admin/AdminUserDetailModal';

interface TagDetail {
  _id: string;
  name: string;
  logoUrl?: string;
  category?: string;
}

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
  likes: string[];
  images: string[];
  members: { role: string; current: number; max: number }[];
  tags: TagDetail[];
  author: { _id: string; nName: string; authorEmail: string; avatarUrl?: string } | null;
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
    color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  },
  in_progress: {
    label: '진행중',
    color: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
  },
  completed: { label: '완료', color: 'bg-muted text-muted-foreground' },
  paused: { label: '일시정지', color: 'bg-gray-100 dark:bg-gray-800 text-gray-500' },
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
        color: 'bg-muted text-muted-foreground',
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
            <h2 className="text-base font-semibold text-foreground">프로젝트 상세 정보</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-5">
            {loading && (
              <div className="flex justify-center items-center py-12 text-muted-foreground text-sm">
                불러오는 중...
              </div>
            )}

            {!loading && !project && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                프로젝트를 찾을 수 없습니다.
              </div>
            )}

            {!loading && project && (
              <div className="space-y-5">
                {/* 제목 & 배지 */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      PID: {project.pid}
                    </span>
                    {statusInfo && (
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    )}
                    {project.delYn && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                        비활성화
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground leading-snug">
                    {project.title}
                  </h3>
                </div>

                {/* 기본 정보 */}
                <div className="border border-border rounded-lg divide-y divide-border">
                  <InfoRow label="카테고리" value={project.category} />
                  {project.deadline && (
                    <InfoRow
                      label="마감일"
                      value={new Date(project.deadline).toLocaleDateString('ko-KR')}
                    />
                  )}
                  <InfoRow label="조회수" value={String(project.views)} />
                  <InfoRow label="좋아요" value={String(project.likes?.length ?? 0)} />
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
                  <p className="text-xs text-muted-foreground mb-2">작성자</p>
                  {project.author ? (
                    <div className="flex items-center gap-3">
                      {project.author.avatarUrl ? (
                        <Image
                          src={project.author.avatarUrl}
                          alt={project.author.nName}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground border border-border">
                          {project.author.nName?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {project.author.nName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project.author.authorEmail}
                        </p>
                      </div>
                      <button
                        onClick={() => setAuthorModalId(project.author!._id)}
                        className="ml-auto text-xs px-2 py-1 rounded bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
                      >
                        사용자 정보 보기
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">알 수 없음</span>
                  )}
                </div>

                {/* 팀 구성 */}
                {project.members && project.members.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">팀 구성</p>
                    <div className="flex flex-wrap gap-2">
                      {project.members.map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-muted/40 rounded-lg px-3 py-1.5 text-sm"
                        >
                          <span className="text-foreground font-medium">{m.role}</span>
                          <span className="text-muted-foreground text-xs">
                            {m.current}/{m.max}명
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 기술 스택 */}
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">기술 스택</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag._id}
                          className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 프로젝트 설명 미리보기 */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">프로젝트 설명</p>
                  <div className="text-sm text-foreground bg-muted/30 rounded-lg p-3 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
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
            <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-muted/20 gap-2 flex-wrap">
              <div className="flex gap-2">
                <button
                  onClick={handleToggleDeactivate}
                  disabled={saving}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    project.delYn
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50'
                      : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50'
                  }`}
                >
                  {project.delYn ? '재활성화' : '비활성화'}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-sm px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50"
                >
                  영구 삭제
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <a
                  href={`/projects/${project.pid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  프로젝트 보기 ↗
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/70 transition-colors"
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
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
