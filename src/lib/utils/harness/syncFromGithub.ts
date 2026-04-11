import HarnessCatalog from '@/lib/models/HarnessCatalog';

const REPO = 'revfactory/harness-100';
const API_BASE = 'https://api.github.com';

interface GithubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  download_url: string | null;
}

interface GithubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  url: string;
}

async function githubFetch(path: string): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'spm-harness-sync',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchFileContent(downloadUrl: string): Promise<string> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`File fetch error: ${res.status}`);
  return res.text();
}

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

/**
 * GitHub에서 harness-100 레포를 가져와 HarnessCatalog를 동기화한다.
 */
export async function syncHarnessCatalog(): Promise<{
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  // 각 언어 디렉토리의 하네스 목록 조회
  const langs = ['ko', 'en'] as const;
  const allHarnessIds = new Set<string>();

  for (const lang of langs) {
    const contents = (await githubFetch(`/repos/${REPO}/contents/${lang}`)) as GithubContent[];
    for (const item of contents) {
      if (item.type === 'dir' && /^\d{1,3}-/.test(item.name)) {
        allHarnessIds.add(item.name);
      }
    }
  }

  for (const harnessId of Array.from(allHarnessIds)) {
    try {
      const filesCache: Record<string, Record<string, string>> = { ko: {}, en: {} };
      let primaryClaudeMd = '';
      const agents: Array<{
        name: string;
        role: string;
        description: string;
        filename: string;
      }> = [];
      const skills: Array<{
        name: string;
        type: 'orchestrator' | 'domain';
        description: string;
        dirname: string;
      }> = [];

      for (const lang of langs) {
        // .claude 디렉토리의 tree를 재귀 조회
        let tree: GithubTreeItem[];
        try {
          const treeRes = (await githubFetch(
            `/repos/${REPO}/git/trees/main:${lang}/${harnessId}/.claude?recursive=1`
          )) as { tree: GithubTreeItem[] };
          tree = treeRes.tree;
        } catch {
          continue; // 이 언어에는 해당 하네스 없음
        }

        for (const item of tree) {
          if (item.type !== 'blob') continue;
          if (!item.path.endsWith('.md')) continue;

          const downloadUrl = `https://raw.githubusercontent.com/${REPO}/main/${lang}/${harnessId}/.claude/${item.path}`;
          const content = await fetchFileContent(downloadUrl);

          if (item.path === 'CLAUDE.md') {
            filesCache[lang]['CLAUDE.md'] = content;
            if (lang === 'ko' || !primaryClaudeMd) primaryClaudeMd = content;
          } else if (item.path.startsWith('agents/')) {
            const filename = item.path.replace('agents/', '');
            filesCache[lang][`agents/${filename}`] = content;

            // 메타데이터는 ko 기준 한 번만 추출
            if (lang === 'ko' && !agents.find((a) => a.filename === filename)) {
              const fm = parseFrontmatter(content);
              agents.push({
                name: fm.name || filename.replace('.md', ''),
                role: filename.replace('.md', ''),
                description: fm.description,
                filename,
              });
            }
          } else if (item.path.startsWith('skills/') && item.path.endsWith('skill.md')) {
            const dirname = item.path.split('/')[1];
            filesCache[lang][`skills/${dirname}/skill.md`] = content;

            if (lang === 'ko' && !skills.find((s) => s.dirname === dirname)) {
              const fm = parseFrontmatter(content);
              const slugName = harnessId.replace(/^\d+-/, '');
              skills.push({
                name: fm.name || dirname,
                type: dirname === slugName ? 'orchestrator' : 'domain',
                description: fm.description,
                dirname,
              });
            }
          }
        }
      }

      // DB 업데이트
      const numMatch = harnessId.match(/^(\d+)-/);
      const num = numMatch ? parseInt(numMatch[1], 10) : 0;
      const domain = getDomainByNum(num);
      const name = harnessId
        .replace(/^\d+-/, '')
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const description =
        primaryClaudeMd
          .split('\n')
          .find((l) => l.trim() && !l.startsWith('#'))
          ?.trim() || '';

      await HarnessCatalog.findOneAndUpdate(
        { harnessId },
        {
          harnessId,
          name,
          domain,
          description,
          agents,
          skills,
          filesCache,
          lastSyncAt: new Date(),
        },
        { upsert: true }
      );

      synced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${harnessId}: ${msg}`);
    }
  }

  return { synced, errors };
}

function getDomainByNum(num: number): string {
  const ranges: Array<{ start: number; end: number; domain: string }> = [
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
  for (const r of ranges) {
    if (num >= r.start && num <= r.end) return r.domain;
  }
  return 'other';
}
