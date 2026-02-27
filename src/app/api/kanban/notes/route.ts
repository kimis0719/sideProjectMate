import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Note from '@/lib/models/kanban/NoteModel';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * 특정 보드의 모든 노트를 조회하는 API (GET)
 * @param request - URL 쿼리 파라미터로 'boardId'를 포함해야 합니다.
 * 예: /api/kanban/notes?boardId=65a...
 */
export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?._id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
      return NextResponse.json({ success: false, message: '유효한 boardId가 필요합니다.' }, { status: 400 });
    }

    const notes = await Note.find({ boardId }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * 새 노트를 생성하는 API (POST)
 */
export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { text, x, y, color, width, height, boardId, sectionId, tags, dueDate, assigneeId } = body;

    if (!boardId || !text || x === undefined || y === undefined) {
      return NextResponse.json({ success: false, message: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const newNote = new Note({
      text: text || '새 노트',
      x: x || 0,
      y: y || 0,
      color: color || '#FFFB8F',
      width: width || 200,
      height: height || 140,
      tags: tags || [],
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
      creatorId: session.user._id, // 생성자 ID 저장
      updaterId: session.user._id, // 초기 수정자도 생성자와 동일
      boardId,
      sectionId: sectionId || null,
    });

    const savedNote = await newNote.save();

    return NextResponse.json({ success: true, data: savedNote }, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
