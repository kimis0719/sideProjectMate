/* eslint-disable no-console */
/**
 * Phase 1 CP-1-1: status 값 마이그레이션
 * projects.status:   '01' → 'recruiting', '02' → 'in_progress', '03' → 'completed'
 * commoncodes STATUS: 동일한 코드값 업데이트
 *
 * 실행 방법:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-phase1-cp1-status.ts
 *
 * 옵션:
 *   --dry-run   실제 변경 없이 현황만 출력
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

const STATUS_MAP: Record<string, string> = {
  '01': 'recruiting',
  '02': 'in_progress',
  '03': 'completed',
};

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  if (isDryRun) console.log('[DRY-RUN] 실제 변경 없음\n');

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI 환경변수가 없습니다.');

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  console.log('=== projects.status 마이그레이션 ===');
  const projectsCol = db.collection('projects');
  let totalProjects = 0;

  for (const [oldVal, newVal] of Object.entries(STATUS_MAP)) {
    const count = await projectsCol.countDocuments({ status: oldVal });
    console.log(`  '${oldVal}' → '${newVal}': ${count}개`);
    if (!isDryRun && count > 0) {
      const result = await projectsCol.updateMany({ status: oldVal }, { $set: { status: newVal } });
      totalProjects += result.modifiedCount;
    }
  }

  console.log('\n=== commoncodes STATUS group 마이그레이션 ===');
  const codesCol = db.collection('commoncodes');
  let totalCodes = 0;

  for (const [oldCode, newCode] of Object.entries(STATUS_MAP)) {
    const doc = await codesCol.findOne({ group: 'STATUS', code: oldCode });
    if (doc) {
      console.log(`  STATUS code '${oldCode}' → '${newCode}': 1개`);
      if (!isDryRun) {
        await codesCol.updateOne({ group: 'STATUS', code: oldCode }, { $set: { code: newCode } });
        totalCodes++;
      }
    } else {
      console.log(`  STATUS code '${oldCode}': 없음 (스킵)`);
    }
  }

  if (isDryRun) {
    console.log('\n[DRY-RUN] 완료 — 위 내용대로 변경됩니다.');
  } else {
    console.log(`\n✅ 완료: projects ${totalProjects}개, commoncodes ${totalCodes}개 업데이트`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ 오류:', e);
  process.exit(1);
});
