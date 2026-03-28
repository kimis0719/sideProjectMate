import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews/check?projectId=xxx&revieweeId=xxx
 * 현재 로그인 유저가 특정 프로젝트에서 특정 유저를 이미 리뷰했는지 확인
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const revieweeId = searchParams.get('revieweeId');

    if (!projectId || !revieweeId) {
      return NextResponse.json(
        { success: false, message: 'projectId와 revieweeId 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const existing = await Review.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      reviewerId: new mongoose.Types.ObjectId(session.user._id),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
    }).lean();

    return NextResponse.json({ success: true, data: { hasReviewed: !!existing } });
  } catch (error: any) {
    console.error('[GET /api/reviews/check] 오류:', error);
    return NextResponse.json(
      { success: false, message: '확인 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
