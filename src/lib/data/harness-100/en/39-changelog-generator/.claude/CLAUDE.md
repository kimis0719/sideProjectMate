# Changelog Generator Harness

Changelog generation: a harness where an agent team collaborates to perform commit analysis → change classification → release note writing → migration guide → announcement.

## Structure

```
.claude/
├── agents/
│   ├── commit-analyst.md          — Commit Analyst (git log parsing, PR analysis, change scope identification)
│   ├── change-classifier.md       — Change Classifier (breaking/feature/fix/refactor classification, semver impact)
│   ├── release-note-writer.md     — Release Note Writer (user-facing changelog, grouped by category)
│   ├── migration-guide-writer.md  — Migration Guide Writer (breaking change migration paths, code examples)
│   └── announcement-writer.md     — Announcement Writer (blog post, social media, email announcement)
├── skills/
│   ├── changelog-generator/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── commit-parser/
│   │   └── skill.md              — Conventional commit parsing guide
│   └── semver-analyzer/
│       └── skill.md              — Semantic versioning analysis guide
└── CLAUDE.md                      — This file
```

## Usage

Trigger the `/changelog-generator` skill or use natural language like "Generate a changelog for me."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and repository information
- `01_commit_analysis.md` — Commit analysis results
- `02_change_classification.md` — Change classification and semver recommendation
- `03_release_notes.md` — Release notes (changelog)
- `04_migration_guide.md` — Migration guide for breaking changes
- `05_announcement.md` — Release announcement drafts
