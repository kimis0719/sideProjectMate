import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Project from '@/lib/models/Project';
import ProjectApiKey from '@/lib/models/ProjectApiKey';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

/** 소유자 확인 헬퍼 */
async function verifyOwner(pid: number, userId: string) {
  const project = await Project.findOne({ pid, delYn: false }).select('ownerId').lean();
  if (!project) return null;
  if (project.ownerId.toString() !== userId) return null;
  return project;
}

/** GET: 키 메타데이터 조회 (키 값 미포함) */
async function _GET(
  _req: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = parseInt(params.pid, 10);
  if (isNaN(pid)) {
    return NextResponse.json({ success: false, message: '잘못된 프로젝트 ID입니다.' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  if (!(await verifyOwner(pid, session.user._id))) {
    return NextResponse.json({ success: false, message: '소유자만 API 키를 관리할 수 있습니다.' }, { status: 403 });
  }

  const keyDoc = await ProjectApiKey.findOne({ pid, isRevoked: false })
    .select('createdAt lastUsedAt')
    .lean();

  return NextResponse.json({
    success: true,
    data: {
      exists: !!keyDoc,
      createdAt: keyDoc?.createdAt ?? null,
      lastUsedAt: keyDoc?.lastUsedAt ?? null,
    },
  });
}

/** POST: 새 키 생성 (기존 키 자동 revoke) */
async function _POST(
  _req: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = parseInt(params.pid, 10);
  if (isNaN(pid)) {
    return NextResponse.json({ success: false, message: '잘못된 프로젝트 ID입니다.' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  if (!(await verifyOwner(pid, session.user._id))) {
    return NextResponse.json({ success: false, message: '소유자만 API 키를 생성할 수 있습니다.' }, { status: 403 });
  }

  // 기존 활성 키 revoke
  await ProjectApiKey.updateMany({ pid, isRevoked: false }, { isRevoked: true });

  // 새 키 생성: "spm_" + 64자 hex (256-bit entropy)
  const rawKey = crypto.randomBytes(32).toString('hex');
  const newKey = `spm_${rawKey}`;

  await ProjectApiKey.create({
    pid,
    key: newKey,
    createdBy: session.user._id,
  });

  // ⚠️ 키 값은 이 응답에서만 노출됨 — 이후 GET에서는 반환하지 않음
  return NextResponse.json({
    success: true,
    data: { key: newKey },
  });
}

/** DELETE: 현재 키 revoke */
async function _DELETE(
  _req: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = parseInt(params.pid, 10);
  if (isNaN(pid)) {
    return NextResponse.json({ success: false, message: '잘못된 프로젝트 ID입니다.' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  if (!(await verifyOwner(pid, session.user._id))) {
    return NextResponse.json({ success: false, message: '소유자만 API 키를 폐기할 수 있습니다.' }, { status: 403 });
  }

  const result = await ProjectApiKey.updateMany({ pid, isRevoked: false }, { isRevoked: true });

  if (result.modifiedCount === 0) {
    return NextResponse.json({ success: false, message: '활성 API 키가 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'API 키가 폐기되었습니다.' });
}

export const GET = withApiLogging(_GET, '/api/projects/[pid]/api-key');
export const POST = withApiLogging(_POST, '/api/projects/[pid]/api-key');
export const DELETE = withApiLogging(_DELETE, '/api/projects/[pid]/api-key');
