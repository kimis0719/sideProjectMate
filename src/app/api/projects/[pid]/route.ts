import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';
import ProjectMember from '@/lib/models/ProjectMember'; // ProjectMember 모델 import

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
    .populate('author', 'nName')
    .populate('tags')
    .populate({ // projectMembers 가상 필드 populate
      path: 'projectMembers',
      populate: {
        path: 'userId',
        select: 'nName authorEmail'
      }
    });

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

// ... (PUT, DELETE 핸들러는 변경 없음)
