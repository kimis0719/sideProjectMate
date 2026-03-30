/* eslint-disable no-console */
/**
 * Phase 1 — M3: projects.tags (ObjectId[]) → techStacks (String[]) 변환
 *
 * 변경 내용:
 *   Before: projects.tags = [ObjectId, ...]  (techstacks 컬렉션 참조)
 *   After:  projects.techStacks = ['JavaScript', 'TypeScript', ...]  (이름 문자열 배열)
 *
 * 실행 방법:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate-phase1-m3-tags-to-techstacks.ts
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

  // techstacks 전체 로드 → id→name 맵 생성
  const techStacks = await db.collection('techstacks').find({}).toArray();
  const idToName = new Map<string, string>(
    techStacks.map((ts) => [ts._id.toString(), ts.name as string])
  );
  console.log(`techstacks 로드: ${techStacks.length}개\n`);

  const projects = await db.collection('projects').find({}).toArray();

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const project of projects) {
    const tags: string[] = (project.tags ?? []).map((t: unknown) => t!.toString());

    if (tags.length === 0) {
      console.log(`  ↷ skip   pid=${project.pid}  (tags 없음)`);
      skipped++;
      continue;
    }

    const techStackNames: string[] = [];
    const missing: string[] = [];

    for (const tagId of tags) {
      const name = idToName.get(tagId);
      if (name) {
        techStackNames.push(name);
      } else {
        missing.push(tagId);
        notFound++;
      }
    }

    if (isDryRun) {
      console.log(`  [DRY] pid=${project.pid}`);
      console.log(`        tags:       [${tags.join(', ')}]`);
      console.log(`        techStacks: [${techStackNames.join(', ')}]`);
      if (missing.length > 0) {
        console.log(`        ⚠️  미매칭 ObjectId: [${missing.join(', ')}]`);
      }
    } else {
      await db.collection('projects').updateOne(
        { _id: project._id },
        {
          $set: { techStacks: techStackNames },
          $unset: { tags: '' },
        }
      );
      console.log(
        `  ✓ updated  pid=${project.pid}  tags ${tags.length}개 → techStacks [${techStackNames.join(', ')}]`
      );
      if (missing.length > 0) {
        console.log(
          `    ⚠️  미매칭 ID ${missing.length}개 (techstacks에 없는 ObjectId, 변환 생략)`
        );
      }
    }
    updated++;
  }

  console.log('\n─────────────────────────');
  if (isDryRun) {
    console.log(
      `🔍 변환 예정: ${updated}개 프로젝트 / 스킵: ${skipped}개 / 미매칭 태그: ${notFound}개`
    );
  } else {
    console.log(
      `✅ 완료: ${updated}개 업데이트 / ${skipped}개 스킵 / 미매칭 태그 ID: ${notFound}개`
    );
  }
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
