import JSZip from 'jszip';
import { IHarnessCatalog } from '@/lib/models/HarnessCatalog';

interface ZipBuildParams {
  instruction: {
    resultMarkdown: string;
    preset: string;
    createdAt: Date;
  };
  harness: IHarnessCatalog;
  lang: 'ko' | 'en';
  project: {
    title: string;
    description?: string;
    techStacks?: string[];
    members?: Array<{ name: string; role: string }>;
  };
  targetNoteTexts: string[];
  referenceNoteTexts: string[];
}

/**
 * 지시서 + 하네스 파일을 포함한 ZIP 패키지를 생성한다.
 *
 * filesCache 구조: flat key 방식
 *   { "CLAUDE.md": "...", "agents/architect.md": "...", "skills/team-orchestrator/skill.md": "..." }
 */
export async function buildZipPackage(params: ZipBuildParams): Promise<Buffer> {
  const { instruction, harness, lang, project, targetNoteTexts, referenceNoteTexts } = params;
  const zip = new JSZip();

  // filesCache는 flat key 구조 (Record<string, string>)
  const files: Record<string, string> =
    (harness.filesCache?.[lang] as unknown as Record<string, string>) ||
    (harness.filesCache?.ko as unknown as Record<string, string>) ||
    {};

  // 오케스트레이터 스킬 이름 추출
  const orchestratorSkill = harness.skills.find((s) => s.type === 'orchestrator');
  const orchestratorName = orchestratorSkill?.dirname || harness.harnessId.replace(/^\d+-/, '');

  // 1. 지시서
  zip.file('instruction.md', instruction.resultMarkdown);

  // 2. .claude/CLAUDE.md — 에이전트 진입점 (프로젝트 설명 제외, 작업 흐름만)
  zip.file('.claude/CLAUDE.md', buildClaudeMd(project, harness, orchestratorName));

  // 3. 하네스 파일들 — flat key를 순회하여 .claude/ 아래에 배치
  for (const [key, content] of Object.entries(files)) {
    if (typeof content !== 'string') continue;
    if (key === 'CLAUDE.md') {
      // 하네스 원본은 harness-guide.md로 저장 (에이전트 팀 구조 참조용)
      zip.file('.claude/harness-guide.md', content);
    } else if (key.startsWith('agents/') || key.startsWith('skills/')) {
      zip.file(`.claude/${key}`, content);
    }
  }

  // 4. SPM 프로젝트 컨텍스트 스킬
  zip.file(
    '.claude/skills/spm-project-context/skill.md',
    buildProjectContextSkill(project, targetNoteTexts, referenceNoteTexts)
  );

  // 5. SETUP-GUIDE.md (사람용 안내)
  zip.file('SETUP-GUIDE.md', buildSetupGuide(harness, lang));

  // 6. README.md (사용법 + 출처 표기)
  zip.file('README.md', buildReadme(harness, instruction));

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer as Buffer;
}

function buildClaudeMd(
  project: ZipBuildParams['project'],
  harness: IHarnessCatalog,
  orchestratorName: string
): string {
  const agentList = harness.agents
    .map((a) => `- **${a.name}**: ${a.description || a.role}`)
    .join('\n');

  return `# ${project.title}

## 작업 시작

\`instruction.md\` 파일을 읽고 지시사항을 실행하세요.
이 지시서가 이번 작업의 전체 범위입니다. 지시서에 없는 작업은 수행하지 마세요.

## 작업 방식

이 프로젝트에는 **${harness.name}** 에이전트 팀 하네스가 구성되어 있습니다.
\`/${orchestratorName}\` 스킬이 팀을 조율하며, \`instruction.md\`를 입력으로 사용합니다.

에이전트 팀:
${agentList}

자세한 팀 구조와 워크플로우는 \`harness-guide.md\`를 참조하세요.

## 기술 스택
${(project.techStacks || []).map((t) => `- ${t}`).join('\n') || '- 미지정'}
`;
}

function buildProjectContextSkill(
  project: ZipBuildParams['project'],
  targetNoteTexts: string[],
  referenceNoteTexts: string[]
): string {
  const sections: string[] = [
    `---`,
    `name: spm-project-context`,
    `description: "이번 작업의 배경 정보. instruction.md와 함께 참조하여 프로젝트 맥락을 파악한다."`,
    `---`,
    ``,
    `# 프로젝트 컨텍스트`,
    ``,
    `- 프로젝트: ${project.title}`,
    `- 기술 스택: ${(project.techStacks || []).join(', ') || '미지정'}`,
  ];

  if (targetNoteTexts.length > 0) {
    sections.push(``, `## 작업 대상 노트`);
    targetNoteTexts.forEach((t, i) => sections.push(`${i + 1}. ${t}`));
  }

  if (referenceNoteTexts.length > 0) {
    sections.push(``, `## 참조 노트`);
    referenceNoteTexts.forEach((t, i) => sections.push(`${i + 1}. ${t}`));
  }

  sections.push(``);
  return sections.join('\n');
}

function buildSetupGuide(harness: IHarnessCatalog, lang: 'ko' | 'en'): string {
  const isKo = lang === 'ko';

  const agentRows = harness.agents
    .map((a) => `| ${a.name} | ${a.description || a.role} | \`.claude/agents/${a.filename}\` |`)
    .join('\n');

  const skillRows = harness.skills
    .map(
      (s) =>
        `| ${s.name} | ${s.type === 'orchestrator' ? (isKo ? '오케스트레이터' : 'Orchestrator') : isKo ? '도메인' : 'Domain'} | \`.claude/skills/${s.dirname}/skill.md\` |`
    )
    .join('\n');

  if (isKo) {
    return `# 설치 가이드

## 1단계: 프로젝트 루트에 복사

이 ZIP의 내용물을 **프로젝트 최상위 디렉토리**에 복사하세요.

\`\`\`
your-project/
├── .claude/          ← 이 폴더가 프로젝트 루트에 위치해야 합니다
├── instruction.md    ← 작업 지시서
├── src/
└── ...
\`\`\`

## 2단계: 지시서 실행

Claude Code 또는 AI Agent에게 \`instruction.md\`를 전달하세요.
Agent가 \`.claude/\` 디렉토리를 자동 인식하여 에이전트 팀이 활성화됩니다.

## 포함된 에이전트 팀

| 에이전트 | 역할 | 파일 |
|----------|------|------|
${agentRows}

## 포함된 스킬

| 스킬 | 유형 | 파일 |
|------|------|------|
${skillRows}
| spm-project-context | 프로젝트 컨텍스트 | \`.claude/skills/spm-project-context/skill.md\` |

---
Powered by [revfactory/harness-100](https://github.com/revfactory/harness-100) (Apache 2.0)
`;
  }

  return `# Setup Guide

## Step 1: Copy to Project Root

Copy the contents of this ZIP to your **project root directory**.

\`\`\`
your-project/
├── .claude/          ← This folder must be at the project root
├── instruction.md    ← Work instruction
├── src/
└── ...
\`\`\`

## Step 2: Run the Instruction

Pass \`instruction.md\` to Claude Code or your AI Agent.
The agent will auto-detect the \`.claude/\` directory and activate the agent team.

## Included Agent Team

| Agent | Role | File |
|-------|------|------|
${agentRows}

## Included Skills

| Skill | Type | File |
|-------|------|------|
${skillRows}
| spm-project-context | Project Context | \`.claude/skills/spm-project-context/skill.md\` |

---
Powered by [revfactory/harness-100](https://github.com/revfactory/harness-100) (Apache 2.0)
`;
}

function buildReadme(harness: IHarnessCatalog, instruction: ZipBuildParams['instruction']): string {
  return `# SPM Instruction Package

- **하네스**: ${harness.name} (${harness.harnessId})
- **프리셋**: ${instruction.preset || '없음'}
- **생성일**: ${new Date(instruction.createdAt).toLocaleDateString('ko-KR')}
- **에이전트**: ${harness.agents.length}명
- **스킬**: ${harness.skills.length + 1}개 (+ spm-project-context)

## 사용법

1. ZIP 내용물을 프로젝트 루트에 복사
2. \`instruction.md\`를 AI Agent에게 전달
3. 자세한 안내: \`SETUP-GUIDE.md\` 참조

---
Powered by [revfactory/harness-100](https://github.com/revfactory/harness-100) (Apache 2.0)
Generated by Side Project Mate
`;
}
