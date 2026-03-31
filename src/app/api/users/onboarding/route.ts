import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handlePatch(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { step, data } = body;

    if (typeof step !== 'number' || step < 1 || step > 3) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 스텝입니다.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // 스텝별 데이터 저장
    if (step === 1 && data?.domains) {
      updateData.domains = data.domains;
    }
    if (step === 2) {
      if (data?.preference !== undefined) updateData['preference'] = data.preference;
      if (data?.personalityTags) updateData['personalityTags'] = data.personalityTags;
    }
    if (step === 3) {
      // AvailabilityScheduler 데이터는 별도 모델이므로 여기서는 onboardingStep만 갱신
    }

    // onboardingStep 갱신: 현재 스텝 + 1 (최대 4)
    updateData.onboardingStep = Math.min(step + 1, 4);

    await User.findByIdAndUpdate(session.user._id, { $set: updateData });

    return NextResponse.json({
      success: true,
      data: { onboardingStep: updateData.onboardingStep },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '온보딩 저장 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// 건너뛰기: onboardingStep = 4로 즉시 완료
async function handlePost(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    await dbConnect();
    await User.findByIdAndUpdate(session.user._id, { $set: { onboardingStep: 4 } });

    return NextResponse.json({
      success: true,
      data: { onboardingStep: 4 },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '온보딩 건너뛰기 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const PATCH = withApiLogging(handlePatch, '/api/users/onboarding');
export const POST = withApiLogging(handlePost, '/api/users/onboarding');
