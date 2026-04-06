import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/lib/models/Announcement';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';
import { logAdminAction, getClientIp } from '@/lib/utils/adminAuditLog';

export const dynamic = 'force-dynamic';

// GET /api/admin/announcements — 발송 이력 조회
async function handleGet(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const total = await Announcement.countDocuments();
    const announcements = await Announcement.find()
      .populate('sentBy', 'nName authorEmail')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        announcements,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '공지 이력 조회 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements — 공지사항 발송
async function handlePost(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();
    const { title, message, target } = body;

    if (!title || !message || !target) {
      return NextResponse.json(
        { success: false, message: '제목, 내용, 대상을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 대상 사용자 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userFilter: Record<string, any> = {};
    if (target === 'active') {
      userFilter.delYn = { $ne: true };
    }

    const users = await User.find(userFilter).select('_id').lean();

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '발송 대상 사용자가 없습니다.' },
        { status: 400 }
      );
    }

    const adminId = session!.user._id;

    // Notification 일괄 생성
    const notifications = users.map((user) => ({
      recipient: user._id,
      sender: adminId,
      type: 'announcement' as const,
      read: false,
      metadata: { title, message },
    }));

    await Notification.insertMany(notifications);

    // Announcement 이력 저장
    const announcement = await Announcement.create({
      title,
      message,
      target,
      sentCount: users.length,
      sentBy: adminId,
    });

    logAdminAction({
      adminId: adminId,
      adminEmail: session!.user.email ?? '',
      action: 'announcement.send',
      targetType: 'announcement',
      targetId: announcement._id.toString(),
      targetLabel: title,
      detail: `대상: ${target}, 발송: ${users.length}명`,
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      data: announcement,
      message: `${users.length}명에게 공지가 발송되었습니다.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '공지 발송 중 오류가 발생했습니다.',
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/admin/announcements');
export const POST = withApiLogging(handlePost, '/api/admin/announcements');
