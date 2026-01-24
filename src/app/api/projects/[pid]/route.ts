import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';
import ProjectMember from '@/lib/models/ProjectMember';
import User from '@/lib/models/User';
import TechStack from '@/lib/models/TechStack';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { pid: string } }
) {
  headers();
  try {
    await dbConnect();
    const { pid } = params;

    if (!pid) {
      return NextResponse.json({ success: false, message: 'Project ID가 필요합니다.' }, { status: 400 });
    }

    const project = await Project.findOneAndUpdate(
      { pid: Number(pid) },
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'nName authorEmail position career status introduction socialLinks githubStats techTags level avatarUrl')
      .populate('tags')
      .populate({
        path: 'projectMembers',
        strictPopulate: false, // 오류를 해결하기 위해 이 옵션을 추가
        populate: {
          path: 'userId',
          select: 'nName authorEmail position career status introduction socialLinks githubStats techTags level avatarUrl'
        }
      });

    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    console.error(`[API ERROR: GET /api/projects/${params.pid}]`, error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { pid: string } }
) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const project = await Project.findOne({ pid: Number(pid) });

    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (project.author.toString() !== session.user._id) {
      return NextResponse.json({ success: false, message: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트 수정 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { pid: string } }
) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const project = await Project.findOne({ pid: Number(pid) });

    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (project.author.toString() !== session.user._id) {
      return NextResponse.json({ success: false, message: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    await Project.findByIdAndDelete(project._id);

    return NextResponse.json({ success: true, message: '프로젝트가 삭제되었습니다.' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '프로젝트 삭제 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

// ✨ [PATCH] 프로젝트 상태 및 개요 부분 업데이트
export async function PATCH(
  request: Request,
  { params }: { params: { pid: string } }
) {
  headers();
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    await dbConnect();
    const { pid } = params;
    const project = await Project.findOne({ pid: Number(pid) });

    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 작성자 권한 체크
    if (project.author.toString() !== session.user._id) {
      return NextResponse.json({ success: false, message: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { status, overview } = body; // 업데이트할 필드만 추출

    // 상태값 유효성 검사 (변경 시에만)
    if (status && !['01', '02', '03'].includes(status)) {
      return NextResponse.json({ success: false, message: '유효하지 않은 상태 값입니다.' }, { status: 400 });
    }

    // 업데이트 객체 구성
    const updateData: any = {};
    if (status) updateData.status = status;
    if (overview !== undefined) updateData.overview = overview; // 빈 문자열 허용

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: '변경할 데이터가 없습니다.' }, { status: 400 });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: updatedProject });
  } catch (error: any) {
    console.error(`[API ERROR: PATCH /api/projects/${params.pid}]`, error);
    return NextResponse.json(
      { success: false, message: '프로젝트 수정 중 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
