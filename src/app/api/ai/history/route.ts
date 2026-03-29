import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiInstructionHistory from '@/lib/models/AiInstructionHistory';

export const dynamic = 'force-dynamic';

// GET /api/ai/history?boardId=xxx&page=1&limit=20 — 히스토리 목록
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));

    if (!boardId) {
      return NextResponse.json(
        { success: false, message: 'boardId는 필수입니다.' },
        { status: 400 }
      );
    }

    const [items, total] = await Promise.all([
      AiInstructionHistory.find({ boardId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('creatorId', 'name nName avatarUrl')
        .lean(),
      AiInstructionHistory.countDocuments({ boardId }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `히스토리 조회 실패: ${message}` },
      { status: 500 }
    );
  }
}
