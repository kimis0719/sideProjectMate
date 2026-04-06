'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useModal } from '@/hooks/useModal';

interface UserDetail {
  _id: string;
  uid: number;
  nName?: string;
  authorEmail: string;
  memberType: 'user' | 'admin';
  delYn: boolean;
  mblNo?: string;
  providers?: string[];
  position?: string;
  career?: string;
  status?: string;
  avatarUrl?: string;
  introduction?: string;
  socialLinks?: {
    github?: string;
    blog?: string;
    linkedin?: string;
    other?: string;
    solvedAc?: string;
  };
  techTags?: string[];
  level?: number;
  bio?: string;
  domains?: string[];
  workStyle?: string[];
  weeklyAvailability?: number;
  portfolioLinks?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Props {
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AdminUserDetailModal({ userId, onClose, onUpdated }: Props) {
  const { confirm, alert } = useModal();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { signal: controller.signal });
        const json = await res.json();
        if (!cancelled && json.success) setUser(json.data);
      } catch {
        // AbortError는 cleanup 시 정상 발생 — 무시
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userId]);

  const patchUser = async (body: Partial<UserDetail>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setUser((prev) => (prev ? { ...prev, ...json.data } : prev));
        onUpdated();
      } else {
        await alert('오류', json.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    const action = user.delYn ? '활성화' : '비활성화';
    const ok = await confirm(
      `${action} 확인`,
      `${user.nName || user.authorEmail} 계정을 ${action}하시겠습니까?`,
      { confirmText: action, isDestructive: !user.delYn }
    );
    if (!ok) return;
    await patchUser({ delYn: !user.delYn });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-[16px] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-container-lowest rounded-lg shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="font-body text-body-md font-semibold text-on-surface">사용자 상세 정보</h2>
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

          {!loading && !user && (
            <div className="text-center py-12 text-on-surface-variant font-body text-body-md">
              사용자를 찾을 수 없습니다.
            </div>
          )}

          {!loading && user && (
            <div className="space-y-5">
              {/* 프로필 상단 */}
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.nName || ''}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-2xl text-on-surface-variant">
                    {(user.nName || user.authorEmail)?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-headline text-title-md font-semibold text-on-surface">
                    {user.nName || '(이름 없음)'}
                  </p>
                  <p className="font-body text-body-md text-on-surface-variant">
                    {user.authorEmail}
                  </p>
                  <p className="font-body text-label-md text-on-surface-variant font-mono mt-0.5">
                    UID: {user.uid}
                  </p>
                </div>
              </div>

              {/* 권한 & 상태 (표시 전용) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="font-body text-label-md text-on-surface-variant mb-2">권한</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${
                      user.memberType === 'admin'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {user.memberType === 'admin' ? '관리자' : '일반 사용자'}
                  </span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="font-body text-label-md text-on-surface-variant mb-2">계정 상태</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded font-body text-label-md font-medium ${
                      user.delYn
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {user.delYn ? '비활성' : '활성'}
                  </span>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="rounded-lg divide-y divide-outline-variant/15">
                {user.position && <InfoRow label="직군" value={user.position} />}
                {user.career && <InfoRow label="경력" value={user.career} />}
                {user.status && <InfoRow label="활동 상태" value={user.status} />}
                {user.mblNo && <InfoRow label="연락처" value={user.mblNo} />}
                {user.providers && user.providers.length > 0 && (
                  <InfoRow label="가입 방식" value={user.providers.join(', ')} />
                )}
                {user.level !== undefined && <InfoRow label="레벨" value={`Lv.${user.level}`} />}
                <InfoRow
                  label="가입일"
                  value={new Date(user.createdAt).toLocaleDateString('ko-KR')}
                />
                <InfoRow
                  label="최종 수정"
                  value={new Date(user.updatedAt).toLocaleDateString('ko-KR')}
                />
              </div>

              {/* 한 줄 소개 */}
              {user.bio && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-1.5">
                    한 줄 소개
                  </p>
                  <p className="font-body text-body-md text-on-surface">{user.bio}</p>
                </div>
              )}

              {/* 소개 */}
              {user.introduction && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-1.5">자기소개</p>
                  <p className="font-body text-body-md text-on-surface bg-surface-container-low rounded-lg p-4 leading-relaxed">
                    {user.introduction}
                  </p>
                </div>
              )}

              {/* 기술 태그 */}
              {user.techTags && user.techTags.length > 0 && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">기술 스택</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.techTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary/5 text-primary rounded-full px-3 py-1 font-body text-label-md font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 관심 도메인 */}
              {user.domains && user.domains.length > 0 && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">
                    관심 도메인
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.domains.map((domain) => (
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

              {/* 협업 스타일 */}
              {user.workStyle && user.workStyle.length > 0 && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">
                    협업 스타일
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.workStyle.map((style) => (
                      <span
                        key={style}
                        className="bg-secondary-container/30 text-on-secondary-container rounded-full px-3 py-1 font-body text-label-md"
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 주당 가용 시간 */}
              {user.weeklyAvailability != null && user.weeklyAvailability > 0 && (
                <div className="rounded-lg divide-y divide-outline-variant/15">
                  <InfoRow label="주당 가용시간" value={`${user.weeklyAvailability}시간`} />
                </div>
              )}

              {/* 포트폴리오 링크 */}
              {user.portfolioLinks && user.portfolioLinks.length > 0 && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">포트폴리오</p>
                  <div className="flex flex-col gap-1">
                    {user.portfolioLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body text-body-md text-primary hover:underline truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 소셜 링크 */}
              {user.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
                <div>
                  <p className="font-body text-label-md text-on-surface-variant mb-2">소셜 링크</p>
                  <div className="flex flex-col gap-1">
                    {user.socialLinks.github && (
                      <SocialLink label="GitHub" url={user.socialLinks.github} />
                    )}
                    {user.socialLinks.blog && (
                      <SocialLink label="Blog" url={user.socialLinks.blog} />
                    )}
                    {user.socialLinks.linkedin && (
                      <SocialLink label="LinkedIn" url={user.socialLinks.linkedin} />
                    )}
                    {user.socialLinks.solvedAc && (
                      <SocialLink label="Solved.ac" url={user.socialLinks.solvedAc} />
                    )}
                    {user.socialLinks.other && (
                      <SocialLink label="기타" url={user.socialLinks.other} />
                    )}
                  </div>
                </div>
              )}

              {/* 계정 관리 (Danger Zone) */}
              <div className="bg-error-container/10 rounded-lg p-4">
                <p className="font-body text-label-md font-semibold text-error mb-1">계정 관리</p>
                <p className="font-body text-label-md text-on-surface-variant mb-3">
                  {user.delYn
                    ? '계정을 활성화하면 해당 사용자가 다시 로그인할 수 있습니다.'
                    : '계정을 비활성화하면 해당 사용자의 로그인이 즉시 차단됩니다.'}
                </p>
                <button
                  onClick={handleToggleActive}
                  disabled={saving}
                  className={`w-full py-2 rounded-lg font-body text-body-md font-medium transition-colors disabled:opacity-50 ${
                    user.delYn
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                      : 'bg-error hover:bg-error/90 text-on-error'
                  }`}
                >
                  {saving ? '처리 중...' : user.delYn ? '계정 활성화' : '계정 비활성화'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {!loading && user && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-outline-variant/15 bg-surface-container-low">
            <a
              href={`/profile/${user._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-body-md text-primary hover:underline"
            >
              프로필 보기 ↗
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 font-body text-body-md bg-surface-container-high text-on-surface-variant rounded-lg hover:bg-surface-container-high/70 transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
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

function SocialLink({ label, url }: { label: string; url: string }) {
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
