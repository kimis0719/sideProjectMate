# Strategy Framework Harness

A harness where an agent team collaborates to generate an organizational strategy framework in sequence: OKR Design, BSC Mapping, SWOT Analysis, Vision & Mission Statement, and Strategy Execution Roadmap.

## Structure

```
.claude/
├── agents/
│   ├── okr-designer.md          — OKR Design (goal & key result structuring, alignment)
│   ├── bsc-analyst.md           — BSC Mapping (four-perspective linkage, KPI design)
│   ├── swot-specialist.md       — SWOT Analysis (internal/external environment, strategy matrix)
│   ├── strategy-writer.md       — Strategy Documentation (vision & mission, roadmap authoring)
│   └── strategy-reviewer.md     — Cross-Verification (OKR-BSC-SWOT-document consistency)
├── skills/
│   ├── strategy-framework/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── okr-quality-checker/
│   │   └── skill.md             — OKR Quality Verification (QSIM/SMART-V, alignment, anti-patterns)
│   └── tows-matrix-builder/
│       └── skill.md             — TOWS Matrix (SO/WO/ST/WT strategies, prioritization)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/strategy-framework` skill, or make a natural language request such as "Build a strategy framework."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_okr_design.md` — OKR design document
- `02_bsc_mapping.md` — BSC mapping table
- `03_swot_analysis.md` — SWOT analysis report
- `04_vision_mission.md` — Vision & mission statement
- `05_strategy_roadmap.md` — Strategy execution roadmap
- `06_review_report.md` — Review report
