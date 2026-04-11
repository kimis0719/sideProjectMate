# Data Migration Harness

Data migration: a harness in which an agent team collaborates to perform source analysis, schema mapping, transformation script generation, validation queries, and rollback planning.

## Structure

```
.claude/
├── agents/
│   ├── source-analyst.md    — Source analysis (schema reverse-engineering, data profiling, dependency mapping)
│   ├── schema-mapper.md     — Schema mapping (field mapping, type conversion, business rule definition)
│   ├── script-developer.md  — Transformation scripts (ETL code, incremental processing, performance optimization)
│   ├── validation-engineer.md — Validation engineer (validation queries, data integrity, regression testing)
│   └── rollback-planner.md  — Rollback planning (backup strategy, rollback scripts, emergency procedures)
├── skills/
│   ├── data-migration/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── type-mapping-encyclopedia/
│   │   └── skill.md              — Data type mapping encyclopedia
│   └── data-validation-patterns/
│       └── skill.md              — Migration validation patterns guide
└── CLAUDE.md                — This file
```

## Usage

Trigger the `/data-migration` skill, or make a natural language request such as "Create a data migration plan."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — User input and migration requirements
- `01_source_analysis.md` — Source system analysis report
- `02_schema_mapping.md` — Schema mapping specification
- `03_migration_scripts/` — Transformation scripts directory
- `04_validation_suite.md` — Validation queries and test suite
- `05_rollback_plan.md` — Rollback and emergency response plan
