import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Task from '@/lib/models/wbs/TaskModel';

/**
 * GET /api/wbs/tasks?pid={pid}
 * 특정 프로젝트의 모든 작업 목록을 조회합니다.
 * 
 * @param request - Next.js 요청 객체
 * @returns 작업 목록 배열 (JSON)
 */
export async function GET(request: NextRequest) {
    try {
        // MongoDB 연결
        await dbConnect();

        // URL에서 pid 파라미터 추출
        const { searchParams } = new URL(request.url);
        const pid = searchParams.get('pid');

        // pid가 없으면 에러 응답
        if (!pid) {
            return NextResponse.json(
                { success: false, message: 'pid 파라미터가 필요합니다.' },
                { status: 400 }
            );
        }

        // 해당 프로젝트의 모든 작업을 조회
        // startDate 기준으로 오름차순 정렬 (간트차트에서 시간 순서대로 표시)
        // assignee 필드를 populate하여 담당자 정보도 함께 가져옴
        const tasks = await Task.find({ pid: parseInt(pid) })
            .populate('assignee', 'nName email')  // 담당자의 이름과 이메일만 가져옴
            .sort({ startDate: 1 });

        return NextResponse.json(tasks, { status: 200 });
    } catch (error) {
        console.error('작업 목록 조회 실패:', error);
        return NextResponse.json(
            { success: false, message: '작업 목록 조회에 실패했습니다.' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/wbs/tasks
 * 새로운 작업을 생성합니다.
 * 
 * @param request - Next.js 요청 객체 (body에 작업 정보 포함)
 * @returns 생성된 작업 객체 (JSON)
 */
export async function POST(request: NextRequest) {
    try {
        // MongoDB 연결
        await dbConnect();

        // 요청 본문에서 작업 정보 추출
        const body = await request.json();
        const { pid, title, description, assignee, startDate, endDate, status, progress, dependencies, phase, milestone } = body;

        // 필수 필드 검증
        if (!pid || !title || !assignee || !startDate || !endDate) {
            return NextResponse.json(
                { success: false, message: '필수 필드가 누락되었습니다. (pid, title, assignee, startDate, endDate)' },
                { status: 400 }
            );
        }

        // 날짜 검증: 종료일이 시작일보다 이전인지 확인
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            return NextResponse.json(
                { success: false, message: '종료일은 시작일보다 이후여야 합니다.' },
                { status: 400 }
            );
        }

        // 새 작업 생성
        const newTask = await Task.create({
            pid,
            title,
            description: description || '',
            assignee,
            startDate: start,
            endDate: end,
            status: status || 'todo',
            progress: progress || 0,
            dependencies: dependencies || [],
            phase: phase || '기본',
            milestone: milestone || false,
        });

        // 생성된 작업을 populate하여 담당자 정보와 함께 반환
        const populatedTask = await Task.findById(newTask._id).populate('assignee', 'nName email');

        return NextResponse.json(populatedTask, { status: 201 });
    } catch (error) {
        console.error('작업 생성 실패:', error);
        return NextResponse.json(
            { success: false, message: '작업 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
