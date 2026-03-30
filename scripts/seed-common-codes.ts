/* eslint-disable no-console */
/**
 * Phase 0 — CommonCode 초기 데이터 입력 스크립트
 *
 * 실행 방법 (프로젝트 루트에서):
 *   npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/seed-common-codes.ts
 *
 * 옵션:
 *   --dry-run   DB에 저장하지 않고 입력될 데이터만 출력
 *   --force     이미 존재하는 code도 덮어쓰기 (기본: skip)
 */

import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import CommonCode from '../src/lib/models/CommonCode';

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

// ─── 시드 데이터 ──────────────────────────────────────────────────────────────
const SEED_DATA: Array<{
  group: string;
  groupName: string;
  code: string;
  label: string;
  order: number;
}> = [
  // DOMAIN
  { group: 'DOMAIN', groupName: '도메인', code: 'productivity', label: '생산성', order: 1 },
  { group: 'DOMAIN', groupName: '도메인', code: 'dev_tools', label: '개발자 도구', order: 2 },
  { group: 'DOMAIN', groupName: '도메인', code: 'social', label: '소셜', order: 3 },
  { group: 'DOMAIN', groupName: '도메인', code: 'education', label: '교육', order: 4 },
  { group: 'DOMAIN', groupName: '도메인', code: 'fintech', label: '금융/핀테크', order: 5 },
  { group: 'DOMAIN', groupName: '도메인', code: 'commerce', label: '커머스', order: 6 },
  { group: 'DOMAIN', groupName: '도메인', code: 'entertainment', label: '엔터테인먼트', order: 7 },
  { group: 'DOMAIN', groupName: '도메인', code: 'healthcare', label: '헬스케어', order: 8 },
  { group: 'DOMAIN', groupName: '도메인', code: 'local_biz', label: '소상공인/로컬', order: 9 },
  { group: 'DOMAIN', groupName: '도메인', code: 'realestate', label: '부동산', order: 10 },

  // LOOKING_FOR
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'fast_execution',
    label: '빠른 실행',
    order: 1,
  },
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'ai_proficient',
    label: 'AI 활용 능숙',
    order: 2,
  },
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'mvp_experience',
    label: 'MVP 경험',
    order: 3,
  },
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'domain_expert',
    label: '도메인 전문가',
    order: 4,
  },
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'design_sense',
    label: '디자인 감각',
    order: 5,
  },
  { group: 'LOOKING_FOR', groupName: '찾는 사람', code: 'planning', label: '기획력', order: 6 },
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'async_work',
    label: '비동기 선호',
    order: 7,
  },
  {
    group: 'LOOKING_FOR',
    groupName: '찾는 사람',
    code: 'long_term',
    label: '장기 프로젝트',
    order: 8,
  },

  // WORK_STYLE
  {
    group: 'WORK_STYLE',
    groupName: '작업 스타일',
    code: 'ai_heavy',
    label: 'AI 적극 활용',
    order: 1,
  },
  {
    group: 'WORK_STYLE',
    groupName: '작업 스타일',
    code: 'fast_launch',
    label: '빠른 출시 우선',
    order: 2,
  },
  {
    group: 'WORK_STYLE',
    groupName: '작업 스타일',
    code: 'quality_first',
    label: '완성도 우선',
    order: 3,
  },
  {
    group: 'WORK_STYLE',
    groupName: '작업 스타일',
    code: 'async_first',
    label: '비동기 선호',
    order: 4,
  },
  {
    group: 'WORK_STYLE',
    groupName: '작업 스타일',
    code: 'sync_preferred',
    label: '정기 미팅 선호',
    order: 5,
  },

  // PROJECT_STAGE
  {
    group: 'PROJECT_STAGE',
    groupName: '프로젝트 단계',
    code: 'idea',
    label: '아이디어 단계',
    order: 1,
  },
  {
    group: 'PROJECT_STAGE',
    groupName: '프로젝트 단계',
    code: 'prototype',
    label: '프로토타입 있음',
    order: 2,
  },
  { group: 'PROJECT_STAGE', groupName: '프로젝트 단계', code: 'mvp', label: 'MVP 완성', order: 3 },
  {
    group: 'PROJECT_STAGE',
    groupName: '프로젝트 단계',
    code: 'beta',
    label: '베타 테스트 중',
    order: 4,
  },
  {
    group: 'PROJECT_STAGE',
    groupName: '프로젝트 단계',
    code: 'launched',
    label: '런치 완료',
    order: 5,
  },

  // EXECUTION_STYLE
  {
    group: 'EXECUTION_STYLE',
    groupName: '실행 방식',
    code: 'ai_heavy',
    label: 'AI 적극 활용',
    order: 1,
  },
  {
    group: 'EXECUTION_STYLE',
    groupName: '실행 방식',
    code: 'balanced',
    label: 'AI와 직접 작업 균형',
    order: 2,
  },
  {
    group: 'EXECUTION_STYLE',
    groupName: '실행 방식',
    code: 'traditional',
    label: '직접 작업 위주',
    order: 3,
  },
];

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const isForce = process.argv.includes('--force');

  if (isDryRun) {
    console.log('\n🔍 [DRY RUN] 실제 DB 저장 없이 입력 데이터를 출력합니다.\n');
    const grouped = SEED_DATA.reduce<Record<string, typeof SEED_DATA>>((acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    }, {});
    for (const [group, items] of Object.entries(grouped)) {
      console.log(`\n[${group}] (${items.length}개)`);
      items.forEach((i) =>
        console.log(`  ${String(i.order).padStart(2)}. ${i.code.padEnd(16)} ${i.label}`)
      );
    }
    console.log(`\n총 ${SEED_DATA.length}개 항목\n`);
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log('✅ DB 연결 성공\n');

  let inserted = 0;
  let skipped = 0;
  let updated = 0;

  for (const item of SEED_DATA) {
    const filter = { group: item.group, code: item.code };
    const existing = await CommonCode.findOne(filter).lean();

    if (existing) {
      if (isForce) {
        await CommonCode.updateOne(filter, {
          $set: { label: item.label, order: item.order, groupName: item.groupName },
        });
        console.log(`  ↺ updated  [${item.group}] ${item.code}`);
        updated++;
      } else {
        console.log(`  ↷ skipped  [${item.group}] ${item.code} (이미 존재)`);
        skipped++;
      }
    } else {
      await CommonCode.create({ ...item, isActive: true });
      console.log(`  ✓ inserted [${item.group}] ${item.code} — ${item.label}`);
      inserted++;
    }
  }

  console.log('\n─────────────────────────');
  console.log(`✅ 완료: ${inserted}개 추가 / ${updated}개 업데이트 / ${skipped}개 스킵`);
  console.log('─────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
