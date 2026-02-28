import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET /api/admin/projects — 프로젝트 목록 (상태 필터, 페이지네이션)
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status'); // '01' | '02' | '03'
    const search = searchParams.get('search') || '';

    const query: Record<string, any> = {};
    if (status && ['01', '02', '03'].includes(status)) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      Project.find(query)
        .select('pid title status views likes createdAt author members')
        .populate('author', 'nName authorEmail')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({ success: true, data: { projects, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트 목록을 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
