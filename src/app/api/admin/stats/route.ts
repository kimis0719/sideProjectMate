import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import TechStack from '@/lib/models/TechStack';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // 병렬 집계
    const [
      totalUsers,
      newUsersThisWeek,
      recentUsers,
      totalProjects,
      newProjectsThisWeek,
      projectsByStatus,
      recentProjects,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      topTechStacksRaw,
    ] = await Promise.all([
      // 유저 통계
      User.countDocuments({ delYn: { $ne: true } }),
      User.countDocuments({ createdAt: { $gte: startOfWeek }, delYn: { $ne: true } }),
      User.find({ delYn: { $ne: true } })
        .select('nName authorEmail avatarUrl createdAt memberType')
        .sort({ createdAt: -1 })
        .limit(5),

      // 프로젝트 통계
      Project.countDocuments({}),
      Project.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.find({})
        .select('pid title status createdAt author views')
        .populate('author', 'nName')
        .sort({ createdAt: -1 })
        .limit(5),

      // 지원 통계
      Application.countDocuments({}),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'accepted' }),

      // 인기 기술 스택 (프로젝트 tags 기준 Top 10)
      Project.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'techstacks',
            localField: '_id',
            foreignField: '_id',
            as: 'stack',
          },
        },
        { $unwind: { path: '$stack', preserveNullAndEmpty: false } },
        { $project: { _id: 0, name: '$stack.name', count: 1 } },
      ]),
    ]);

    // 상태별 프로젝트 수 매핑
    const statusCountMap: Record<string, number> = { '01': 0, '02': 0, '03': 0 };
    for (const item of projectsByStatus) {
      statusCountMap[item._id] = item.count;
    }

    // 수락률 계산
    const acceptanceRate =
      totalApplications > 0
        ? Math.round((acceptedApplications / totalApplications) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisWeek: newUsersThisWeek,
          recent: recentUsers,
        },
        projects: {
          total: totalProjects,
          newThisWeek: newProjectsThisWeek,
          byStatus: {
            recruiting: statusCountMap['01'],
            inProgress: statusCountMap['02'],
            completed: statusCountMap['03'],
          },
          recent: recentProjects,
        },
        applications: {
          total: totalApplications,
          pendingCount: pendingApplications,
          acceptanceRate,
        },
        topTechStacks: topTechStacksRaw as { name: string; count: number }[],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '통계를 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
