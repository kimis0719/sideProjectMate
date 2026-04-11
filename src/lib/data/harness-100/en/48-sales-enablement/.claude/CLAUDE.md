# Sales Enablement Harness

A sales enablement pipeline where an agent team collaborates to produce: Customer Analysis, Proposal, Presentation, and Follow-up Plan.

## Structure

```
.claude/
├── agents/
│   ├── customer-analyst.md      — Customer Analysis (needs, decision structure, budget, competitive landscape)
│   ├── proposal-writer.md       — Proposal Writing (solution matching, pricing, ROI calculation)
│   ├── presenter.md             — Presentation Design (storyline, slide structure)
│   ├── followup-manager.md      — Follow-up Management (scheduling, emails, objection handling)
│   └── sales-reviewer.md        — Cross-Verification (customer-proposal-presentation-followup consistency)
├── skills/
│   ├── sales-enablement/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── roi-calculator/
│   │   └── skill.md             — ROI Calculator (TCO, Payback, value quantification)
│   └── objection-handler/
│       └── skill.md             — Objection Handling (BANT+C, LAER, negotiation strategy)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/sales-enablement` skill, or make a natural language request such as "Create a sales proposal."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_customer_analysis.md` — Customer analysis report
- `02_proposal.md` — Proposal
- `03_presentation.md` — Presentation outline
- `04_followup_plan.md` — Follow-up plan
- `05_review_report.md` — Review report
