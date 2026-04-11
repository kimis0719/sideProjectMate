---
name: changelog-generator
description: "Full pipeline where an agent team collaborates to perform release management. Use this skill for requests like 'create release notes', 'generate CHANGELOG', 'write changelog', 'prepare version release', 'migration guide', 'release announcement', 'organize changes', 'new version announcement', and other release management tasks. Note: CI/CD pipeline construction, automated deployment configuration, and version management policy establishment are outside the scope of this skill."
---

# Changelog Generator — Release Management Pipeline

An agent team collaborates to generate git history analysis, change classification, release notes, migration guides, and announcements.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| commit-analyst | `.claude/agents/commit-analyst.md` | Git history analysis | general-purpose |
| change-classifier | `.claude/agents/change-classifier.md` | Change classification, impact assessment | general-purpose |
| release-note-writer | `.claude/agents/release-note-writer.md` | Release note writing | general-purpose |
| migration-guide-writer | `.claude/agents/migration-guide-writer.md` | Migration guide | general-purpose |
| announcement-writer | `.claude/agents/announcement-writer.md` | Announcement writing (blog/social media/email) | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Version range**: Previous version tag ~ current commit/tag
    - **Project information**: Project name, repository URL, language/framework
    - **Release type**: Regular/hotfix/pre-release
    - **Announcement channels**: Which channels are needed among blog/social media/email/Slack
    - **Existing CHANGELOG** (optional): Existing CHANGELOG.md to follow its format
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. Verify the git repository and finalize the version range
5. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
6. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Commit analysis | analyst | None | `_workspace/01_commit_analysis.md` |
| 2 | Change classification | classifier | Task 1 | `_workspace/02_change_classification.md` |
| 3a | Release notes | note-writer | Task 2 | `_workspace/03_release_notes.md` |
| 3b | Migration guide | migration-writer | Task 2 | `_workspace/04_migration_guide.md` |
| 4 | Announcement | announcement | Tasks 3a, 3b | `_workspace/05_announcement.md` |

Tasks 3a (release notes) and 3b (migration guide) run **in parallel**.

**Inter-agent communication flow:**
- analyst completes > passes commit list and diffs to classifier
- classifier completes > passes classification results to note-writer, passes Breaking Changes details to migration-writer
- note-writer completes > passes highlights and version number to announcement
- migration-writer completes > passes migration key summary to announcement, passes guide link to note-writer

### Phase 3: Integration and Final Deliverables

1. Verify version number consistency across all deliverables
2. Validate that Breaking Change information is consistent across release notes, migration guide, and announcements
3. If an existing CHANGELOG.md exists, add the new version at the top
4. Report the final summary to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Full release prep", "changelog + announcement" | **Full pipeline** | All 5 agents |
| "Just create a CHANGELOG" | **Notes mode** | analyst + classifier + note-writer |
| "Migration guide only" | **Migration mode** | analyst + classifier + migration-writer |
| "Just write the release announcement" (notes complete) | **Announcement mode** | announcement only |
| "Classify these commits" | **Classification mode** | analyst + classifier |

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share primary deliverables |
| Message-based | SendMessage | Real-time key information transfer |
| Git commands | bash execution | Extract commit logs, diffs, tag information |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| No git repository | Request user to directly input commit list/change history |
| No tags | Substitute with most recent N commits or date range |
| Conventional Commits not used | LLM-based classification from commit messages + diffs |
| No Breaking Changes | migration-writer produces only a "not required" confirmation document |
| Agent failure | Retry once > if still failing, proceed without that deliverable |

## Test Scenarios

### Normal Flow
**Prompt**: "Create full release notes from v1.2.0 to v2.0.0"
**Expected result**:
- Commit analysis: Extract all commits between the two tags, map PRs/issues
- Change classification: Identify Breaking Changes since it is a MAJOR release, verify SemVer
- Release notes: Keep a Changelog format, 3-5 highlights
- Migration: Before/after code examples, step-by-step procedures
- Announcement: Blog + social media + email formats

### Existing File Reuse Flow
**Prompt**: "I have these release notes, just write the announcement" + release notes attached
**Expected result**:
- Copy existing release notes to `_workspace/03_release_notes.md`
- Announcement mode: Deploy announcement only
- Skip analyst, classifier, note-writer, and migration-writer

### Error Flow
**Prompt**: "Create release notes" (no git repository)
**Expected result**:
- Detect absence of git repository
- Request user to directly input the change list
- Classify input content > generate release notes

## Agent Extension Skills

Extension skills that enhance agent domain expertise:

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| semver-analyzer | `.claude/skills/semver-analyzer/skill.md` | change-classifier, release-note-writer | SemVer rules, Breaking Change assessment matrix, Conventional Commits mapping |
| commit-parser | `.claude/skills/commit-parser/skill.md` | commit-analyst, change-classifier | Commit parsing regex, non-conventional commit classification, PR/issue mapping, impact scoring |
