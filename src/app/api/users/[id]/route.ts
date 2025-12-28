import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/lib/models/User';
import Availability, { IAvailability } from '@/lib/models/Availability';

/**
 * @api {get} /api/users/[id] 사용자 상세 정보 조회
 * @description
 * 특정 사용자의 공개 프로필 정보를 조회합니다.
 * DB에서 User 정보와 Availability 정보를 함께 조회하여 반환합니다.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    // 1. URL Parameter에서 ID 추출
    const userId = params.id;

    if (!userId) {
        return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
    }

    try {
        await dbConnect(); // DB 연결

        // 2. 사용자 기본 정보 조회 (비밀번호 제외)
        // lean()을 사용하여 데이터를 POJO(Plain Object)로 가져옵니다.
        // Explicitly cast to unknown then IUser to handle potential Mongoose type mismatches with lean()
        const user = (await User.findById(userId).select('-password').lean()) as unknown as IUser;

        if (!user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 3. 가용성(Availability) 정보 조회
        // User 모델의 _id를 참조하고 있다고 가정합니다.
        // findOne could return null, so we cast to IAvailability | null
        const availability = (await Availability.findOne({ userId: user._id }).lean()) as unknown as IAvailability | null;

        // 4. Client가 사용하기 편한 형태로 데이터 구조화
        const profileData = {
            _id: user._id,
            nName: user.nName,
            // IUser has 'authorEmail', but frontend expects 'email'. We allow null/undefined handling.
            email: user.authorEmail || '',
            position: user.position || '포지션 미설정',
            career: user.career || '신입',
            status: user.status || '구직중',
            introduction: user.introduction || '',

            // Social Links (User 모델 스키마에 정의된 대로)
            // IUser interface now includes solvedAc.
            socialLinks: {
                github: user.socialLinks?.github || '',
                blog: user.socialLinks?.blog || '',
                solvedAc: user.socialLinks?.solvedAc || '',
            },

            // 통합된 가용성 정보 (Optional chaining for availability)
            schedule: availability?.schedule || [],
            preference: availability?.preference ?? 50,
            personalityTags: availability?.personalityTags || [],

            // 포트폴리오 (User 모델에 없을 수도 있으므로 방어 코드)
            portfolioLinks: user.portfolioLinks || []
        };

        return NextResponse.json({ success: true, data: profileData });

    } catch (error: any) {
        console.error('[API] Public Profile Fetch Error:', error);

        // ObjectId 형식이 아닐 때 발생하는 CastError 처리
        if (error.name === 'CastError') {
            return NextResponse.json({ error: '잘못된 사용자 ID 형식입니다.' }, { status: 400 });
        }

        return NextResponse.json(
            { error: '서버 내부 오류가 발생했습니다.', details: error.message },
            { status: 500 }
        );
    }
}
