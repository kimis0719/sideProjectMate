import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Note from '@/lib/models/kanban/NoteModel';

/**
 * 노트 일괄 삭제 API (POST /api/kanban/notes/batch-delete)
 * body: { noteIds: string[], boardId: string }
 */
export async function POST(request: Request) {
    try {
        await dbConnect();
        const { noteIds, boardId } = await request.json();

        if (!Array.isArray(noteIds) || noteIds.length === 0) {
            return NextResponse.json({ error: 'Invalid noteIds' }, { status: 400 });
        }

        // boardId 검증 (선택적이지만 안전을 위해)
        const query: any = { _id: { $in: noteIds } };
        if (boardId) {
            query.boardId = boardId;
        }

        const result = await Note.deleteMany(query);

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
            message: `${result.deletedCount} notes deleted`
        }, { status: 200 });
    } catch (error) {
        console.error('Failed to batch delete notes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
