import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import TechStack from '@/lib/models/TechStack'; // TechStack 모델 import 추가

// URL 파라미터를 받기 위한 컨텍스트 타입 정의
interface IParams {
  params: {
    pid: string;
  };
}

// 특정 pid를 가진 프로젝트 하나를 가져오는 GET API
export async function GET(request: Request, { params }: IParams) {
  const { pid } = params;

  try {
    await dbConnect();

    // pid는 문자열이므로 숫자로 변환해서 찾아야 함
    // .populate('tags')를 추가하여 기술 스택 정보를 함께 가져옴
    const project = await Project.findOne({ pid: Number(pid) }).populate('tags');

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: '해당 프로젝트를 찾을 수 없습니다.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트를 불러오는 중 오류가 발생했습니다.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
