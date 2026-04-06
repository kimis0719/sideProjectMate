import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Application from '@/lib/models/Application';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/applications — 전체 지원서 목록 (상태 필터 + 검색 + 페이지네이션)
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 먼저 전체 쿼리를 빌드하고, 검색어가 있으면 populate 후 필터
    const baseQuery = Application.find(filter)
      .populate('applicantId', 'nName authorEmail avatarUrl')
      .populate('projectId', 'title pid')
      .sort({ createdAt: -1 })
      .lean();

    let applications = await baseQuery;

    // 검색어 필터 (populate 후 메모리에서 필터링)
    if (search) {
      const keyword = search.toLowerCase();
      applications = applications.filter((app) => {
        const applicant = app.applicantId as { nName?: string; authorEmail?: string } | null;
        const project = app.projectId as { title?: string } | null;
        return (
          applicant?.nName?.toLowerCase().includes(keyword) ||
          applicant?.authorEmail?.toLowerCase().includes(keyword) ||
          project?.title?.toLowerCase().includes(keyword)
        );
      });
    }

    const total = applications.length;
    const paginated = applications.slice((page - 1) * limit, page * limit);

    // 상태별 카운트
    const allApps = await Application.find({}).lean();
    const statusCounts = {
      all: allApps.length,
      pending: allApps.filter((a) => a.status === 'pending').length,
      accepted: allApps.filter((a) => a.status === 'accepted').length,
      rejected: allApps.filter((a) => a.status === 'rejected').length,
      withdrawn: allApps.filter((a) => a.status === 'withdrawn').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        applications: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        statusCounts,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '지원서 목록 조회 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/applications');
