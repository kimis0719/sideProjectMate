# Travel Planner Harness

A harness where an agent team collaborates to generate destination analysis, itinerary, accommodation, budget, and local information for travel planning.

## Structure

```
.claude/
├── agents/
│   ├── destination-analyst.md  — Destination analysis (attractions, seasons, visas, safety)
│   ├── itinerary-designer.md   — Itinerary design (daily routes, routing, time allocation)
│   ├── budget-manager.md       — Budget management (flights, accommodation, meals, transport, etc.)
│   └── local-guide.md          — Local information (transport, restaurants, culture, emergency contacts)
├── skills/
│   ├── travel-planner/
│   │   └── skill.md            — Orchestrator (team coordination, workflow, error handling)
│   ├── route-optimizer/
│   │   └── skill.md            — Route optimization (for itinerary-designer)
│   └── budget-calculator/
│       └── skill.md            — Travel budget calculator (for budget-manager)
└── CLAUDE.md                   — This file
```

## Usage

Trigger the `/travel-planner` skill or make a natural language request like "Plan a trip for me."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_destination_analysis.md` — Destination analysis report
- `02_itinerary.md` — Itinerary
- `03_accommodation.md` — Accommodation guide
- `04_budget.md` — Budget plan
- `05_local_guide.md` — Local information guide
