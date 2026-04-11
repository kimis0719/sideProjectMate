# Grant Writer Harness

A harness where an agent team collaborates on grant and funding applications: announcement analysis, business plan writing, budget design, and submission verification.

## Structure

```
.claude/
├── agents/
│   ├── announcement-analyst.md  — Announcement Analyst (requirements, evaluation criteria, eligibility)
│   ├── plan-writer.md           — Plan Writer (objectives, methodology, expected outcomes)
│   ├── budget-designer.md       — Budget Designer (line items, eligible costs, matching funds)
│   ├── compliance-checker.md    — Compliance Checker (qualification requirements, restrictions)
│   └── submission-verifier.md   — Submission Verifier (document completeness, gap checking)
├── skills/
│   ├── grant-writer/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── budget-rule-engine/
│   │   └── skill.md             — Budget Rule Engine (eligible costs, ratio limits)
│   └── scoring-optimizer/
│       └── skill.md             — Scoring Optimizer (point analysis, keywords)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/grant-writer` skill, or make a natural language request such as "Prepare a grant application."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_announcement_analysis.md` — Announcement analysis
- `02_business_plan.md` — Business plan
- `03_budget.md` — Budget plan
- `04_compliance_review.md` — Compliance review
- `05_submission_checklist.md` — Submission checklist
- `06_review_report.md` — Review report
