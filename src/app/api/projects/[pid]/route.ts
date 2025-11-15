import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';

export const dynamic = 'force-dynamic';

// 프로젝트 상세 정보 가져오기
export async function GET(
  request: Request,
  { params }: { params: { pid: string } }
) {
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
    .populate('author', 'nName')
    .populate('tags');

    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}

// 프로젝트 수정하기
export async function PUT(
  request: Request,
  { params }: { params: { pid: string } }
) {
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

// 프로젝트 삭제하기
export async function DELETE(
  request: Request,
  { params }: { params: { pid: string } }
) {
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
