import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// GET /api/admin/reviews — 전체 리뷰 목록
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const isPublicFilter = searchParams.get('isPublic'); // 'true' | 'false' | null(전체)
    const search = searchParams.get('search') || '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (isPublicFilter === 'true') filter.isPublic = true;
    else if (isPublicFilter === 'false') filter.isPublic = false;

    let reviews = await Review.find(filter)
      .populate('reviewerId', 'nName authorEmail')
      .populate('revieweeId', 'nName authorEmail')
      .populate('projectId', 'title pid')
      .sort({ createdAt: -1 })
      .lean();

    // 검색어 필터
    if (search) {
      const keyword = search.toLowerCase();
      reviews = reviews.filter((r) => {
        const reviewer = r.reviewerId as { nName?: string } | null;
        const reviewee = r.revieweeId as { nName?: string } | null;
        const project = r.projectId as { title?: string } | null;
        return (
          reviewer?.nName?.toLowerCase().includes(keyword) ||
          reviewee?.nName?.toLowerCase().includes(keyword) ||
          project?.title?.toLowerCase().includes(keyword) ||
          r.comment?.toLowerCase().includes(keyword)
        );
      });
    }

    const total = reviews.length;
    const paginated = reviews.slice((page - 1) * limit, page * limit);

    // 통계
    const allReviews = await Review.find({}).lean();
    const avgRating =
      allReviews.length > 0
        ? +(allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews: paginated,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: {
          total: allReviews.length,
          avgRating,
          publicCount: allReviews.filter((r) => r.isPublic).length,
          privateCount: allReviews.filter((r) => !r.isPublic).length,
        },
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '리뷰 목록 조회 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/reviews');
