import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Counter from '@/lib/models/Counter';
import TechStack from '@/lib/models/TechStack'; // TechStack 모델 import 추가

// 모든 프로젝트 목록을 가져오는 GET API
export async function GET() {
  try {
    await dbConnect();
    // populate('tags')를 사용해 TechStack의 실제 데이터를 함께 불러옴
    const projects = await Project.find({}).sort({ createdAt: -1 }).populate('tags');
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트를 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

// 새로운 프로젝트를 생성하는 POST API
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { title, category, content, members, images, tags } = body;

    // 필수 필드 검증
    if (!title || !content || !category || !members || !members.max) {
      return NextResponse.json(
        { success: false, message: '필수 입력 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // TODO: 인증 로직 추가 후, 실제 사용자 정보로 대체해야 함
    const author = '임시 작성자'; 

    // 새로운 프로젝트 ID 생성
    const counter = await Counter.findOneAndUpdate(
      { _id: 'project_pid' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const newProject = await Project.create({
      pid: counter!.seq,
      title,
      category,
      author,
      members, // { current, max } 객체
      images: images.length > 0 ? images : ['🚀'], // 이미지가 없으면 기본 이모지
      tags, // ObjectId 배열
      content,
      status: 'recruiting',
    });

    // 생성된 프로젝트 정보를 populate해서 반환
    const populatedProject = await Project.findById(newProject._id).populate('tags');

    return NextResponse.json(
      { success: true, message: '프로젝트가 성공적으로 생성되었습니다.', data: populatedProject },
      { status: 201 }
    );

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트 생성 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
