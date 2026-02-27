import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Board from '@/lib/models/kanban/BoardModel';
import Project from '@/lib/models/Project';

export const dynamic = 'force-dynamic';

/**
 * 프로젝트 ID(pid)에 해당하는 보드를 조회하는 API (GET)
 * - pid에 해당하는 보드가 있으면 해당 보드를 반환합니다.
 * - 없으면 pid에 해당하는 프로젝트 정보로 새 보드를 생성합니다.
 * @param request - URL 쿼리 파라미터로 'pid'를 포함해야 합니다.
 * 예: /api/kanban/boards?pid=123
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pid = searchParams.get('pid');

  if (pid === null) {
    return NextResponse.json({ success: false, message: 'Project ID (pid)가 필요합니다.' }, { status: 400 });
  }

  const projectId = Number(pid);

  try {
    await dbConnect();

    // 1. pid로 보드를 찾습니다.
    let board = await Board.findOne({ pid: projectId });

    // 2. 보드를 찾지 못하면, 해당 pid를 가지는 프로젝트를 찾고
    // 해당 프로젝트의 정보로 새로운 보드를 생성합니다.
    if (!board) {
      const project = await Project.findOne({ pid: projectId });
      if (!project) {
        return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
      }

      board = await Board.create({
        pid: projectId,
        name: project.title,
        ownerId: project.author,
      });
    }

    return NextResponse.json({ success: true, data: board });
  } catch (error) {
    console.error('Failed to fetch board:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
