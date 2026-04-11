# Proposal Writer Harness

proposal clientanalysis→solutiondesign→price→differentiation→specialistperson A harness where an agent team collaborates to produce deliverables.

## structure

```
.claude/
├── agents/
│ ├── client-analyst.md — client analysis (, decision-makingstructure, competitionsituation)
│ ├── solution-architect.md — solution design (technical/service composition, implementation plan)
│ ├── pricing-strategist.md — price strategy (KRW, price model, ROI)
│ ├── differentiator.md — differentiation strategy (USP, competitionadvantage, reference)
│ └── proposal-designer.md — proposal integration and cross-verification (composition, specialistperson, QA)
├── skills/
│ ├── proposal-writer/
│ │ └── skill.md — Orchestrator (team , workflow, error handling)
│ ├── roi-calculator/
│ │ └── skill.md — ROI calculation framework (pricing-strategist extension)
│ └── win-theme-builder/
│ └── skill.md — Win Theme building (differentiator extension)
└── CLAUDE.md — file
```

## usage

`/proposal-writer` skill , "proposal create it" specialistannual request.

## deliverable

all deliverable `_workspace/` save:
- `00_input.md` — user input organization
- `01_client_analysis.md` — client analysis report
- `02_solution_design.md` — solution designfrom
- `03_pricing_model.md` — price strategyfrom
- `04_differentiation.md` — differentiation strategyfrom
- `05_final_proposal.md` — final proposal and verify report
