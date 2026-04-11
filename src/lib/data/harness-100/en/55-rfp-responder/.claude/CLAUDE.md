# RFP Responder Harness

A harness where an agent team collaborates to create RFI/RFP responses: requirements analysis, capability matching, technical proposal, pricing proposal, and differentiation strategy.

## Structure

```
.claude/
├── agents/
│   ├── requirement-analyst.md   — Requirement Analyst (mandatory/optional, evaluation criteria)
│   ├── capability-matcher.md    — Capability Matcher (strength/gap analysis, evidence)
│   ├── technical-proposer.md    — Technical Proposer (architecture, methodology, timeline)
│   ├── pricing-strategist.md    — Pricing Strategist (cost, margin, competitive positioning)
│   └── proposal-reviewer.md    — Proposal Reviewer (requirements-capability-technical-pricing consistency)
├── skills/
│   ├── rfp-responder/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── win-theme-builder/
│   │   └── skill.md             — Win Theme Builder (differentiation, messaging, evidence)
│   └── pricing-calculator/
│       └── skill.md             — Pricing Calculator (cost estimation, margin, discounts)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/rfp-responder` skill, or make a natural language request such as "Create an RFP response."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_requirement_analysis.md` — Requirements analysis
- `02_capability_matching.md` — Capability matching table
- `03_technical_proposal.md` — Technical proposal
- `04_pricing_proposal.md` — Pricing proposal
- `05_review_report.md` — Review report
