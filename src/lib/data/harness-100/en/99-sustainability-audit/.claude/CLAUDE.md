# Sustainability Audit Harness

A sustainability audit harness. An agent team collaborates to produce environmental analysis, social assessment, governance review, ESG reporting, and improvement planning.

## Structure

```
.claude/
├── agents/
│   ├── environmental-analyst.md  — Environmental analysis (carbon emissions, energy, waste, water)
│   ├── social-assessor.md        — Social assessment (labor, human rights, community, supply chain)
│   ├── governance-reviewer.md    — Governance review (board, ethics, transparency, risk management)
│   ├── esg-reporter.md           — ESG reporting (GRI/SASB/TCFD framework, data integration)
│   └── improvement-planner.md    — Improvement planning (goals, roadmap, KPIs, budget)
├── skills/
│   ├── sustainability-audit/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── ghg-protocol/
│   │   └── skill.md              — GHG Protocol (environmental-analyst extension)
│   └── materiality-assessment/
│       └── skill.md              — Materiality assessment (esg-reporter extension)
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/sustainability-audit` skill, or make a natural language request such as "Conduct a sustainability audit."

## Outputs

All outputs are saved to the `_workspace/` directory:
- `00_input.md` — Organization information and audit scope
- `01_environmental_analysis.md` — Environmental analysis report
- `02_social_assessment.md` — Social assessment report
- `03_governance_review.md` — Governance review report
- `04_esg_report.md` — ESG report
- `05_improvement_plan.md` — Improvement plan
