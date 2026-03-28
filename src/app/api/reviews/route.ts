import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/lib/models/Review';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews — 리뷰 작성
 * Body: { projectId, revieweeId, rating, tags, comment?, isPublic? }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { projectId, revieweeId, rating, tags, comment, isPublic } = body;

    if (!projectId || !revieweeId || !rating) {
      return NextResponse.json(
        { success: false, message: '필수 항목(projectId, revieweeId, rating)이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 자기 자신 리뷰 금지
    if (session.user._id === revieweeId) {
      return NextResponse.json(
        { success: false, message: '자기 자신에게는 리뷰를 작성할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 별점 범위 검증
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: '별점은 1~5 사이여야 합니다.' },
        { status: 400 }
      );
    }

    const review = await Review.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      reviewerId: new mongoose.Types.ObjectId(session.user._id),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      rating,
      tags: tags || [],
      comment: comment || undefined,
      isPublic: isPublic !== false,
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: any) {
    // 중복 리뷰 (unique index 위반)
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: '이미 해당 팀원에게 리뷰를 작성했습니다.' },
        { status: 409 }
      );
    }
    console.error('[POST /api/reviews] 오류:', error);
    return NextResponse.json(
      { success: false, message: '리뷰 작성 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?revieweeId=xxx — 특정 유저가 받은 공개 리뷰 목록
 */
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get('revieweeId');

    if (!revieweeId) {
      return NextResponse.json(
        { success: false, message: 'revieweeId 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      isPublic: true,
    })
      .populate('reviewerId', 'nName avatarUrl position')
      .populate('projectId', 'title pid')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('[GET /api/reviews] 오류:', error);
    return NextResponse.json(
      { success: false, message: '리뷰 조회 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
