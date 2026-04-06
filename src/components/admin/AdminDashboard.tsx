'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { getIconSlug } from '@/lib/iconUtils';

interface StatsData {
  period: { key: string; label: string };
  users: {
    total: number;
    newInPeriod: number;
    recent: {
      _id: string;
      nName: string;
      authorEmail: string;
      createdAt: string;
      memberType: string;
    }[];
  };
  projects: {
    total: number;
    newInPeriod: number;
    byStatus: { recruiting: number; inProgress: number; completed: number };
    recent: {
      _id: string;
      pid: number;
      title: string;
      status: string;
      views: number;
      createdAt: string;
      author: { nName: string } | null;
    }[];
  };
  applications: {
    total: number;
    pendingCount: number;
    acceptanceRate: number;
    newInPeriod: number;
  };
  reviews: {
    total: number;
    avgRating: number;
    newInPeriod: number;
  };
  topTechStacks: { name: string; count: number }[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  recruiting: { label: '모집중', color: 'text-primary bg-primary/5' },
  in_progress: { label: '진행중', color: 'text-amber-600 bg-amber-50' },
  completed: { label: '완료', color: 'text-on-surface-variant bg-surface-container-high' },
  paused: { label: '일시정지', color: 'text-on-surface-variant bg-surface-container-high' },
};

const PERIOD_OPTIONS = [
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'all', label: '전체' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`/api/admin/stats?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
        else setError(json.message);
      })
      .catch(() => setError('통계를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-container-high rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-surface-container-high rounded-lg" />
            <div className="h-64 bg-surface-container-high rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <p className="text-error font-body text-body-md">
          {error || '데이터를 불러올 수 없습니다.'}
        </p>
      </div>
    );
  }

  const maxStackCount = stats.topTechStacks[0]?.count ?? 1;
  const periodLabel = stats.period.label;
  const isAll = period === 'all';

  return (
    <div className="p-8 space-y-8">
      {/* 헤더 + 기간 필터 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">관리자 대시보드</h2>
          <p className="font-body text-body-md text-on-surface-variant">
            플랫폼 현황을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-2 rounded-lg font-body text-body-md transition-colors ${
                period === key
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 카드 5개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <AdminStatCard
          label="전체 사용자"
          value={stats.users.total.toLocaleString()}
          icon="👥"
          sub={isAll ? undefined : `${periodLabel} +${stats.users.newInPeriod}명`}
          color="blue"
        />
        <AdminStatCard
          label="전체 프로젝트"
          value={stats.projects.total.toLocaleString()}
          sub={isAll ? undefined : `${periodLabel} +${stats.projects.newInPeriod}개`}
          icon="📁"
          color="green"
        />
        <AdminStatCard
          label="대기 중인 지원"
          value={stats.applications.pendingCount.toLocaleString()}
          sub={`수락률 ${stats.applications.acceptanceRate}%`}
          icon="📨"
          color="yellow"
        />
        <AdminStatCard
          label="리뷰"
          value={stats.reviews.total.toLocaleString()}
          sub={
            isAll
              ? `평균 ⭐${stats.reviews.avgRating}`
              : `평균 ⭐${stats.reviews.avgRating} · ${periodLabel} +${stats.reviews.newInPeriod}`
          }
          icon="⭐"
          color="purple"
        />
        <AdminStatCard
          label="지원 수락률"
          value={`${stats.applications.acceptanceRate}%`}
          sub={`전체 ${stats.applications.total.toLocaleString()}건`}
          icon="✅"
          color="blue"
        />
      </div>

      {/* 프로젝트 상태 요약 */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: '모집중', count: stats.projects.byStatus.recruiting, color: 'bg-primary' },
          { label: '진행중', count: stats.projects.byStatus.inProgress, color: 'bg-amber-400' },
          {
            label: '완료',
            count: stats.projects.byStatus.completed,
            color: 'bg-surface-container-high',
          },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="bg-surface-container-lowest rounded-lg p-4 text-center hover:bg-surface-bright transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${color} mx-auto mb-2`} />
            <p className="font-headline text-xl font-bold text-on-surface">{count}</p>
            <p className="font-body text-label-md text-on-surface-variant mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 하단 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 인기 기술 스택 Top 10 */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-headline-sm font-semibold text-on-surface">
              인기 기술 스택 Top 10
            </h3>
            <Link
              href="/admin/tech-stacks"
              className="font-body text-label-md text-primary hover:underline"
            >
              관리 →
            </Link>
          </div>
          {stats.topTechStacks.length === 0 ? (
            <p className="font-body text-body-md text-on-surface-variant">데이터가 없습니다.</p>
          ) : (
            <ol className="space-y-3">
              {stats.topTechStacks.map((stack, idx) => {
                const slug = getIconSlug(stack.name);
                const barWidth = Math.max(4, Math.round((stack.count / maxStackCount) * 100));
                return (
                  <li key={stack.name} className="flex items-center gap-3">
                    <span className="font-body text-label-md text-on-surface-variant w-4 text-right">
                      {idx + 1}
                    </span>
                    <Image
                      src={`https://skillicons.dev/icons?i=${slug}`}
                      alt={stack.name}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-body text-body-md text-on-surface w-24 truncate">
                      {stack.name}
                    </span>
                    <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="font-body text-label-md text-on-surface-variant w-8 text-right">
                      {stack.count}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* 오른쪽: 최근 가입자 + 최근 프로젝트 */}
        <div className="space-y-8">
          {/* 최근 가입 사용자 */}
          <div className="bg-surface-container-lowest rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-body-md font-semibold text-on-surface">
                최근 가입 사용자
              </h3>
              <Link
                href="/admin/users"
                className="font-body text-label-md text-primary hover:underline"
              >
                전체 보기 →
              </Link>
            </div>
            <ul className="space-y-3">
              {stats.users.recent.map((user) => (
                <li
                  key={user._id}
                  className="flex items-center justify-between font-body text-body-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-on-surface truncate">
                      {user.nName || '(이름 없음)'}
                    </span>
                    {user.memberType === 'admin' && (
                      <span className="font-body text-label-md bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded">
                        관리자
                      </span>
                    )}
                  </div>
                  <span className="font-body text-label-md text-on-surface-variant shrink-0 ml-2">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 최근 생성 프로젝트 */}
          <div className="bg-surface-container-lowest rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-body-md font-semibold text-on-surface">
                최근 생성 프로젝트
              </h3>
              <Link
                href="/admin/projects"
                className="font-body text-label-md text-primary hover:underline"
              >
                전체 보기 →
              </Link>
            </div>
            <ul className="space-y-3">
              {stats.projects.recent.map((project) => {
                const statusInfo = STATUS_LABEL[project.status] ?? {
                  label: project.status,
                  color: 'text-on-surface-variant bg-surface-container-high',
                };
                return (
                  <li
                    key={project._id}
                    className="flex items-center justify-between font-body text-body-md gap-2"
                  >
                    <Link
                      href={`/projects/${project.pid}`}
                      target="_blank"
                      className="font-medium text-on-surface hover:text-primary hover:underline truncate"
                    >
                      {project.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-body text-label-md px-1.5 py-0.5 rounded font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="font-body text-label-md text-on-surface-variant">
                        {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
