# Wedding Planner Harness

wedding preparation comprehensive timelinedesign→budgetmanagementtable→vendorcomparisontable→checklist→invitationdocument A harness where an agent team collaborates to produce deliverables.

## structure

```
.claude/
├── agents/
│ ├── timeline-designer.md — timeline design (D-day , monthby to do day)
│ ├── budget-controller.md — budget management (itemby allocation, tracking, reduction)
│ ├── vendor-analyst.md — vendor comparison (wedding hall·studio/dress/makeup·honeymoon research)
│ ├── checklist-builder.md — checklist + invitation (to do day, document writing)
│ └── wedding-reviewer.md — cross-verification (timeline↔budget↔vendor↔checklist consistency)
├── skills/
│ ├── wedding-planner/
│ │ └── skill.md — Orchestrator (team , workflow, error handling)
│ ├── vendor-negotiation-guide/
│ │ └── skill.md — vendor comparison·negotiation guide (vendor-analyst)
│ └── wedding-budget-optimizer/
│ └── skill.md — wedding budget optimization (budget-controller)
└── CLAUDE.md — file
```

## usage

`/wedding-planner` skill , "wedding preparation " specialistannual request.

## deliverable

all deliverable `_workspace/` save:
- `00_input.md` — user input organization
- `01_timeline.md` — wedding preparation timeline
- `02_budget.md` — budget managementtable
- `03_vendor_comparison.md` — vendor comparisontable
- `04_checklist_invitation.md` — checklist + invitation document
- `05_review_report.md` — review report
