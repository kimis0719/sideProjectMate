import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/lib/models/wbs/TaskModel';

/**
 * PATCH /api/wbs/tasks/batch
 * 여러 작업을 한 번에 수정합니다.
 * 간트차트에서 드래그로 여러 작업의 날짜를 동시에 변경할 때 사용합니다.
 * 
 * @param request - Next.js 요청 객체 (body에 updates 배열 포함)
 * @returns 수정 성공 메시지 (JSON)
 */
export async function PATCH(request: NextRequest) {
    try {
        // MongoDB 연결
        await dbConnect();

        // 요청 본문에서 updates 배열 추출
        // updates 형식: [{ id: 'taskId1', changes: { startDate: '...', endDate: '...' } }, ...]
        const body = await request.json();
        const { updates } = body;

        // updates 배열이 없거나 비어있는 경우
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json(
                { success: false, message: 'updates 배열이 필요합니다.' },
                { status: 400 }
            );
        }

        // 각 작업을 순회하며 수정
        const updatePromises = updates.map(async ({ id, changes }) => {
            // 날짜 검증: startDate와 endDate가 모두 있는 경우
            if (changes.startDate && changes.endDate) {
                const start = new Date(changes.startDate);
                const end = new Date(changes.endDate);
                if (end < start) {
                    throw new Error(`작업 ${id}: 종료일은 시작일보다 이후여야 합니다.`);
                }
            }

            // 작업 수정
            return Task.findByIdAndUpdate(
                id,
                changes,
                { new: true, runValidators: true }
            );
        });

        // 모든 수정 작업을 병렬로 실행
        await Promise.all(updatePromises);

        return NextResponse.json(
            { success: true, message: '작업들이 성공적으로 수정되었습니다.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('일괄 작업 수정 실패:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : '일괄 작업 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/wbs/tasks/batch
 * 여러 작업을 한 번에 삭제합니다.
 * 
 * @param request - Next.js 요청 객체 (body에 ids 배열 포함)
 * @returns 삭제 성공 메시지 (JSON)
 */
export async function DELETE(request: NextRequest) {
    try {
        // MongoDB 연결
        await dbConnect();

        // 요청 본문에서 ids 배열 추출
        const body = await request.json();
        const { ids } = body;

        // ids 배열이 없거나 비어있는 경우
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'ids 배열이 필요합니다.' },
                { status: 400 }
            );
        }

        // 여러 작업을 한 번에 삭제
        const result = await Task.deleteMany({ _id: { $in: ids } });

        // 삭제된 작업들을 선행 작업으로 참조하는 다른 작업들의 dependencies에서 제거
        await Task.updateMany(
            { dependencies: { $in: ids } },
            { $pull: { dependencies: { $in: ids } } }
        );

        return NextResponse.json(
            {
                success: true,
                message: `${result.deletedCount}개의 작업이 삭제되었습니다.`,
                deletedCount: result.deletedCount
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('일괄 작업 삭제 실패:', error);
        return NextResponse.json(
            { success: false, message: '일괄 작업 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
