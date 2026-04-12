import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AiUsage from '@/lib/models/AiUsage';
import AiSettings from '@/lib/models/AiSettings';
import AiUsageAlert from '@/lib/models/AiUsageAlert';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/ai-settings/usage — AI 사용량 통계 조회
async function handleGet() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [
      totalCount,
      todayCount,
      tokenStats,
      todayTokenStats,
      topProjects,
      settings,
      todayAlerts,
    ] = await Promise.all([
      AiUsage.countDocuments(),
      AiUsage.countDocuments({ createdAt: { $gte: todayStart } }),
      AiUsage.aggregate([
        {
          $group: {
            _id: null,
            totalInputTokens: { $sum: '$inputTokens' },
            totalOutputTokens: { $sum: '$outputTokens' },
            estimatedTotalCost: { $sum: '$estimatedCost' },
          },
        },
      ]),
      AiUsage.aggregate([
        { $match: { createdAt: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            todayInputTokens: { $sum: '$inputTokens' },
            todayOutputTokens: { $sum: '$outputTokens' },
          },
        },
      ]),
      AiUsage.aggregate([
        {
          $group: {
            _id: '$projectId',
            count: { $sum: 1 },
            estimatedCost: { $sum: '$estimatedCost' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, projectId: '$_id', count: 1, estimatedCost: 1 } },
      ]),
      AiSettings.getInstance(),
      AiUsageAlert.find({ date: todayStr }).lean(),
    ]);

    const stats = tokenStats[0] ?? {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedTotalCost: 0,
    };

    const todayStats = todayTokenStats[0] ?? {
      todayInputTokens: 0,
      todayOutputTokens: 0,
    };

    const todayTotalTokens = todayStats.todayInputTokens + todayStats.todayOutputTokens;
    const dailyRequestLimit = settings.dailyRequestLimit ?? 1500;
    const dailyTokenLimit = settings.dailyTokenLimit ?? 1000000;

    return NextResponse.json({
      success: true,
      data: {
        totalCount,
        todayCount,
        totalInputTokens: stats.totalInputTokens,
        totalOutputTokens: stats.totalOutputTokens,
        estimatedTotalCost: stats.estimatedTotalCost,
        topProjects,
        // 오늘 사용량 vs 한도
        todayTotalTokens,
        todayInputTokens: todayStats.todayInputTokens,
        todayOutputTokens: todayStats.todayOutputTokens,
        dailyRequestLimit,
        dailyTokenLimit,
        requestPercent:
          dailyRequestLimit > 0 ? Math.round((todayCount / dailyRequestLimit) * 100) : 0,
        tokenPercent:
          dailyTokenLimit > 0 ? Math.round((todayTotalTokens / dailyTokenLimit) * 100) : 0,
        todayAlerts: todayAlerts.map((a) => ({
          level: a.level,
          percent: a.percent,
          notifiedAt: a.notifiedAt,
        })),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: '사용량 통계 조회 중 오류가 발생했습니다.', error: message },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/ai-settings/usage');
