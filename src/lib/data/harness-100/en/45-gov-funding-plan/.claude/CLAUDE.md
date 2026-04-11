# Government Funding Plan Harness

Government funding proposal: a harness where an agent team collaborates to perform announcement analysis → business plan writing → technical writing → budget planning → submission review.

## Structure

```
.claude/
├── agents/
│   ├── announcement-analyst.md — Announcement Analyst (eligibility analysis, evaluation criteria, deadline tracking)
│   ├── biz-writer.md          — Business Plan Writer (project overview, market analysis, commercialization strategy)
│   ├── tech-writer.md         — Technical Writer (technical approach, R&D plan, innovation description)
│   ├── budget-planner.md      — Budget Planner (budget breakdown, cost justification, co-funding plan)
│   └── submission-reviewer.md — Submission Reviewer (compliance check, scoring optimization, final review)
├── skills/
│   ├── gov-funding-plan/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── budget-standard-checker/
│   │   └── skill.md              — Government budget standards compliance guide
│   └── scoring-optimizer/
│       └── skill.md              — Proposal scoring optimization methodology
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/gov-funding-plan` skill or use natural language like "Help me write a government funding proposal."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and funding program information
- `01_announcement_analysis.md` — Funding announcement analysis
- `02_business_plan.md` — Business plan document
- `03_technical_plan.md` — Technical plan document
- `04_budget_plan.md` — Budget plan and justification
- `05_submission_review.md` — Final review and submission checklist
