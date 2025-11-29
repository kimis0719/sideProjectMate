import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/lib/models/wbs/TaskModel';

/**
 * PATCH /api/wbs/tasks/{taskId}
 * 특정 작업의 정보를 수정합니다.
 * 
 * @param request - Next.js 요청 객체 (body에 수정할 필드 포함)
 * @param params - URL 파라미터 ({ taskId })
 * @returns 수정된 작업 객체 (JSON)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        // MongoDB 연결
        await dbConnect();

        const { taskId } = params;

        // 요청 본문에서 수정할 필드 추출
        const body = await request.json();
        const updates = { ...body };

        // 날짜 검증: startDate와 endDate가 모두 있는 경우
        if (updates.startDate && updates.endDate) {
            const start = new Date(updates.startDate);
            const end = new Date(updates.endDate);
            if (end < start) {
                return NextResponse.json(
                    { success: false, message: '종료일은 시작일보다 이후여야 합니다.' },
                    { status: 400 }
                );
            }
        }

        // 작업 수정 (findByIdAndUpdate 사용)
        // new: true 옵션으로 수정된 문서를 반환
        // runValidators: true 옵션으로 스키마 검증 실행
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            updates,
            { new: true, runValidators: true }
        ).populate('assignee', 'nName email');

        // 작업이 존재하지 않는 경우
        if (!updatedTask) {
            return NextResponse.json(
                { success: false, message: '작업을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedTask, { status: 200 });
    } catch (error) {
        console.error('작업 수정 실패:', error);
        return NextResponse.json(
            { success: false, message: '작업 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/wbs/tasks/{taskId}
 * 특정 작업을 삭제합니다.
 * 
 * @param request - Next.js 요청 객체
 * @param params - URL 파라미터 ({ taskId })
 * @returns 삭제 성공 메시지 (JSON)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { taskId: string } }
) {
    try {
        // MongoDB 연결
        await dbConnect();

        const { taskId } = params;

        // 작업 삭제
        const deletedTask = await Task.findByIdAndDelete(taskId);

        // 작업이 존재하지 않는 경우
        if (!deletedTask) {
            return NextResponse.json(
                { success: false, message: '작업을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 이 작업을 선행 작업으로 참조하는 다른 작업들의 dependencies에서 제거
        await Task.updateMany(
            { dependencies: taskId },
            { $pull: { dependencies: taskId } }
        );

        return NextResponse.json(
            { success: true, message: '작업이 삭제되었습니다.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('작업 삭제 실패:', error);
        return NextResponse.json(
            { success: false, message: '작업 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
