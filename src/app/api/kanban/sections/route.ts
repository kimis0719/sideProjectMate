import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Section from '@/lib/models/kanban/SectionModel';
import Note from '@/lib/models/kanban/NoteModel';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const boardId = searchParams.get('boardId');

        if (!boardId) {
            return NextResponse.json({ success: false, error: 'Board ID is required' }, { status: 400 });
        }

        await dbConnect();
        const sections = await Section.find({ boardId }).lean();

        return NextResponse.json({ success: true, data: sections });
    } catch (error) {
        console.error('Failed to fetch sections:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch sections' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { boardId, title, x, y, width, height, color, zIndex } = body;

        if (!boardId) {
            return NextResponse.json({ success: false, error: 'Board ID is required' }, { status: 400 });
        }

        await dbConnect();

        // 1. 섹션 생성
        const newSection = await Section.create({
            boardId,
            title,
            x,
            y,
            width,
            height,
            color,
            zIndex,
        });

        // 2. Auto-Capture: 섹션 범위 내의 Orphan Note들을 찾아 sectionId 업데이트
        // Orphan Note: sectionId가 null이거나 없는 노트
        const left = x;
        const right = x + width;
        const top = y;
        const bottom = y + height;

        // 노트의 중심점이 섹션 안에 있으면 포함으로 간주 (또는 전체 포함 등 규칙에 따라 조정 가능)
        // 여기서는 단순화를 위해 노트의 (x, y) 좌표(좌상단)가 섹션 안에 있으면 포함으로 처리
        // 더 정교하게 하려면 노트의 width/height도 고려해야 함 (현재 노트 크기 200x140 고정 가정)
        const NOTE_WIDTH = 200;
        const NOTE_HEIGHT = 140;

        // MongoDB 쿼리로 범위 검색
        // Orphan 노트만 대상
        const updateResult = await Note.updateMany(
            {
                boardId,
                sectionId: null, // 이미 다른 섹션에 있는 건 건드리지 않음
                x: { $gte: left, $lte: right - NOTE_WIDTH / 2 }, // 노트의 중심이 섹션 안에 들어오도록 대략적 계산
                y: { $gte: top, $lte: bottom - NOTE_HEIGHT / 2 },
            },
            {
                $set: { sectionId: newSection._id },
            }
        );

        // 3. 캡처된 노트들의 ID 목록 반환 (클라이언트 상태 업데이트용)
        const capturedNoteIds = await Note.find({
            boardId,
            sectionId: newSection._id
        }).distinct('_id');

        return NextResponse.json({
            success: true,
            data: newSection,
            capturedCount: updateResult.modifiedCount,
            capturedNoteIds: capturedNoteIds,
        });
    } catch (error: any) {
        console.error('Failed to create section:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create section',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
