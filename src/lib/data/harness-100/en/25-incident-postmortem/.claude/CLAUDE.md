# Incident Postmortem Harness

An agent team harness that collaborates to generate incident postmortem reports. Automates the pipeline of timeline reconstruction -> root cause analysis -> impact assessment -> remediation planning -> report generation.

## Structure

```
.claude/
├── agents/
│   ├── timeline-reconstructor.md — Timeline reconstruction (event collection, chronological ordering, gap identification)
│   ├── root-cause-investigator.md — Root cause investigation (5 Whys, Fishbone, Fault Tree)
│   ├── impact-assessor.md        — Impact assessment (users, revenue, SLA, reputation)
│   ├── remediation-planner.md    — Remediation planning (short/mid/long-term, ownership, KPIs)
│   └── postmortem-reviewer.md    — Cross-validation (timeline <-> cause <-> impact <-> remediation consistency)
├── skills/
│   ├── incident-postmortem/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── rca-methodology/
│   │   └── skill.md              — Root cause analysis methodology guide
│   └── sla-impact-calculator/
│       └── skill.md              — SLA/SLO-based impact calculation guide
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/incident-postmortem` skill, or make a natural language request such as "write an incident postmortem."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_timeline.md` — Incident timeline
- `02_root_cause.md` — Root cause analysis
- `03_impact_assessment.md` — Impact assessment
- `04_remediation_plan.md` — Remediation plan
- `05_review_report.md` — Review report
- `postmortem_report.md` — Final integrated postmortem report
