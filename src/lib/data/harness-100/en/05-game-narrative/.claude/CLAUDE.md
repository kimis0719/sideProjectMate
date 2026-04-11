# Game Narrative Harness

A harness where an agent team collaborates to design game story, quests, dialogue, and branching scenarios.

## Structure

```
.claude/
├── agents/
│   ├── worldbuilder.md        — World Designer (setting, factions, history, rules)
│   ├── quest-designer.md      — Quest Designer (main/side quests, reward systems)
│   ├── dialogue-writer.md     — Dialogue Writer (NPC dialogue, choices, emotional direction)
│   ├── branch-architect.md    — Branch Architect (branching structures, endings, flag systems)
│   └── narrative-reviewer.md  — Narrative Reviewer (consistency, balance, quality verification)
├── skills/
│   ├── game-narrative/
│   │   └── skill.md           — Orchestrator (team coordination, workflow, error handling)
│   ├── quest-design-patterns/
│   │   └── skill.md           — quest-designer extension (12 archetypes, DRIP rewards, difficulty curves)
│   ├── dialogue-systems/
│   │   └── skill.md           — dialogue-writer extension (VOICE framework, choice psychology, barks)
│   └── branching-logic/
│       └── skill.md           — branch-architect extension (6 branching patterns, flags, endings)
└── CLAUDE.md                  — This file
```

## Usage

Trigger the `/game-narrative` skill, or make a natural language request such as "Create a game scenario."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_worldbuilding.md` — World-building document
- `02_quest_design.md` — Quest design document
- `03_dialogue_script.md` — Dialogue script
- `04_branch_map.md` — Branching structure map
- `05_review_report.md` — Review report
