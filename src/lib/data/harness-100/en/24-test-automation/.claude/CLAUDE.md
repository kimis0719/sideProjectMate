# Test Automation Harness

An agent team harness that collaborates on test automation strategy development, test writing, CI integration, and coverage analysis.

## Structure

```
.claude/
├── agents/
│   ├── test-strategist.md      — Test strategy (pyramid, scope, tool selection)
│   ├── unit-tester.md          — Unit testing (mocking, assertions, boundary values)
│   ├── integration-tester.md   — Integration testing (API, DB, external services)
│   ├── coverage-analyst.md     — Coverage analysis (gap identification, risk-based prioritization)
│   └── qa-reviewer.md          — Cross-validation (strategy <-> test <-> coverage consistency)
├── skills/
│   ├── test-automation/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── test-design-patterns/
│   │   └── skill.md              — Systematic test design pattern guide
│   └── mocking-strategy/
│       └── skill.md              — Test double selection and mocking strategy guide
└── CLAUDE.md                   — This file
```

## Usage

Trigger the `/test-automation` skill, or make a natural language request such as "automate the tests."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_test_strategy.md` — Test strategy document
- `02_unit_tests.md` — Unit test code and guide
- `03_integration_tests.md` — Integration test code and guide
- `04_coverage_report.md` — Coverage analysis report
- `05_review_report.md` — Final review report
