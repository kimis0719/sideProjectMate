import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Project from '@/lib/models/Project';
import ProjectApiKey from '@/lib/models/ProjectApiKey';
import { buildProjectContext } from '@/lib/utils/context/buildProjectContext';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { pid: string } }
) {
  const pid = parseInt(params.pid, 10);
  if (isNaN(pid)) {
    return NextResponse.json({ success: false, message: '잘못된 프로젝트 ID입니다.' }, { status: 400 });
  }

  await dbConnect();

  // ── 인증: 세션 or API 키 ──────────────────────────────
  const session = await getServerSession(authOptions);
  let authorized = false;

  if (session?.user?._id) {
    // 세션 인증: 프로젝트 소유자 또는 활성 멤버
    const project = await Project.findOne({ pid, delYn: false })
      .select('ownerId members')
      .lean();

    if (project) {
      const userId = session.user._id;
      const isOwner = project.ownerId.toString() === userId;
      const isMember = project.members.some(
        (m) => m.userId.toString() === userId && m.status === 'active'
      );
      authorized = isOwner || isMember;
    }
  }

  if (!authorized) {
    // API 키 인증: ?key=spm_xxx 또는 Authorization: Bearer spm_xxx
    const keyFromQuery = request.nextUrl.searchParams.get('key');
    const authHeader = request.headers.get('authorization');
    const keyFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const apiKey = keyFromQuery || keyFromHeader;

    if (apiKey) {
      const keyDoc = await ProjectApiKey.findOne({ key: apiKey, pid, isRevoked: false }).lean();
      if (keyDoc) {
        authorized = true;
        // lastUsedAt 업데이트 (fire-and-forget)
        ProjectApiKey.updateOne({ _id: keyDoc._id }, { lastUsedAt: new Date() }).catch(() => {});
      }
    }
  }

  if (!authorized) {
    return NextResponse.json(
      { success: false, message: '인증이 필요합니다. 세션 로그인 또는 유효한 API 키를 사용하세요.' },
      { status: 401 }
    );
  }

  // ── 컨텍스트 생성 ────────────────────────────────────
  const markdown = await buildProjectContext(pid);
  if (!markdown) {
    return NextResponse.json({ success: false, message: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
  }

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Context-Generated-At': new Date().toISOString(),
    },
  });
}
