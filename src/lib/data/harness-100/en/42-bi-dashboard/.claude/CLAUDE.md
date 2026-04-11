# BI Dashboard Harness

BI dashboard construction: a harness where an agent team collaborates to perform KPI design → data engineering → dashboard building → report automation → review.

## Structure

```
.claude/
├── agents/
│   ├── kpi-designer.md        — KPI Designer (metric tree, calculation logic, target setting)
│   ├── data-engineer.md       — Data Engineer (data modeling, ETL pipeline, data quality)
│   ├── dashboard-builder.md   — Dashboard Builder (layout, charts, filters, interactivity)
│   ├── report-automator.md    — Report Automator (scheduled reports, alerts, distribution)
│   └── bi-reviewer.md         — BI Reviewer (accuracy verification, UX review, performance optimization)
├── skills/
│   ├── bi-dashboard/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── chart-selector/
│   │   └── skill.md              — Chart type selection guide
│   └── kpi-tree-builder/
│       └── skill.md              — KPI tree design methodology guide
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/bi-dashboard` skill or use natural language like "Build a BI dashboard for me."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and business requirements
- `01_kpi_design.md` — KPI tree and metric definitions
- `02_data_model.md` — Data model and ETL pipeline design
- `03_dashboard_specs/` — Dashboard specifications and layout
- `04_automation_config.md` — Report automation and alert settings
- `05_review_report.md` — Quality review and optimization report
