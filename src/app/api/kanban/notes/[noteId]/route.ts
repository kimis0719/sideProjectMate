import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Note from '@/lib/models/kanban/NoteModel';
import mongoose from 'mongoose';

/**
 * 특정 노트를 수정하는 API (PATCH)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const { noteId } = params;
  if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
    return NextResponse.json({ success: false, message: '유효하지 않은 노트 ID입니다.' }, { status: 400 });
  }

  try {
    await dbConnect();
    const patchData = await request.json();

    // id, boardId, createdAt, updatedAt 등 불변 필드는 업데이트에서 제외
    const { id, boardId, createdAt, updatedAt, ...updateFields } = patchData;

    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { $set: updateFields },
      { new: true, runValidators: true } // new: true는 업데이트된 문서를 반환, runValidators: true는 스키마 유효성 검사 실행
    );

    if (!updatedNote) {
      return NextResponse.json({ success: false, message: '노트를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedNote });
  } catch (error) {
    console.error(`Failed to update note ${noteId}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * 특정 노트를 삭제하는 API (DELETE)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { noteId: string } }
) {
  const { noteId } = params;
  if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
    return NextResponse.json({ success: false, message: '유효하지 않은 노트 ID입니다.' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return NextResponse.json({ success: false, message: '노트를 찾을 수 없거나 이미 삭제되었습니다.' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete note ${noteId}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
