import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';
import { fetchOGMetadata, validateResource } from '@/lib/utils/resourceUtils';

export const dynamic = 'force-dynamic';

// 리소스 추가
export async function POST(
    request: Request,
    { params }: { params: { pid: string } }
) {
    headers();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        await dbConnect();
        const { pid } = params;

        // 프로젝트 조회 및 권한 확인
        const project = await Project.findOne({ pid: Number(pid) });
        if (!project) {
            return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (project.author.toString() !== session.user._id) {
            return NextResponse.json({ success: false, message: '수정 권한이 없습니다.' }, { status: 403 });
        }

        const body = await request.json();
        const { type, category, content, metadata } = body;

        // 1. 유효성 검사 (유틸리티 사용)
        const validation = validateResource(type, category, content);
        if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
        }

        // 2. 메타데이터 처리 (LINK 타입인 경우 OG 정보 자동 수집)
        let finalMetadata = metadata || {};
        if (type === 'LINK') {
            const ogData = await fetchOGMetadata(content);
            finalMetadata = { ...ogData, ...finalMetadata };
        }

        const updatedProject = await Project.findByIdAndUpdate(
            project._id,
            {
                $push: {
                    resources: {
                        type,
                        category,
                        content,
                        metadata: finalMetadata,
                    },
                },
            },
            { new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, data: updatedProject.resources });
    } catch (error: any) {
        console.error(`[API ERROR: POST /api/projects/${params.pid}/resources]`, error);
        return NextResponse.json(
            { success: false, message: '리소스 추가 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}

// 리소스 삭제
export async function DELETE(
    request: Request,
    { params }: { params: { pid: string } }
) {
    headers();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const resourceId = searchParams.get('resourceId');

        if (!resourceId) {
            return NextResponse.json({ success: false, message: 'Resource ID가 필요합니다.' }, { status: 400 });
        }

        await dbConnect();
        const { pid } = params;

        // 프로젝트 조회 및 권한 확인
        const project = await Project.findOne({ pid: Number(pid) });
        if (!project) {
            return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (project.author.toString() !== session.user._id) {
            return NextResponse.json({ success: false, message: '삭제 권한이 없습니다.' }, { status: 403 });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            project._id,
            {
                $pull: {
                    resources: { _id: resourceId },
                },
            },
            { new: true }
        );

        return NextResponse.json({ success: true, message: '리소스가 삭제되었습니다.', data: updatedProject.resources });
    } catch (error: any) {
        console.error(`[API ERROR: DELETE /api/projects/${params.pid}/resources]`, error);
        return NextResponse.json(
            { success: false, message: '리소스 삭제 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}
