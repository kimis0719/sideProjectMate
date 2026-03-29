import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { IUser } from '@/lib/models/User';
import Availability, { IAvailability } from '@/lib/models/Availability';
import { withApiLogging } from '@/lib/apiLogger';

/**
 * @api {get} /api/users/[id] 사용자 상세 정보 조회
 * @description
 * 특정 사용자의 공개 프로필 정보를 조회합니다.
 * DB에서 User 정보와 Availability 정보를 함께 조회하여 반환합니다.
 */
async function handleGet(req: NextRequest, { params }: { params: { id: string } }) {
  // 1. URL Parameter에서 ID 추출
  const userId = params.id;

  if (!userId) {
    return NextResponse.json({ error: '유효하지 않은 요청입니다.' }, { status: 400 });
  }

  try {
    await dbConnect(); // DB 연결

    // 2. 사용자 기본 정보 + 가용성 정보를 병렬 조회
    const [user, availability] = await Promise.all([
      User.findById(userId).select('-password').lean() as Promise<IUser | null>,
      Availability.findOne({ userId }).lean() as Promise<IAvailability | null>,
    ]);

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 4. Client가 사용하기 편한 형태로 데이터 구조화
    const profileData = {
      _id: user._id,
      nName: user.nName,
      avatarUrl: user.avatarUrl, // [Fix] 프로필 이미지 추가
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
      portfolioLinks: user.portfolioLinks || [],

      // [Fix] 기술 스택 및 깃허브 통계 정보 추가
      techTags: user.techTags || [],
      githubStats: user.githubStats || {
        followers: 0,
        following: 0,
        totalStars: 0,
        totalCommits: 0,
        totalPRs: 0,
        totalIssues: 0,
        contributions: 0,
        techStack: [],
      },
      level: user.level || 0,

      // [Fix] 서버 주도 계산: 프로필 완성도
      profileCompleteness: 0,
    };

    // Calculate completeness
    const { calculateProfileCompleteness } = await import('@/lib/profileUtils');
    profileData.profileCompleteness = calculateProfileCompleteness(profileData);

    return NextResponse.json({ success: true, data: profileData });
  } catch (error: unknown) {
    console.error('[API] Public Profile Fetch Error:', error);

    // ObjectId 형식이 아닐 때 발생하는 CastError 처리
    if (error instanceof Error && error.name === 'CastError') {
      return NextResponse.json({ error: '잘못된 사용자 ID 형식입니다.' }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: '서버 내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/users/[id]');
