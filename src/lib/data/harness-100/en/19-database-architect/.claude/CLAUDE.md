# Database Architect Harness

A harness where an agent team collaborates to perform DB design from modeling through migration, indexing, and query optimization.

## Structure

```
.claude/
├── agents/
│   ├── data-modeler.md         — Data modeling (ERD, normalization, denormalization, relationship design)
│   ├── migration-manager.md    — Migration management (DDL, version control, rollback)
│   ├── performance-analyst.md  — Performance analysis (indexing, query optimization, execution plans)
│   ├── security-auditor.md     — Security verification (access control, encryption, audit logging)
│   └── integration-reviewer.md — Integration review (alignment, consistency, operational readiness)
├── skills/
│   ├── database-architect/
│   │   └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── normalization-patterns/
│   │   └── skill.md             — Data modeler extension (1NF-BCNF, denormalization strategies, ERD templates)
│   └── query-optimization-catalog/
│       └── skill.md             — Performance analyst extension (index strategies, EXPLAIN analysis, N+1, partitioning)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/database-architect` skill or make a natural language request such as "Design a database."

## Artifacts

All artifacts are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_data_model.md` — Data model design document
- `02_migration.sql` — Migration SQL scripts
- `02_migration_plan.md` — Migration plan
- `03_performance.md` — Performance optimization report
- `04_security.md` — Security verification report
- `05_review_report.md` — Integration review report
