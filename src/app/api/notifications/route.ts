import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';

export const dynamic = 'force-dynamic'; // 동적 렌더링을 강제하는 코드 추가

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();

    const notifications = await Notification.find({ recipient: session.user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'nName')
      .populate('project', 'title pid');

    return NextResponse.json({ success: true, data: notifications });

  } catch (error: any) {
    console.error('[NOTIFICATIONS API ERROR]', error);
    return NextResponse.json(
      { success: false, message: '알림을 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
