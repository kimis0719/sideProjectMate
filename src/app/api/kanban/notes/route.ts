import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Note from '@/lib/models/kanban/NoteModel';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * 특정 보드의 모든 노트를 조회하는 API (GET)
 * @param request - URL 쿼리 파라미터로 'boardId'를 포함해야 합니다.
 * 예: /api/kanban/notes?boardId=65a...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const boardId = searchParams.get('boardId');

  if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
    return NextResponse.json({ error: 'A valid boardId is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const notes = await Note.find({ boardId }).sort({ createdAt: 1 });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, x, y, color, width, height, boardId, sectionId, tags, dueDate, assigneeId } = body;

    if (!boardId || !text || x === undefined || y === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json(savedNote, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
