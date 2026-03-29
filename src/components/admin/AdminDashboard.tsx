'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { getIconSlug } from '@/lib/iconUtils';

interface StatsData {
  users: {
    total: number;
    newThisWeek: number;
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
    newThisWeek: number;
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
  };
  topTechStacks: { name: string; count: number }[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  '01': { label: '모집중', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
  '02': { label: '진행중', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/50' },
  '03': { label: '완료', color: 'text-muted-foreground bg-muted' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setStats(json.data);
        else setError(json.message);
      })
      .catch(() => setError('통계를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-xl" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <p className="text-red-500">{error || '데이터를 불러올 수 없습니다.'}</p>
      </div>
    );
  }

  const maxStackCount = stats.topTechStacks[0]?.count ?? 1;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">관리자 대시보드</h2>
        <p className="text-muted-foreground text-sm">플랫폼 현황을 한눈에 확인하세요.</p>
      </div>

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="전체 사용자"
          value={stats.users.total.toLocaleString()}
          icon="👥"
          sub={`이번 주 +${stats.users.newThisWeek}명`}
          color="blue"
        />
        <AdminStatCard
          label="전체 프로젝트"
          value={stats.projects.total.toLocaleString()}
          sub={`이번 주 +${stats.projects.newThisWeek}개`}
          icon="📁"
          color="green"
        />
        <AdminStatCard
          label="대기 중인 지원"
          value={stats.applications.pendingCount.toLocaleString()}
          sub={`전체 ${stats.applications.total.toLocaleString()}건`}
          icon="📨"
          color="yellow"
        />
        <AdminStatCard
          label="지원 수락률"
          value={`${stats.applications.acceptanceRate}%`}
          sub={`전체 지원 ${stats.applications.total.toLocaleString()}건`}
          icon="✅"
          color="purple"
        />
      </div>

      {/* 프로젝트 상태 요약 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '모집중', count: stats.projects.byStatus.recruiting, color: 'bg-blue-500' },
          { label: '진행중', count: stats.projects.byStatus.inProgress, color: 'bg-yellow-400' },
          { label: '완료', count: stats.projects.byStatus.completed, color: 'bg-gray-400' },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="bg-card rounded-xl border border-border shadow-sm p-4 text-center"
          >
            <div className={`w-2 h-2 rounded-full ${color} mx-auto mb-2`} />
            <p className="text-xl font-bold text-foreground">{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 하단 2컬럼: 인기 기술 스택 + 최근 가입자/프로젝트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 기술 스택 Top 10 */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">인기 기술 스택 Top 10</h3>
            <Link href="/admin/tech-stacks" className="text-xs text-primary hover:underline">
              관리 →
            </Link>
          </div>
          {stats.topTechStacks.length === 0 ? (
            <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
          ) : (
            <ol className="space-y-2">
              {stats.topTechStacks.map((stack, idx) => {
                const slug = getIconSlug(stack.name);
                const barWidth = Math.max(4, Math.round((stack.count / maxStackCount) * 100));
                return (
                  <li key={stack.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 text-right">{idx + 1}</span>
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
                    <span className="text-sm text-foreground w-24 truncate">{stack.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {stack.count}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* 오른쪽 2행: 최근 가입자 + 최근 프로젝트 */}
        <div className="space-y-6">
          {/* 최근 가입 사용자 5명 */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">최근 가입 사용자</h3>
              <Link href="/admin/users" className="text-xs text-primary hover:underline">
                전체 보기 →
              </Link>
            </div>
            <ul className="space-y-2">
              {stats.users.recent.map((user) => (
                <li key={user._id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {user.nName || '(이름 없음)'}
                    </span>
                    {user.memberType === 'admin' && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                        관리자
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 최근 생성 프로젝트 5개 */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">최근 생성 프로젝트</h3>
              <Link href="/admin/projects" className="text-xs text-primary hover:underline">
                전체 보기 →
              </Link>
            </div>
            <ul className="space-y-2">
              {stats.projects.recent.map((project) => {
                const statusInfo = STATUS_LABEL[project.status] ?? {
                  label: project.status,
                  color: 'text-muted-foreground bg-muted',
                };
                return (
                  <li key={project._id} className="flex items-center justify-between text-sm gap-2">
                    <Link
                      href={`/projects/${project.pid}`}
                      target="_blank"
                      className="font-medium text-foreground hover:text-primary hover:underline truncate"
                    >
                      {project.title}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
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
