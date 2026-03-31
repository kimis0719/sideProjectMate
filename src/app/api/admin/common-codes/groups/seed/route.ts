import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CommonCodeGroup from '@/lib/models/CommonCodeGroup';
import { requireAdmin } from '@/lib/adminAuth';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

const SEED_DATA = [
  { group: 'DOMAIN', groupName: '도메인', order: 1, isActive: true },
  { group: 'LOOKING_FOR', groupName: '찾는 사람', order: 2, isActive: true },
  { group: 'WORK_STYLE', groupName: '작업 스타일', order: 3, isActive: true },
  { group: 'PROJECT_STAGE', groupName: '프로젝트 단계', order: 4, isActive: true },
  { group: 'EXECUTION_STYLE', groupName: '실행 방식', order: 5, isActive: true },
  { group: 'POSITION', groupName: '직군', order: 10, isActive: false },
  { group: 'PROJECT_CATEGORY', groupName: '프로젝트 카테고리', order: 11, isActive: false },
  { group: 'CAREER', groupName: '경력', order: 12, isActive: false },
  { group: 'CATEGORY', groupName: '카테고리 (레거시)', order: 13, isActive: false },
];

async function handlePost() {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();

  let created = 0;
  let skipped = 0;

  for (const seed of SEED_DATA) {
    const exists = await CommonCodeGroup.findOne({ group: seed.group });
    if (exists) {
      skipped++;
      continue;
    }
    await CommonCodeGroup.create(seed);
    created++;
  }

  return NextResponse.json({
    success: true,
    message: `Seed 완료: ${created}개 생성, ${skipped}개 이미 존재`,
  });
}

export const POST = withApiLogging(handlePost, '/api/admin/common-codes/groups/seed');
