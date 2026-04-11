# Comic Creator Harness

A harness where an agent team collaborates to produce comics — from storyboarding through dialogue, image generation, and editing — for formats ranging from 4-panel strips to long-form series.

## Structure

```
.claude/
├── agents/
│   ├── storyboarder.md       — Storyboarder (synopsis, storyboard, scene composition, panel layout)
│   ├── dialogue-writer.md    — Dialogue Writer (character dialogue, sound effects, narration)
│   ├── image-generator.md    — Image Generator (Gemini-based panel image creation)
│   ├── comic-editor.md       — Comic Editor (speech bubble placement, page editing, final layout)
│   └── quality-reviewer.md   — Quality Reviewer (story-dialogue-image consistency, continuity checks)
├── skills/
│   ├── comic-creator/
│   │   └── skill.md          — Orchestrator (team coordination, workflow, error handling)
│   ├── panel-composition/
│   │   └── skill.md          — storyboarder+image-generator extension (angles, gaze flow, rhythm)
│   ├── visual-narrative/
│   │   └── skill.md          — dialogue-writer+comic-editor extension (speech bubbles, SFX, SDT)
│   └── character-design-system/
│       └── skill.md          — storyboarder+image-generator extension (character sheets, AI consistency)
└── CLAUDE.md                 — This file
```

## Usage

Trigger the `/comic-creator` skill, or use natural language such as "Create a comic for me" or "Draw a 4-panel comic strip."

## Deliverables

All deliverables are saved to the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_storyboard.md` — Storyboard
- `02_dialogue.md` — Dialogue script
- `03_image_prompts.md` — Image generation prompts and results
- `04_layout.md` — Page layout / editing specification
- `05_review_report.md` — Review report
- `panels/` — Generated panel images
