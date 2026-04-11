# Contract Analyzer Harness

A contract analysis agent team harness.

## Structure

```
.claude/
├── agents/
│   ├── clause-analyst.md
│   ├── risk-assessor.md
│   ├── comparison-reviewer.md
│   ├── clause-drafter.md
│   └── contract-coordinator.md
├── skills/
│   ├── contract-analyzer/
│   │   └── skill.md              — Orchestrator
│   ├── clause-risk-database/
│   │   └── skill.md              — Clause risk DB (risk levels, standard clauses, amendment examples)
│   └── negotiation-playbook/
│       └── skill.md              — Negotiation playbook (BATNA, concession strategies, clause alternatives)
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/contract-analyzer` skill, or make a natural language request.
