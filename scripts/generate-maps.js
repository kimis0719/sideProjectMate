/**
 * MAP.md 자동 갱신 스크립트
 * 각 API/컴포넌트 디렉토리의 파일 목록을 추출해서 MAP.md 하단에 갱신합니다.
 *
 * 사용법:
 *   node scripts/generate-maps.js
 *
 * GitHub Actions에서 PR 머지 후 자동 실행됨 (.github/workflows/update-maps.yml)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * 디렉토리 내 파일 목록을 재귀적으로 가져옵니다 (MAP.md, test 파일 제외)
 */
function getFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath, base));
    } else if (
      !entry.name.startsWith('.') &&
      entry.name !== 'MAP.md' &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx')
    ) {
      files.push(relPath);
    }
  }
  return files;
}

/**
 * MAP.md 파일의 "## 자동 생성 파일 목록" 섹션을 갱신합니다.
 * 섹션이 없으면 파일 하단에 추가합니다.
 */
function updateMapFile(mapPath, files) {
  const AUTO_SECTION = '## 자동 생성 파일 목록';
  const timestamp = new Date().toISOString().split('T')[0];

  const fileList = files.map((f) => `- \`${f}\``).join('\n');
  const newSection = `${AUTO_SECTION}\n> 마지막 갱신: ${timestamp}\n\n${fileList}\n`;

  if (!fs.existsSync(mapPath)) return;

  let content = fs.readFileSync(mapPath, 'utf-8');

  if (content.includes(AUTO_SECTION)) {
    // 기존 섹션 교체
    content = content.replace(/## 자동 생성 파일 목록[\s\S]*$/, newSection);
  } else {
    // 섹션 추가
    content = content.trimEnd() + '\n\n' + newSection;
  }

  fs.writeFileSync(mapPath, content, 'utf-8');
  console.log(`✅ 갱신: ${path.relative(ROOT, mapPath)} (${files.length}개 파일)`);
}

/**
 * 대상 디렉토리 목록
 */
const targets = [
  'src/app/api/kanban',
  'src/app/api/projects',
  'src/app/api/users',
  'src/app/api/wbs',
  'src/app/api/chat',
  'src/store',
  'src/lib/models',
  'src/components/board',
  'src/components/wbs',
  'src/components/chat',
  'src/components/profile',
];

let updated = 0;
for (const target of targets) {
  const absDir = path.join(ROOT, target);
  const mapPath = path.join(absDir, 'MAP.md');

  if (!fs.existsSync(mapPath)) {
    console.log(`⏭️  건너뜀 (MAP.md 없음): ${target}`);
    continue;
  }

  const files = getFiles(absDir);
  updateMapFile(mapPath, files);
  updated++;
}

console.log(`\n완료: ${updated}개 MAP.md 갱신`);
