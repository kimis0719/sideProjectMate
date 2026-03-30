/* eslint-disable no-console */
/**
 * Phase 1 — M5: boards.ownerId String → ObjectId 타입 변환
 *
 * 변경 내용:
 *   boards.ownerId: String → Schema.Types.ObjectId
 *
 * 주의:
 *   ownerId가 유효한 ObjectId 형식이 아닌 경우(예: "system") 스킵
 *
 * 실행 방법:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-phase1-m5-boards-ownerid.ts
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

function isValidObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value) && value.length === 24;
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

  const boards = await db.collection('boards').find({}).toArray();
  console.log(`boards: ${boards.length}개\n`);

  let updated = 0;
  let skipped = 0;

  for (const board of boards) {
    const ownerIdStr: string = board.ownerId?.toString() ?? '';

    if (!isValidObjectId(ownerIdStr)) {
      console.log(`  ⚠️  skip   _id=${board._id}  ownerId="${ownerIdStr}" (ObjectId 변환 불가)`);
      skipped++;
      continue;
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerIdStr);

    if (isDryRun) {
      console.log(`  [DRY] _id=${board._id}`);
      console.log(`        ownerId: "${ownerIdStr}" (String) → ObjectId`);
    } else {
      await db
        .collection('boards')
        .updateOne({ _id: board._id }, { $set: { ownerId: ownerObjectId } });
      console.log(`  ✓ updated  _id=${board._id}  ownerId → ObjectId(${ownerIdStr})`);
    }
    updated++;
  }

  console.log('\n─────────────────────────');
  if (isDryRun) {
    console.log(`🔍 변환 예정: ${updated}개 / 스킵: ${skipped}개`);
  } else {
    console.log(`✅ 완료: ${updated}개 업데이트 / ${skipped}개 스킵`);
  }
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
