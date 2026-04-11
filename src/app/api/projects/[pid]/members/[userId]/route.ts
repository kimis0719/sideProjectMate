import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import Application from '@/lib/models/Application';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

// DELETE /api/projects/[pid]/members/[userId] — 프로젝트 오너가 멤버 강퇴
async function handleDelete(
  _request: NextRequest,
  { params }: { params: { pid: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  const project = await Project.findOne({ pid: Number(params.pid) });
  if (!project) {
    return NextResponse.json(
      { success: false, message: '프로젝트를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 오너만 강퇴 가능
  if (project.ownerId.toString() !== session.user._id) {
    return NextResponse.json(
      { success: false, message: '프로젝트 오너만 멤버를 강퇴할 수 있습니다.' },
      { status: 403 }
    );
  }

  // 본인을 강퇴할 수 없음
  if (params.userId === session.user._id) {
    return NextResponse.json(
      { success: false, message: '본인을 강퇴할 수 없습니다.' },
      { status: 400 }
    );
  }

  // members 배열에서 제거
  const result = await Project.updateOne(
    { _id: project._id },
    { $pull: { members: { userId: params.userId } } }
  );

  if (result.modifiedCount === 0) {
    return NextResponse.json(
      { success: false, message: '해당 멤버를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  // 해당 유저의 Application status를 rejected로 변경
  await Application.updateMany(
    { projectId: project._id, applicantId: params.userId, status: 'accepted' },
    { $set: { status: 'rejected' } }
  );

  return NextResponse.json({
    success: true,
    message: '멤버가 프로젝트에서 제거되었습니다.',
  });
}

export const DELETE = withApiLogging(handleDelete, '/api/projects/[pid]/members/[userId]');
