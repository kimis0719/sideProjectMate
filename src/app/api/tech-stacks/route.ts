import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TechStack from '@/lib/models/TechStack';

// 모든 기술 스택 목록을 가져오는 GET API
export async function GET() {
  try {
    await dbConnect();

    const techStacks = await TechStack.find({}).sort({ category: 1, name: 1 });

    return NextResponse.json({
      success: true,
      data: techStacks,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: '기술 스택을 불러오는 중 오류가 발생했습니다.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
