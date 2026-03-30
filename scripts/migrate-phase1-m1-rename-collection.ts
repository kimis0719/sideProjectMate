/* eslint-disable no-console */
/**
 * Phase 1 — M1: memberbasics 컬렉션 → users 컬렉션 rename
 *
 * 실행 방법 (프로젝트 루트에서):
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-phase1-m1-rename-collection.ts
 *
 * 옵션:
 *   --dry-run   실제 rename 없이 현황만 출력
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

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });
  const db = mongoose.connection.db!;
  console.log('✅ DB 연결 성공\n');

  // 현황 확인
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  const hasSource = collectionNames.includes('memberbasics');
  const hasTarget = collectionNames.includes('users');

  console.log('─── 현황 ───────────────────────────────────');
  console.log(`  memberbasics 존재: ${hasSource ? '✓' : '✗'}`);
  console.log(`  users 존재:        ${hasTarget ? '✓ (이미 있음)' : '✗'}`);

  if (hasSource) {
    const count = await db.collection('memberbasics').countDocuments();
    console.log(`  memberbasics 문서 수: ${count}개`);
  }
  console.log('─────────────────────────────────────────────\n');

  if (!hasSource) {
    console.log('ℹ️  memberbasics 컬렉션이 없습니다. 이미 마이그레이션 완료되었거나 데이터 없음.');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (hasTarget) {
    console.error(
      '❌ users 컬렉션이 이미 존재합니다.\n' +
        '   충돌 방지를 위해 수동으로 확인 후 진행하세요:\n' +
        '   - users 컬렉션이 비어 있으면 직접 drop 후 재실행\n' +
        '   - users 컬렉션에 데이터가 있으면 먼저 확인 필요'
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (isDryRun) {
    console.log('🔍 [DRY RUN] memberbasics → users rename 예정. 실제 변경 없음.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // 실제 rename 실행
  console.log('🔄 memberbasics → users 컬렉션 rename 시작...');
  await db.renameCollection('memberbasics', 'users');
  console.log('✅ rename 완료\n');

  // 결과 검증
  const verifyCollections = await db.listCollections().toArray();
  const verifyNames = verifyCollections.map((c) => c.name);
  const count = await db.collection('users').countDocuments();

  console.log('─── 검증 ───────────────────────────────────');
  console.log(
    `  memberbasics 잔존: ${verifyNames.includes('memberbasics') ? '⚠️ 있음' : '✓ 없음'}`
  );
  console.log(`  users 존재:        ${verifyNames.includes('users') ? '✓ 있음' : '⚠️ 없음'}`);
  console.log(`  users 문서 수:     ${count}개`);
  console.log('─────────────────────────────────────────────\n');

  console.log('✅ M1 마이그레이션 완료');
  console.log('');
  console.log('다음 단계: src/lib/models/User.ts 에서 컬렉션명 하드코딩 제거');
  console.log("  mongoose.model<IUser>('User', UserSchema, 'memberbasics')");
  console.log("  → mongoose.model<IUser>('User', UserSchema)");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
