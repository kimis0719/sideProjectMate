import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/lib/models/Project';
import { headers } from 'next/headers';
import mongoose from 'mongoose';
import { fetchOGMetadata, validateResource } from '@/lib/utils/resourceUtils';

export const dynamic = 'force-dynamic';

// 리소스 수정
export async function PUT(
    request: Request,
    { params }: { params: { pid: string } }
) {
    headers();
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?._id) {
            return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
        }

        const body = await request.json();
        const { resourceId, content, category, type, metadata } = body;

        if (!resourceId) {
            return NextResponse.json({ success: false, message: 'Resource ID가 필요합니다.' }, { status: 400 });
        }

        await dbConnect();
        const { pid } = params;

        // 프로젝트 조회
        const project = await Project.findOne({ pid: Number(pid) });
        if (!project) {
            return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 해당 리소스 확인
        const resource = project.resources.id(resourceId);
        if (!resource) {
            return NextResponse.json({ success: false, message: '리소스를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 권한 확인: 프로젝트 생성자(PM) 이거나 리소스 등록자 본인만 수정 가능
        const isProjectAuthor = project.author.toString() === session.user._id;
        const isResourceOwner = resource.userId?.toString() === session.user._id;

        if (!isProjectAuthor && !isResourceOwner) {
            return NextResponse.json({ success: false, message: '수정 권한이 없습니다. (본인이 등록한 자산만 수정 가능)' }, { status: 403 });
        }

        // 리소스 업데이트
        const updateFields: any = {
            'resources.$.content': content,
            'resources.$.category': category,
        };
        if (metadata) {
            updateFields['resources.$.metadata'] = metadata;
        }

        // * 주의: userId는 변경하지 않음 (최초 등록자 유지)

        const updatedProject = await Project.findOneAndUpdate(
            { _id: project._id, 'resources._id': resourceId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return NextResponse.json({ success: true, message: '리소스가 수정되었습니다.', data: updatedProject.resources });
    } catch (error: any) {
        console.error(`[API ERROR: PUT /api/projects/${params.pid}/resources]`, error);
        return NextResponse.json(
            { success: false, message: '리소스 수정 중 오류가 발생했습니다.', error: error.message },
            { status: 500 }
        );
    }
}

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

        // 프로젝트 조회
        const project = await Project.findOne({ pid: Number(pid) });
        if (!project) {
            return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 권한 확인: 프로젝트 멤버라면 누구나 등록 가능!
        // 1. 프로젝트 생성자(PM)인지 확인 (패스)
        // 2. 멤버 리스트(ProjectMember)에 있는지 확인
        const isProjectAuthor = project.author.toString() === session.user._id;

        // * ProjectMember 모델을 동적 import 하거나 상단에서 import 필요 (여기서는 상단 추가 가정하거나 직접 쿼리)
        // 간단하게 ProjectMember collection 직접 조회
        const isMember = await mongoose.model('ProjectMember').exists({
            projectId: project._id,
            userId: session.user._id,
            status: 'active'
        });

        if (!isProjectAuthor && !isMember) {
            return NextResponse.json({ success: false, message: '프로젝트 멤버만 자산을 등록할 수 있습니다.' }, { status: 403 });
        }

        const body = await request.json();
        const { type, category, content, metadata } = body;

        // 1. 유효성 검사
        const validation = validateResource(type, category, content);
        if (!validation.valid) {
            return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
        }

        // 2. 메타데이터 처리
        let finalMetadata = metadata || {};
        if (type === 'LINK') {
            const ogData = await fetchOGMetadata(content);
            finalMetadata = { ...ogData, ...finalMetadata };
        }

        // 3. 리소스 추가 (userId 포함!)
        const updatedProject = await Project.findByIdAndUpdate(
            project._id,
            {
                $push: {
                    resources: {
                        type,
                        category,
                        content,
                        metadata: finalMetadata,
                        userId: session.user._id, // ✨ 등록자 ID 저장
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

        // 프로젝트 조회
        const project = await Project.findOne({ pid: Number(pid) });
        if (!project) {
            return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
        }

        // 해당 리소스 확인
        const resource = project.resources.id(resourceId);
        if (!resource) {
            return NextResponse.json({ success: false, message: '이미 삭제되었거나 존재하지 않는 리소스입니다.' }, { status: 404 });
        }

        // 권한 확인
        // 1. 프로젝트 생성자(PM): 모든 리소스 삭제 가능
        // 2. 리소스 등록자(Owner): 본인 리소스만 삭제 가능
        const isProjectAuthor = project.author.toString() === session.user._id;
        const isResourceOwner = resource.userId?.toString() === session.user._id;

        // 기존 데이터 호환성: userId가 없는 레거시 데이터는 PM만 삭제 가능
        if (!isProjectAuthor && !isResourceOwner) {
            return NextResponse.json({ success: false, message: '삭제 권한이 없습니다. (본인이 등록한 자산만 삭제 가능)' }, { status: 403 });
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
