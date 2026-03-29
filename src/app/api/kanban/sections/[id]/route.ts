import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import dbConnect from '@/lib/mongodb';
import Section from '@/lib/models/kanban/SectionModel';
import Note from '@/lib/models/kanban/NoteModel';

// Helper to get ID from params
// Next.js 13+ Route Handlers dynamic params
// params is a Promise in recent versions, but usually passed as second arg
async function handlePatch(req: NextRequest, { params }: { params: { id: string } }) {
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
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const searchParams = req.nextUrl.searchParams;
    const deleteNotes = searchParams.get('deleteNotes') === 'true';

    await dbConnect();

    const section = await Section.findById(id);
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }

    // 자식 섹션 목록 조회
    const childSections = await Section.find({ parentSectionId: id }).lean();
    const childSectionIds = childSections.map((cs) => String(cs._id));

    // 1. 부모 섹션 삭제
    await Section.findByIdAndDelete(id);

    if (deleteNotes) {
      // 전체 삭제: 부모 노트 + 자식 섹션 + 자식 노트 모두 삭제
      await Note.deleteMany({ sectionId: id });
      if (childSectionIds.length > 0) {
        await Section.deleteMany({ _id: { $in: childSectionIds } });
        await Note.deleteMany({ sectionId: { $in: childSectionIds } });
      }
    } else {
      // 구조만 삭제: 부모 노트 고아화, 자식 섹션 최상위 승격, 자식 노트는 유지
      await Note.updateMany({ sectionId: id }, { $set: { sectionId: null } });
      if (childSectionIds.length > 0) {
        await Section.updateMany(
          { _id: { $in: childSectionIds } },
          { $set: { parentSectionId: null, depth: 0 } }
        );
        // 자식 섹션 노트는 그대로 유지 (sectionId는 자식 섹션 id 유지)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Section deleted',
      promotedChildIds: deleteNotes ? [] : childSectionIds,
    });
  } catch (error) {
    console.error('Failed to delete section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}

export const PATCH = withApiLogging(handlePatch, '/api/kanban/sections/[id]');
export const DELETE = withApiLogging(handleDelete, '/api/kanban/sections/[id]');
