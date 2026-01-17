import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';

// 모델 등록을 보장하기 위해 임시 변수 할당 (Tree-shaking 방지)
const _models = { User, Project };

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    headers(); // 이 라우트가 동적임을 명시적으로 알림
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


export async function POST(request: Request) {
    headers();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { recipientId, type, projectId, projectPid, metadata } = body;

        if (!recipientId || !type || (!projectId && !projectPid)) {
            return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        await dbConnect();

        let targetProjectId = projectId;
        if (!targetProjectId && projectPid) {
            const project = await Project.findOne({ pid: projectPid });
            if (!project) {
                return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
            }
            targetProjectId = project._id;
        }

        const newNotification = new Notification({
            recipient: recipientId,
            sender: session.user._id,
            type,
            project: targetProjectId,
            metadata: metadata || {},
            read: false
        });

        await newNotification.save();

        // Populate for response
        await newNotification.populate('sender', 'nName');
        await newNotification.populate('project', 'title pid');

        return NextResponse.json({ success: true, data: newNotification });

    } catch (error: any) {
        console.error('[NOTIFICATIONS CREATE ERROR]', error);
        return NextResponse.json(
            { success: false, message: '알림 생성 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    headers();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        await dbConnect();

        // 현재 사용자의 모든 알림 삭제
        await Notification.deleteMany({ recipient: session.user._id });

        return NextResponse.json({ success: true, message: '모든 알림이 삭제되었습니다.' });

    } catch (error: any) {
        console.error('[NOTIFICATIONS DELETE ERROR]', error);
        return NextResponse.json(
            { success: false, message: '알림 삭제 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
