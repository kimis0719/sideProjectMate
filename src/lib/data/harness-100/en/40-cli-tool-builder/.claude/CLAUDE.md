# CLI Tool Builder Harness

CLI tool construction: a harness where an agent team collaborates to perform command design → core development → testing → documentation → release.

## Structure

```
.claude/
├── agents/
│   ├── command-designer.md    — Command Designer (command structure, arguments, flags, UX)
│   ├── core-developer.md     — Core Developer (implementation, I/O, configuration management)
│   ├── test-engineer.md      — Test Engineer (unit/integration/E2E tests, fixture management)
│   ├── docs-writer.md        — Docs Writer (man page, help text, README, tutorials)
│   └── release-engineer.md   — Release Engineer (build, packaging, distribution, CI/CD)
├── skills/
│   ├── cli-tool-builder/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── arg-parser-generator/
│   │   └── skill.md              — Argument parser generation guide
│   └── ux-linter/
│       └── skill.md              — CLI UX linting guide
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/cli-tool-builder` skill or use natural language like "Build a CLI tool for me."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and CLI requirements
- `01_command_design.md` — Command structure and UX design
- `02_src/` — Source code
- `03_tests/` — Test suite
- `04_docs/` — Documentation
- `05_release_config/` — Build and release configuration
