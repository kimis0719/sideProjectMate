import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Counter from '@/lib/models/Counter';
import { headers } from 'next/headers';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handleGet(request: NextRequest) {
  headers();
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const skip = (page - 1) * limit;

    const searchTerm = searchParams.get('search');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'latest';
    const ownerId = searchParams.get('authorId') || searchParams.get('ownerId');
    const domain = searchParams.get('domain');
    const stage = searchParams.get('stage');
    const style = searchParams.get('style');
    const minHours = searchParams.get('minHours');

    const query: Record<string, unknown> = { delYn: { $ne: true } };
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { problemStatement: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (ownerId) {
      query.ownerId = ownerId;
    }

    if (domain) {
      query.domains = { $regex: domain, $options: 'i' };
    }

    if (stage) {
      const stages = stage.split(',');
      query.currentStage = { $in: stages };
    }

    if (style) {
      const styles = style.split(',');
      query.executionStyle = { $in: styles };
    }

    if (minHours) {
      query.weeklyHours = { $gte: Number(minHours) };
    }

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'deadline') {
      sortOptions = { deadline: 1 };
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'nName')
        .lean(),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        projects,
        total,
        page,
        limit,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트를 불러오는 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function handlePost(request: Request) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json(
        { success: false, message: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const {
      title,
      description,
      problemStatement,
      currentStage,
      executionStyle,
      weeklyHours,
      domains,
      lookingFor,
      maxMembers,
      overview,
      techStacks,
      durationMonths,
      links,
      status,
      deadline,
      images,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, message: '필수 입력 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    const ownerId = session.user._id;

    const counter = await Counter.findOneAndUpdate(
      { _id: 'project_pid' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const newProject = await Project.create({
      pid: counter!.seq,
      title,
      description,
      problemStatement,
      currentStage,
      executionStyle,
      ownerId,
      weeklyHours,
      domains: domains || [],
      lookingFor: lookingFor || [],
      maxMembers: maxMembers || 4,
      overview,
      techStacks: techStacks || [],
      durationMonths,
      links,
      deadline,
      images: images && images.length > 0 ? images : ['🚀'],
      status: status || 'recruiting',
      // 작성자를 첫 번째 멤버로 자동 등록
      members: [
        {
          userId: ownerId,
          role: 'member',
          status: 'active',
          joinedAt: new Date(),
        },
      ],
    });

    await newProject.populate({ path: 'ownerId', select: 'nName' });

    return NextResponse.json(
      { success: true, message: '프로젝트가 성공적으로 생성되었습니다.', data: newProject },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: '프로젝트 생성 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(handleGet, '/api/projects');
export const POST = withApiLogging(handlePost, '/api/projects');
