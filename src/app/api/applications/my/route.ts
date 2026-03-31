import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Application from '@/lib/models/Application';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function handleGet() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
  }

  await dbConnect();

  const applications = (await Application.find({
    applicantId: session.user._id,
    status: { $ne: 'withdrawn' },
  })
    .select('projectId status')
    .lean()) as unknown as { _id: unknown; projectId: unknown; status: string }[];

  // { projectId: { applicationId, status } } 맵 형태로 변환
  const myApplications: Record<string, { applicationId: string; status: string }> = {};
  for (const app of applications) {
    myApplications[String(app.projectId)] = {
      applicationId: String(app._id),
      status: app.status,
    };
  }

  return NextResponse.json({ success: true, data: myApplications });
}

export const GET = withApiLogging(handleGet, '/api/applications/my');
