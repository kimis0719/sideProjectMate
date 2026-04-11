# Space Concept Board Harness

A harness where an agent team collaborates to generate style analysis, moodboard, color palette, furniture/accessory list, budget sheet, and shopping guide for an interior space concept board.

## Structure

```
.claude/
├── agents/
│   ├── style-analyst.md       — Style analysis (space assessment, style diagnosis, reference collection)
│   ├── moodboard-designer.md  — Moodboard design (color palette, texture, material composition)
│   ├── item-curator.md        — Item curation (furniture/accessory selection, layout suggestions)
│   ├── budget-manager.md      — Budget management (price research, budget sheet, shopping guide)
│   └── concept-reviewer.md    — Cross-verification (style <-> moodboard <-> items <-> budget consistency)
├── skills/
│   ├── space-concept-board/
│   │   └── skill.md           — Orchestrator (team coordination, workflow, error handling)
│   ├── color-harmony-engine/
│   │   └── skill.md           — Color harmony engine (for moodboard-designer)
│   └── spatial-layout-guide/
│       └── skill.md           — Spatial layout guide (for item-curator)
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/space-concept-board` skill, or make a natural language request such as "Help me design a living room interior concept."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_style_analysis.md` — Style analysis report
- `02_moodboard.md` — Moodboard + color palette
- `03_item_list.md` — Furniture/accessory list + layout suggestions
- `04_budget_shopping.md` — Budget sheet + shopping guide
- `05_review_report.md` — Review report
