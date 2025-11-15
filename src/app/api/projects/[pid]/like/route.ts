import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // 경로 수정
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';

export async function POST(
  request: Request,
  { params }: { params: { pid: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user._id) {
      return NextResponse.json(
        { success: false, message: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { pid } = params;
    const userId = session.user._id;

    const project = await Project.findOne({ pid: Number(pid) });

    if (!project) {
      return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const isLiked = project.likes.includes(userId);

    let update;
    if (isLiked) {
      update = { $pull: { likes: userId } };
    } else {
      update = { $addToSet: { likes: userId } };
    }

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      update,
      { new: true }
    )
    .populate('author', 'nName')
    .populate('tags');

    return NextResponse.json({ 
      success: true, 
      data: updatedProject,
      message: isLiked ? '좋아요를 취소했습니다.' : '좋아요를 눌렀습니다.'
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.', error: error.message },
      { status: 500 }
    );
  }
}
