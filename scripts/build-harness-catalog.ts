/* eslint-disable no-console */
/**
 * harness-100 카탈로그 빌드 스크립트
 *
 * 이식된 harness-100 파일을 순회하여 catalog.json을 생성하고,
 * 선택적으로 MongoDB HarnessCatalog 컬렉션에 시딩한다.
 *
 * 실행 방법 (프로젝트 루트에서):
 *   npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/build-harness-catalog.ts
 *
 * 옵션:
 *   --seed      catalog.json 생성 후 DB에도 시딩
 *   --dry-run   DB에 저장하지 않고 출력만
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── .env.local 파싱 (--seed 시 필요) ─────────────────────────────────────────
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
}

// ─── 설정 ────────────────────────────────────────────────────────────────────
const DATA_ROOT = path.resolve(__dirname, '../src/lib/data/harness-100');
const OUTPUT_PATH = path.resolve(DATA_ROOT, 'catalog.json');

// ─── 도메인 매핑 (하네스 ID 범위 기반) ───────────────────────────────────────
const DOMAIN_RANGES: Array<{ start: number; end: number; domain: string }> = [
  { start: 1, end: 10, domain: 'content-creation' },
  { start: 11, end: 20, domain: 'software-development' },
  { start: 21, end: 30, domain: 'data-analytics' },
  { start: 31, end: 40, domain: 'business-operations' },
  { start: 41, end: 50, domain: 'marketing-sales' },
  { start: 51, end: 60, domain: 'education-research' },
  { start: 61, end: 70, domain: 'design-creative' },
  { start: 71, end: 80, domain: 'finance-legal' },
  { start: 81, end: 90, domain: 'healthcare-science' },
  { start: 91, end: 100, domain: 'infrastructure-devops' },
];

function getDomain(num: number): string {
  for (const range of DOMAIN_RANGES) {
    if (num >= range.start && num <= range.end) return range.domain;
  }
  return 'other';
}

// ─── YAML frontmatter 파서 (간이) ────────────────────────────────────────────
function parseFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { name: '', description: '' };

  const yaml = match[1];
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  const descMatch = yaml.match(/^description:\s*"?([\s\S]*?)"?\s*$/m);

  return {
    name: nameMatch ? nameMatch[1].trim().replace(/^['"]|['"]$/g, '') : '',
    description: descMatch ? descMatch[1].trim().replace(/^['"]|['"]$/g, '') : '',
  };
}

// ─── 기술 스택 키워드 추출 ───────────────────────────────────────────────────
const TECH_KEYWORDS: Record<string, string[]> = {
  'Next.js': ['nextjs', 'next.js', 'next js'],
  React: ['react', 'reactjs'],
  TypeScript: ['typescript', 'ts'],
  Python: ['python', 'django', 'flask', 'fastapi'],
  'Node.js': ['nodejs', 'node.js', 'express'],
  Docker: ['docker', 'container'],
  Kubernetes: ['kubernetes', 'k8s'],
  AWS: ['aws', 'amazon'],
  PostgreSQL: ['postgresql', 'postgres'],
  MongoDB: ['mongodb', 'mongoose'],
  Redis: ['redis'],
  GraphQL: ['graphql'],
  REST: ['rest api', 'restful'],
  Tailwind: ['tailwind', 'tailwindcss'],
  Vue: ['vue', 'vuejs'],
  Angular: ['angular'],
  Go: ['golang'],
  Rust: ['rust'],
  Java: ['java', 'spring'],
  'Machine Learning': ['ml', 'machine learning', 'tensorflow', 'pytorch'],
};

function extractTechStacks(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [tech, keywords] of Object.entries(TECH_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(tech);
    }
  }
  return found;
}

// ─── 태그 추출 ──────────────────────────────────────────────────────────────
function extractTags(harnessId: string, claudeMd: string, skills: string[]): string[] {
  const tags = new Set<string>();

  // 하네스 ID에서 키워드 추출 (e.g., "01-youtube-production" → "youtube", "production")
  const idParts = harnessId.replace(/^\d+-/, '').split('-');
  idParts.forEach((p) => tags.add(p));

  // 스킬 이름에서 추출
  skills.forEach((s) => {
    s.split('-').forEach((p) => {
      if (p.length > 2) tags.add(p);
    });
  });

  // CLAUDE.md에서 주요 키워드 추출
  const keyTerms = [
    'api',
    'frontend',
    'backend',
    'fullstack',
    'mobile',
    'web',
    'data',
    'ai',
    'ml',
    'devops',
    'security',
    'testing',
    'design',
    'ux',
    'ui',
    'game',
    'video',
    'audio',
    'marketing',
    'seo',
    'analytics',
    'automation',
    'chatbot',
    'ecommerce',
    'saas',
    'cloud',
    'database',
    'blockchain',
    'iot',
  ];
  const lower = claudeMd.toLowerCase();
  keyTerms.forEach((term) => {
    if (lower.includes(term)) tags.add(term);
  });

  return Array.from(tags);
}

// ─── 아키텍처 패턴 추론 ─────────────────────────────────────────────────────
const ARCH_PATTERNS = [
  'pipeline',
  'fan-out-fan-in',
  'expert-pool',
  'producer-reviewer',
  'supervisor',
  'hierarchical',
] as const;

function inferArchitecturePattern(
  claudeMd: string,
  skillContent: string
): (typeof ARCH_PATTERNS)[number] {
  const combined = (claudeMd + ' ' + skillContent).toLowerCase();

  if (combined.includes('파이프라인') || combined.includes('pipeline')) return 'pipeline';
  if (combined.includes('fan-out') || combined.includes('팬아웃')) return 'fan-out-fan-in';
  if (combined.includes('expert pool') || combined.includes('전문가 풀')) return 'expert-pool';
  if (combined.includes('producer') || combined.includes('reviewer') || combined.includes('리뷰어'))
    return 'producer-reviewer';
  if (combined.includes('supervisor') || combined.includes('감독자')) return 'supervisor';
  if (combined.includes('hierarchical') || combined.includes('계층')) return 'hierarchical';

  // 기본값: pipeline
  return 'pipeline';
}

// ─── 하네스 디렉토리 파싱 ────────────────────────────────────────────────────
interface CatalogEntry {
  harnessId: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  techStacks: string[];
  agents: Array<{ name: string; role: string; description: string; filename: string }>;
  skills: Array<{
    name: string;
    type: 'orchestrator' | 'domain';
    description: string;
    dirname: string;
  }>;
  architecturePattern: string;
  filesCache: {
    ko: Record<string, string>;
    en: Record<string, string>;
  };
}

function parseHarnessDir(harnessId: string): CatalogEntry | null {
  const koDir = path.join(DATA_ROOT, 'ko', harnessId, '.claude');
  const enDir = path.join(DATA_ROOT, 'en', harnessId, '.claude');

  const koExists = fs.existsSync(koDir);
  const enExists = fs.existsSync(enDir);

  if (!koExists && !enExists) {
    console.warn(`⚠️  ${harnessId}: .claude/ 디렉토리 없음 — 건너뜀`);
    return null;
  }

  // 메타데이터는 ko 우선, 없으면 en
  const primaryDir = koExists ? koDir : enDir;

  // CLAUDE.md 읽기
  const claudeMdPath = path.join(primaryDir, 'CLAUDE.md');
  const claudeMd = fs.existsSync(claudeMdPath) ? fs.readFileSync(claudeMdPath, 'utf-8') : '';

  // 에이전트 파싱
  const agents: CatalogEntry['agents'] = [];
  const agentsDir = path.join(primaryDir, 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const file of fs.readdirSync(agentsDir)) {
      if (!file.endsWith('.md')) continue;
      const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      agents.push({
        name: fm.name || path.basename(file, '.md'),
        role: path.basename(file, '.md'),
        description: fm.description,
        filename: file,
      });
    }
  }

  // 스킬 파싱
  const skills: CatalogEntry['skills'] = [];
  const skillsDir = path.join(primaryDir, 'skills');
  let orchestratorContent = '';
  if (fs.existsSync(skillsDir)) {
    for (const dir of fs.readdirSync(skillsDir)) {
      const skillPath = path.join(skillsDir, dir, 'skill.md');
      if (!fs.existsSync(skillPath)) continue;
      const content = fs.readFileSync(skillPath, 'utf-8');
      const fm = parseFrontmatter(content);

      // 하네스 ID와 같은 이름의 스킬 = orchestrator
      const isOrchestrator = dir === harnessId.replace(/^\d+-/, '');
      if (isOrchestrator) orchestratorContent = content;

      skills.push({
        name: fm.name || dir,
        type: isOrchestrator ? 'orchestrator' : 'domain',
        description: fm.description,
        dirname: dir,
      });
    }
  }

  // 번호 추출
  const numMatch = harnessId.match(/^(\d+)-/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 0;

  // 이름 생성 (하네스 ID에서)
  const nameFromId = harnessId
    .replace(/^\d+-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // filesCache 빌드 (ko/en 각각)
  const filesCache: CatalogEntry['filesCache'] = { ko: {}, en: {} };

  for (const lang of ['ko', 'en'] as const) {
    const langDir = path.join(DATA_ROOT, lang, harnessId, '.claude');
    if (!fs.existsSync(langDir)) continue;

    // CLAUDE.md
    const langClaudeMd = path.join(langDir, 'CLAUDE.md');
    if (fs.existsSync(langClaudeMd)) {
      filesCache[lang]['CLAUDE.md'] = fs.readFileSync(langClaudeMd, 'utf-8');
    }

    // agents
    const langAgentsDir = path.join(langDir, 'agents');
    if (fs.existsSync(langAgentsDir)) {
      for (const file of fs.readdirSync(langAgentsDir)) {
        if (!file.endsWith('.md')) continue;
        filesCache[lang][`agents/${file}`] = fs.readFileSync(
          path.join(langAgentsDir, file),
          'utf-8'
        );
      }
    }

    // skills
    const langSkillsDir = path.join(langDir, 'skills');
    if (fs.existsSync(langSkillsDir)) {
      for (const dir of fs.readdirSync(langSkillsDir)) {
        const skillPath = path.join(langSkillsDir, dir, 'skill.md');
        if (!fs.existsSync(skillPath)) continue;
        filesCache[lang][`skills/${dir}/skill.md`] = fs.readFileSync(skillPath, 'utf-8');
      }
    }
  }

  return {
    harnessId,
    name: nameFromId,
    domain: getDomain(num),
    description:
      claudeMd
        .split('\n')
        .find((l) => l.trim() && !l.startsWith('#'))
        ?.trim() || '',
    tags: extractTags(
      harnessId,
      claudeMd,
      skills.map((s) => s.dirname)
    ),
    techStacks: extractTechStacks(claudeMd),
    agents,
    skills,
    architecturePattern: inferArchitecturePattern(claudeMd, orchestratorContent),
    filesCache,
  };
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = args.includes('--seed');
  const dryRun = args.includes('--dry-run');

  console.log('🔧 harness-100 카탈로그 빌드 시작...\n');

  // ko 디렉토리 기준으로 하네스 목록 생성 (en에만 있는 것도 포함)
  const koHarnesses = fs.existsSync(path.join(DATA_ROOT, 'ko'))
    ? fs.readdirSync(path.join(DATA_ROOT, 'ko')).filter((d) => /^\d{1,3}-/.test(d))
    : [];
  const enHarnesses = fs.existsSync(path.join(DATA_ROOT, 'en'))
    ? fs.readdirSync(path.join(DATA_ROOT, 'en')).filter((d) => /^\d{1,3}-/.test(d))
    : [];

  const allIds = Array.from(new Set(koHarnesses.concat(enHarnesses))).sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
    return numA - numB;
  });

  console.log(`📁 발견된 하네스: ${allIds.length}개\n`);

  const catalog: CatalogEntry[] = [];
  let skipped = 0;

  for (const id of allIds) {
    const entry = parseHarnessDir(id);
    if (entry) {
      catalog.push(entry);
      console.log(
        `  ✓ ${entry.harnessId} — ${entry.agents.length} agents, ${entry.skills.length} skills`
      );
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ 빌드 완료: ${catalog.length}개 (건너뜀: ${skipped}개)`);

  // catalog.json 저장 (filesCache 제외한 메타데이터 버전)
  const catalogMeta = catalog.map(({ filesCache: _fc, ...rest }) => rest);
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalogMeta, null, 2), 'utf-8');
  console.log(`📄 ${OUTPUT_PATH} 저장됨`);

  // --seed: DB에 시딩
  if (shouldSeed) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI가 설정되지 않았습니다. .env.local을 확인하세요.');
      process.exit(1);
    }

    const mongoose = await import('mongoose');
    const HarnessCatalog = (await import('../src/lib/models/HarnessCatalog')).default;

    await mongoose.default.connect(mongoUri);
    console.log('\n🔗 MongoDB 연결됨');

    for (const entry of catalog) {
      if (dryRun) {
        console.log(`  [DRY] ${entry.harnessId}`);
        continue;
      }

      await HarnessCatalog.findOneAndUpdate({ harnessId: entry.harnessId }, entry, {
        upsert: true,
        new: true,
      });
      console.log(`  ✓ DB upsert: ${entry.harnessId}`);
    }

    await mongoose.default.disconnect();
    console.log(`\n✅ DB 시딩 완료: ${catalog.length}건`);
  }
}

main().catch((err) => {
  console.error('❌ 빌드 실패:', err);
  process.exit(1);
});
