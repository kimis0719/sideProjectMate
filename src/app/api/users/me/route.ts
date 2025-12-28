import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Availability from '@/lib/models/Availability';
import { authOptions } from '@/lib/auth';

/**
 * @api {get} /api/users/me 내 프로필 정보 조회
 * @description 로그인한 사용자의 상세 프로필 정보와 가용성 정보를 통합하여 반환합니다.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;

        if (!session || !session.user || !session.user._id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // 1. 사용자 기본 정보 조회 (GitHub Stats, Tech Tags 등 포함)
        const user: any = await User.findById(session.user._id).select('-password -__v').lean();

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // 2. 가용성 정보 조회
        const availability: any = await Availability.findOne({ userId: session.user._id }).lean();

        // 3. 데이터 통합
        const responseData = {
            ...user,
            schedule: availability?.schedule || [],
            preference: availability?.preference ?? 50,
            personalityTags: availability?.personalityTags || [],
        };

        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        console.error('Failed to fetch my profile:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

/**
 * @api {patch} /api/users/me 내 프로필 정보 수정
 * @description 로그인한 사용자의 프로필 정보를 수정합니다. (자기소개, 기술스택, 포지션 등)
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;

        if (!session || !session.user || !session.user._id) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { introduction, techTags, position, career, status, socialLinks } = body;

        await dbConnect();

        // 업데이트할 필드만 구성
        const updateData: any = {};
        if (introduction !== undefined) updateData.introduction = introduction;
        if (techTags !== undefined) updateData.techTags = techTags;
        if (position !== undefined) updateData.position = position;
        if (career !== undefined) updateData.career = career;
        if (status !== undefined) updateData.status = status;
        if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

        const updatedUser = await User.findByIdAndUpdate(
            session.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -__v').lean();

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updatedUser });

    } catch (error: any) {
        console.error('Failed to update profile:', error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
