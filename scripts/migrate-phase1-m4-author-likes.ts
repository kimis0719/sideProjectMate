/* eslint-disable no-console */
/**
 * Phase 1 — M4: projects.author → ownerId rename + likes (Array) → likeCount (Number) 변환
 *
 * 변경 내용:
 *   projects.author  (ObjectId)  → projects.ownerId  (ObjectId)
 *   projects.likes   (Array)     → projects.likeCount (Number, likes.length 값)
 *
 * 실행 방법:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-phase1-m4-author-likes.ts
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
  console.log(`프로젝트: ${projects.length}개\n`);

  let updated = 0;

  for (const project of projects) {
    const ownerId = project.author;
    const likeCount = Array.isArray(project.likes) ? project.likes.length : (project.likes ?? 0);

    if (isDryRun) {
      console.log(`  [DRY] pid=${project.pid}`);
      console.log(`        author → ownerId: ${ownerId}`);
      console.log(
        `        likes(${Array.isArray(project.likes) ? project.likes.length : 0}개) → likeCount: ${likeCount}`
      );
    } else {
      await db.collection('projects').updateOne(
        { _id: project._id },
        {
          $set: { ownerId, likeCount },
          $unset: { author: '', likes: '' },
        }
      );
      console.log(`  ✓ updated  pid=${project.pid}  ownerId=${ownerId}  likeCount=${likeCount}`);
    }
    updated++;
  }

  console.log('\n─────────────────────────');
  if (isDryRun) {
    console.log(`🔍 변환 예정: ${updated}개 프로젝트`);
  } else {
    console.log(`✅ 완료: ${updated}개 업데이트`);
  }
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
