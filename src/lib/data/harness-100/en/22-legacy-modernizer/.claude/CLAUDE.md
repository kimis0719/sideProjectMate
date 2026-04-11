# Legacy Modernizer Harness

An agent team harness for transforming legacy codebases into modern architectures. Automates the analysis -> refactoring strategy -> migration -> verification pipeline.

## Structure

```
.claude/
├── agents/
│   ├── legacy-analyzer.md        — Legacy analysis (tech debt identification, dependency mapping, complexity measurement)
│   ├── refactoring-strategist.md — Refactoring strategy (pattern selection, prioritization, roadmap)
│   ├── migration-engineer.md     — Migration execution (code transformation, API modernization, framework migration)
│   ├── regression-tester.md      — Regression testing (behavior preservation verification, performance comparison, compatibility checks)
│   └── modernization-reviewer.md — Cross-validation (analysis <-> strategy <-> migration <-> test consistency)
├── skills/
│   ├── legacy-modernizer/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── strangler-fig-patterns/
│   │   └── skill.md              — Incremental migration pattern guide
│   └── dependency-analysis/
│       └── skill.md              — Dependency graph analysis tool
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/legacy-modernizer` skill, or make a natural language request such as "modernize the legacy code."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_legacy_analysis.md` — Legacy analysis report
- `02_refactoring_strategy.md` — Refactoring strategy document
- `03_migration_plan.md` — Migration execution plan and code
- `04_test_report.md` — Regression test report
- `05_review_report.md` — Final review report
