import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NoteModel from '@/lib/models/kanban/NoteModel';

export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { updates } = body;

        if (!Array.isArray(updates)) {
            return NextResponse.json(
                { error: 'Updates must be an array' },
                { status: 400 }
            );
        }

        // Promise.all로 병렬 업데이트 처리
        // MongoDB bulkWrite를 사용하면 더 효율적일 수 있으나,
        // 현재 규모에서는 Promise.all로도 충분하며 구현이 간단함.
        // Mongoose의 bulkWrite를 사용하려면 updateOne 오퍼레이션을 배열로 만들어야 함.

        const bulkOps = updates.map((update: { id: string; changes: any }) => ({
            updateOne: {
                filter: { _id: update.id },
                update: { $set: update.changes },
            },
        }));

        if (bulkOps.length > 0) {
            await NoteModel.bulkWrite(bulkOps);
        }

        return NextResponse.json({ success: true, count: bulkOps.length });
    } catch (error) {
        console.error('Batch update failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { ids } = body;

        if (!Array.isArray(ids)) {
            return NextResponse.json(
                { error: 'IDs must be an array' },
                { status: 400 }
            );
        }

        if (ids.length > 0) {
            await NoteModel.deleteMany({ _id: { $in: ids } });
        }

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error('Batch delete failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
