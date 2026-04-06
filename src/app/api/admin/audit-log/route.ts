import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminAuditLog from '@/lib/models/AdminAuditLog';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/audit-log — 감사 로그 조회
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const date = searchParams.get('date') || ''; // YYYY-MM-DD
    const adminId = searchParams.get('adminId') || '';
    const targetType = searchParams.get('targetType') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (date) {
      // KST 기준으로 하루 범위 계산 (UTC+9)
      const start = new Date(date + 'T00:00:00+09:00');
      const end = new Date(date + 'T23:59:59.999+09:00');
      filter.createdAt = { $gte: start, $lte: end };
    }
    if (adminId) filter.adminId = adminId;
    if (targetType) filter.targetType = targetType;

    const total = await AdminAuditLog.countDocuments(filter);
    const logs = await AdminAuditLog.find(filter)
      .populate('adminId', 'nName authorEmail')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '감사 로그 조회 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/audit-log');
