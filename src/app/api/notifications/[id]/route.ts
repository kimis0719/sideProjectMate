import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { id } = params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return NextResponse.json({ success: false, message: '알림을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (notification.recipient.toString() !== session.user._id) {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({ success: true, data: notification });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '알림 처리 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
