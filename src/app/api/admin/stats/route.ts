import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import Review from '@/lib/models/Review';
import TechStack from '@/lib/models/TechStack';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

// TechStack import를 유지 (모델 등록용)
void TechStack;

export const dynamic = 'force-dynamic';

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(now.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setDate(now.getDate() - 30);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null; // 'all'
}

async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const periodStart = getPeriodStart(period);

    // 기간 조건
    const periodFilter = periodStart ? { createdAt: { $gte: periodStart } } : {};

    // 병렬 집계
    const [
      totalUsers,
      newUsersInPeriod,
      recentUsers,
      totalProjects,
      newProjectsInPeriod,
      projectsByStatus,
      recentProjects,
      applicationStats,
      newApplicationsInPeriod,
      topTechStacksRaw,
      reviewStats,
      newReviewsInPeriod,
    ] = await Promise.all([
      // 유저 통계
      User.countDocuments({ delYn: { $ne: true } }),
      User.countDocuments({ ...periodFilter, delYn: { $ne: true } }),
      User.find({ delYn: { $ne: true } })
        .select('nName authorEmail avatarUrl createdAt memberType')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // 프로젝트 통계
      Project.countDocuments({}),
      Project.countDocuments(periodFilter),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Project.find({})
        .select('pid title status createdAt author views')
        .populate('ownerId', 'nName')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // 지원 통계
      Application.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            accepted: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          },
        },
      ]),
      Application.countDocuments(periodFilter),

      // 인기 기술 스택 (프로젝트 techStacks 기준 Top 10)
      Project.aggregate([
        { $unwind: '$techStacks' },
        { $group: { _id: '$techStacks', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, name: '$_id', count: 1 } },
      ]),

      // 리뷰 통계
      Review.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            publicCount: { $sum: { $cond: ['$isPublic', 1, 0] } },
          },
        },
      ]),
      Review.countDocuments(periodFilter),
    ]);

    // 상태별 프로젝트 수 매핑
    const statusCountMap: Record<string, number> = {
      recruiting: 0,
      in_progress: 0,
      completed: 0,
      paused: 0,
    };
    for (const item of projectsByStatus) {
      statusCountMap[item._id] = item.count;
    }

    // 지원 통계 추출
    const appStats = applicationStats[0] || { total: 0, pending: 0, accepted: 0 };
    const totalApplications = appStats.total;
    const pendingApplications = appStats.pending;
    const acceptedApplications = appStats.accepted;
    const acceptanceRate =
      totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;

    // 리뷰 통계 추출
    const rvStats = reviewStats[0] || { total: 0, avgRating: 0, publicCount: 0 };

    const periodLabel = period === 'week' ? '이번 주' : period === 'month' ? '이번 달' : '전체';

    return NextResponse.json({
      success: true,
      data: {
        period: { key: period, label: periodLabel },
        users: {
          total: totalUsers,
          newInPeriod: newUsersInPeriod,
          recent: recentUsers,
        },
        projects: {
          total: totalProjects,
          newInPeriod: newProjectsInPeriod,
          byStatus: {
            recruiting: statusCountMap['recruiting'],
            inProgress: statusCountMap['in_progress'],
            completed: statusCountMap['completed'],
          },
          recent: recentProjects,
        },
        applications: {
          total: totalApplications,
          pendingCount: pendingApplications,
          acceptanceRate,
          newInPeriod: newApplicationsInPeriod,
        },
        reviews: {
          total: rvStats.total,
          avgRating: rvStats.avgRating ? +rvStats.avgRating.toFixed(1) : 0,
          newInPeriod: newReviewsInPeriod,
        },
        topTechStacks: topTechStacksRaw as { name: string; count: number }[],
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '통계를 불러오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/stats');
