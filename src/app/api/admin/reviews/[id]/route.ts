import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';
import { logAdminAction, getClientIp } from '@/lib/utils/adminAuditLog';

export const dynamic = 'force-dynamic';

// DELETE /api/admin/reviews/[id] — 부적절 리뷰 삭제
async function handleDelete(request: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const deleted = await Review.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    logAdminAction({
      adminId: session!.user._id,
      adminEmail: session!.user.email ?? '',
      action: 'review.delete',
      targetType: 'review',
      targetId: params.id,
      targetLabel: `rating:${deleted.rating}`,
      detail: deleted.comment ? `코멘트: ${deleted.comment.slice(0, 50)}` : '',
      ip: getClientIp(request),
    });

    return NextResponse.json({ success: true, message: '리뷰가 삭제되었습니다.' });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '리뷰 삭제 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const DELETE = withApiLogging(handleDelete, '/api/admin/reviews/[id]');
