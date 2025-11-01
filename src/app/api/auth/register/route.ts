import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

interface RegisterRequestBody {
  authorEmail: string;
  password: string;
  nName?: string;
  mblNo?: string;
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body: RegisterRequestBody = await request.json();
    const { authorEmail, password, nName, mblNo } = body;

    // 필수 필드 검증
    if (!authorEmail || !password) {
      return NextResponse.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증(기본 검증)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 새로운 uid 생성(counters 컬렉션 사용)
    const Counter = (await import('@/lib/models/Counter')).default;
    const counter = await Counter.findOneAndUpdate(
      { _id: 'member_uid' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // 사용자 생성
    const user = await User.create({
      authorEmail,
      password,
      nName: nName || '',
      mblNo: mblNo || '',
      uid: counter.seq,
    });

    // 비밀번호 제외하고 응답
    const userResponse = {
      uid: user.uid,
      authorEmail: user.authorEmail,
      nName: user.nName,
      mblNo: user.mblNo,
      memberType: user.memberType,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: '회원가입이 성공적으로 완료되었습니다.',
        data: userResponse
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('회원가입 오류:', error);

    // 중복 이메일 확인
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 이메일입니다.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
