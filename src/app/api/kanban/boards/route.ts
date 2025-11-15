import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Board from '@/lib/models/kanban/BoardModel';

/**
 * 프로젝트 ID(pid)에 해당하는 보드를 조회하는 API (GET)
 * - pid에 해당하는 보드가 있으면 해당 보드를 반환합니다.
 * - 없으면 pid: 0 (공용 보드)를 찾거나, 없으면 새로 생성하여 반환합니다.
 * @param request - URL 쿼리 파라미터로 'pid'를 포함해야 합니다.
 * 예: /api/kanban/boards?pid=123
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pid = searchParams.get('pid');

  if (pid === null) {
    return NextResponse.json({ error: 'Project ID (pid) is required' }, { status: 400 });
  }

  const projectId = Number(pid);

  try {
    await dbConnect();

    // 1. pid로 보드를 찾습니다.
    let board = await Board.findOne({ pid: projectId });

    // 2. 보드를 찾지 못하면, 공용 보드(pid: 0)를 찾거나 생성합니다.
    if (!board) {
      board = await Board.findOneAndUpdate(
        { pid: 0 },
        {
          $setOnInsert: {
            pid: 0,
            name: '공용 보드',
            ownerId: 'system', // 시스템 소유로 지정
          },
        },
        {
          upsert: true, // 없으면 새로 생성
          new: true, // 생성되거나 찾아진 문서를 반환
        }
      );
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Failed to fetch board:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
