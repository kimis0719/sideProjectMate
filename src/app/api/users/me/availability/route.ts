import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Availability from '@/lib/models/Availability';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증되지 않은 사용자입니다.' }, { status: 401 });
        }

        await dbConnect();

        const availability = await Availability.findOne({ userId: session.user._id });

        return NextResponse.json({
            success: true,
            data: availability || { schedule: [], preference: 50, personalityTags: [] },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: '가용성 정보를 불러오는 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증되지 않은 사용자입니다.' }, { status: 401 });
        }

        await dbConnect();
        const body = await request.json();
        const { schedule, preference, personalityTags } = body;

        const availability = await Availability.findOneAndUpdate(
            { userId: session.user._id },
            {
                userId: session.user._id,
                schedule,
                preference,
                personalityTags,
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: '가용성 정보가 저장되었습니다.',
            data: availability,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: '가용성 정보 저장 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
