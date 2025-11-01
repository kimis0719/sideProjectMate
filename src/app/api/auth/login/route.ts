import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { authorEmail, password } = await request.json();

    // 필수 필드 검증
    if (!authorEmail || !password) {
      return NextResponse.json(
        { success: false, error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 찾기
    const user = await User.findOne({ authorEmail: authorEmail.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 이메일입니다.' },
        { status: 401 }
      );
    }

    // 삭제된 계정 확인
    if (user.delYn) {
      return NextResponse.json(
        { success: false, error: '탈퇴한 계정입니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.authorEmail,
        memberType: user.memberType
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // 사용자 정보 (비밀번호 제외)
    const userResponse = {
      uid: user.uid,
      authorEmail: user.authorEmail,
      nName: user.nName,
      mblNo: user.mblNo,
      memberType: user.memberType,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error: any) {
    console.error('로그인 오류:', error);

    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
