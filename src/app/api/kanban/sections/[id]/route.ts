import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Section from '@/lib/models/kanban/SectionModel';
import Note from '@/lib/models/kanban/NoteModel';

// Helper to get ID from params
// Next.js 13+ Route Handlers dynamic params
// params is a Promise in recent versions, but usually passed as second arg
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();

        await dbConnect();

        const updatedSection = await Section.findByIdAndUpdate(id, body, { new: true }).lean();

        if (!updatedSection) {
            return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedSection });
    } catch (error) {
        console.error('Failed to update section:', error);
        return NextResponse.json({ success: false, error: 'Failed to update section' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const searchParams = req.nextUrl.searchParams;
        const deleteNotes = searchParams.get('deleteNotes') === 'true';

        await dbConnect();

        const section = await Section.findById(id);
        if (!section) {
            return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
        }

        // 1. 섹션 삭제
        await Section.findByIdAndDelete(id);

        // 2. 하위 노트 처리
        if (deleteNotes) {
            // 옵션 2: 모두 삭제
            await Note.deleteMany({ sectionId: id });
        } else {
            // 옵션 1: 섹션만 삭제 (노트는 Orphan 처리)
            await Note.updateMany({ sectionId: id }, { $set: { sectionId: null } });
        }

        return NextResponse.json({ success: true, message: 'Section deleted' });
    } catch (error) {
        console.error('Failed to delete section:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete section' }, { status: 500 });
    }
}
