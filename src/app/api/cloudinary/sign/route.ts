import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// Cloudinary 설정: 환경 변수에서 키를 가져옴
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return NextResponse.json(
        { success: false, message: '서명할 파라미터가 없습니다.' },
        { status: 400 }
      );
    }

    // Cloudinary 유틸리티를 사용해 서명 생성
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({ success: true, signature });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '이미지 업로드 서명 생성에 실패했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
