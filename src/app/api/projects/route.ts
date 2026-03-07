import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Counter from '@/lib/models/Counter';
import TechStack from '@/lib/models/TechStack';
import ProjectMember from '@/lib/models/ProjectMember';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  headers();
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const skip = (page - 1) * limit;

    const searchTerm = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'latest';
    const authorId = searchParams.get('authorId');

    const query: any = { delYn: { $ne: true } };
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    // 카테고리와 상태는 이제 코드로 직접 조회
    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    if (authorId) {
      query.author = authorId;
    }

    const memberId = searchParams.get('memberId');
    if (memberId) {
      const memberProjects = await ProjectMember.find({ userId: memberId, status: 'active' }).distinct('projectId');
      query._id = { $in: memberProjects };
    }

    let sortOptions: any = { createdAt: -1 };
    if (sortBy === 'deadline') {
      sortOptions = { deadline: 1 };
    }

    const projects = await Project.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('author', 'nName')
      .populate('tags');

    const total = await Project.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        projects,
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트를 불러오는 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { title, category, content, members, deadline, images, tags } = body;

    if (!title || !content || !category || !members || members.length === 0) {
      return NextResponse.json({ success: false, message: '필수 입력 항목이 누락되었습니다.' }, { status: 400 });
    }

    const authorId = session.user._id;

    const counter = await Counter.findOneAndUpdate(
      { _id: 'project_pid' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const newProject = await Project.create({
      pid: counter!.seq,
      title,
      category,
      author: authorId,
      members,
      deadline,
      images: images && images.length > 0 ? images : ['🚀'],
      tags,
      content,
      status: '01', // 01: 모집중
    });

    // 작성자를 프로젝트 멤버로 자동 등록
    try {
      await ProjectMember.create({
        projectId: newProject._id,
        userId: session.user._id,
        role: '작성자',
        status: 'active',
      });
    } catch (memberError: any) {
      console.error('[ERROR] Failed to add author to ProjectMember:', memberError);
      // 멤버 등록 실패 시에도 프로젝트 생성은 성공으로 처리하되, 에러 로그는 남김
    }

    const populatedProject = await Project.findById(newProject._id)
      .populate('author', 'nName')
      .populate('tags');

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
