# Startup Launcher Harness

Startup launch planning: a harness where an agent team collaborates to perform market analysis → business modeling → MVP architecture → pitch deck creation → launch review.

## Structure

```
.claude/
├── agents/
│   ├── market-analyst.md      — Market Analyst (TAM/SAM/SOM, competitor analysis, trend research)
│   ├── business-modeler.md    — Business Modeler (business model canvas, revenue model, unit economics)
│   ├── mvp-architect.md       — MVP Architect (feature prioritization, tech stack, development roadmap)
│   ├── pitch-creator.md       — Pitch Creator (pitch deck, storytelling, investor presentation)
│   └── launch-reviewer.md    — Launch Reviewer (feasibility assessment, risk analysis, go-to-market review)
├── skills/
│   ├── startup-launcher/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── pitch-deck-framework/
│   │   └── skill.md              — Pitch deck structure and storytelling framework
│   └── unit-economics-calculator/
│       └── skill.md              — Unit economics calculation methodology
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/startup-launcher` skill or use natural language like "Help me plan a startup launch."

## Outputs

All outputs are stored in the `_workspace/` directory:
- `00_input.md` — User input and startup idea
- `01_market_analysis.md` — Market analysis report
- `02_business_model.md` — Business model and revenue plan
- `03_mvp_plan.md` — MVP architecture and development roadmap
- `04_pitch_deck.md` — Pitch deck content
- `05_launch_review.md` — Launch feasibility review report
