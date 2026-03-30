/* eslint-disable no-console */
/**
 * Phase 1 — M2: projectmembers 컬렉션 → projects.members embedded 통합
 *
 * 변경 내용:
 *   Before: projects.members = [{ role, current, max }]  (역할 슬롯)
 *   After:  projects.members = [{ userId, role, status, joinedAt }]  (실제 멤버)
 *
 * 실행 방법:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-phase1-m2-embed-members.ts
 *
 * 옵션:
 *   --dry-run   실제 변경 없이 변환 내용만 출력
 */

import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';

// ─── .env.local 파싱 ──────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
} else {
  console.warn('⚠️  .env.local 파일을 찾을 수 없습니다.');
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('\n🔍 [DRY RUN] 실제 변경 없이 변환 내용만 출력합니다.\n');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI가 설정되지 않았습니다.');
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });
  const db = mongoose.connection.db!;
  console.log('✅ DB 연결 성공\n');

  const projects = await db.collection('projects').find({}).toArray();
  const allMembers = await db.collection('projectmembers').find({}).toArray();

  console.log(`프로젝트: ${projects.length}개 / projectmembers: ${allMembers.length}개\n`);

  // projectId 기준으로 멤버 그룹핑
  const membersByProject = new Map<string, typeof allMembers>();
  for (const m of allMembers) {
    const key = m.projectId.toString();
    if (!membersByProject.has(key)) membersByProject.set(key, []);
    membersByProject.get(key)!.push(m);
  }

  let updated = 0;
  let skipped = 0;

  for (const project of projects) {
    const projectId = project._id.toString();
    const members = membersByProject.get(projectId) ?? [];

    // 현재 members 필드 (역할 슬롯) 출력
    const oldMembers = project.members ?? [];

    if (members.length === 0) {
      console.log(
        `  ↷ skip   pid=${project.pid ?? projectId}  (projectmembers 없음, 기존 슬롯 ${oldMembers.length}개 유지)`
      );
      skipped++;
      continue;
    }

    // 새 embedded 멤버 배열 구성
    const newMembers = members.map((m) => ({
      userId: new mongoose.Types.ObjectId(m.userId.toString()),
      role: m.role ?? 'member',
      status: m.status ?? 'active',
      joinedAt: m.createdAt ?? new Date(),
    }));

    if (isDryRun) {
      console.log(`  [DRY] pid=${project.pid ?? projectId}`);
      console.log(
        `        기존 슬롯: [${oldMembers.map((m: { role: string; current: number; max: number }) => `${m.role}(${m.current}/${m.max})`).join(', ')}]`
      );
      console.log(
        `        신규 멤버: [${newMembers.map((m) => `userId=${m.userId} role=${m.role} status=${m.status}`).join(', ')}]`
      );
    } else {
      await db
        .collection('projects')
        .updateOne({ _id: project._id }, { $set: { members: newMembers } });
      console.log(
        `  ✓ updated  pid=${project.pid ?? projectId}  슬롯 ${oldMembers.length}개 → 멤버 ${newMembers.length}명`
      );
    }
    updated++;
  }

  console.log('\n─────────────────────────');
  if (isDryRun) {
    console.log(`🔍 변환 예정: ${updated}개 프로젝트 / 스킵: ${skipped}개`);
  } else {
    console.log(`✅ 완료: ${updated}개 업데이트 / ${skipped}개 스킵`);
    console.log('\n다음 단계:');
    console.log('  - src/lib/models/ProjectMember.ts — deprecated 주석 추가');
    console.log('  - projectmembers 컬렉션은 Phase 7에서 drop (지금은 유지)');
  }
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
