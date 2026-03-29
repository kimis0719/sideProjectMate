import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AiInstructionHistory from '@/lib/models/AiInstructionHistory';

export const dynamic = 'force-dynamic';

// GET /api/ai/history/[id] — 히스토리 상세
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    await dbConnect();
    const history = await AiInstructionHistory.findById(params.id)
      .populate('creatorId', 'name nName avatarUrl')
      .lean();

    if (!history) {
      return NextResponse.json(
        { success: false, message: '히스토리를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: history });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json(
      { success: false, message: `히스토리 조회 실패: ${message}` },
      { status: 500 }
    );
  }
}
