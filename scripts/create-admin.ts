/**
 * 최초 관리자 계정 생성 스크립트
 *
 * 실행 방법 (프로젝트 루트에서):
 *   npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/create-admin.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import mongoose from 'mongoose';
import User from '../src/lib/models/User';
import Counter from '../src/lib/models/Counter';

// ─── .env.local 파싱 ────────────────────────────────────────────────────────
// User/Counter 모델은 module 로드 시점에 env를 참조하지 않으므로 static import 가능
// mongoose.connect() 호출 전에만 MONGODB_URI가 설정되면 됩니다.
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
} else {
  console.warn('⚠️  .env.local 파일을 찾을 수 없습니다.');
}

// ─── readline 헬퍼 ────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question: string): Promise<string> =>
  new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));

// ─── 메인 로직 ────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
    process.exit(1);
  }

  console.log('\n🔐 Side Project Mate — 관리자 계정 생성\n');

  // CLI 인자로 전달된 경우 (npx ts-node ... email name password)
  const [,, argEmail, argName, argPassword] = process.argv;

  const email = argEmail ?? await ask('이메일: ');
  const name = argName ?? await ask('이름: ');
  const password = argPassword ?? await ask('비밀번호 (최소 6자): ');

  rl.close();

  if (!email || !name || !password) {
    console.error('❌ 이메일, 이름, 비밀번호는 모두 필수입니다.');
    process.exit(1);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ 올바른 이메일 형식이 아닙니다.');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ 비밀번호는 최소 6자 이상이어야 합니다.');
    process.exit(1);
  }

  await mongoose.connect(uri, { bufferCommands: false });
  console.log('✅ DB 연결 성공');

  // 기존 계정 확인
  const existing = await User.findOne({ authorEmail: email.toLowerCase() });
  if (existing) {
    if (existing.memberType === 'admin') {
      console.error(`❌ 이미 관리자 계정이 존재합니다: ${email}`);
    } else {
      console.log(`ℹ️  기존 일반 계정(${email})을 관리자로 승격합니다...`);
      await User.updateOne({ _id: existing._id }, { $set: { memberType: 'admin', delYn: false } });
      console.log(`✅ 관리자 권한이 부여되었습니다: ${email}\n`);
    }
    await mongoose.disconnect();
    process.exit(0);
  }

  // uid 채번 (register route와 동일한 'member_uid' 카운터 사용)
  const counter = await Counter.findOneAndUpdate(
    { _id: 'member_uid' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // 비밀번호는 User 모델 pre-save hook에서 자동 해싱
  await User.create({
    authorEmail: email.toLowerCase(),
    password,
    nName: name,
    memberType: 'admin',
    delYn: false,
    uid: counter.seq,
  });

  console.log('\n✅ 관리자 계정이 생성되었습니다.');
  console.log(`   이메일  : ${email.toLowerCase()}`);
  console.log(`   이름    : ${name}`);
  console.log(`   역할    : admin`);
  console.log(`   UID     : ${counter.seq}\n`);
  console.log('👉 /login 에서 로그인 후 /admin 으로 접근하세요.\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ 오류 발생:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
