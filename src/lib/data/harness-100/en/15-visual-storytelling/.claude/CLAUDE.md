# Visual Storytelling Harness

A harness where an agent team collaborates to produce visual storytelling: story design, text writing, AI image generation, HTML layout, and integrated editing.

## Structure

```
.claude/
├── agents/
│   ├── story-architect.md       — Story Design (narrative structure, scene composition, visual-text balance)
│   ├── essay-writer.md          — Essay Writer (body text, captions, quotes, emotional prose)
│   ├── image-prompter.md        — Image Prompter (Gemini prompt design, style consistency)
│   ├── layout-builder.md        — Layout Builder (HTML/CSS production, responsive, typography)
│   └── editorial-reviewer.md    — Editorial Reviewer (story<->text<->image<->layout consistency)
├── skills/
│   ├── visual-storytelling/
│   │   └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── image-prompt-engineering/
│   │   └── skill.md             — image-prompter extension (5-Layer prompts, style keywords, consistency techniques)
│   └── narrative-structure-patterns/
│       └── skill.md             — story-architect extension (3-act/5-act/hero's journey, emotion curves, visual rhythm)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/visual-storytelling` skill, or make a natural language request such as "Create a visual story."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_story_blueprint.md` — Story blueprint
- `02_essay_text.md` — Essay body text
- `03_image_prompts.md` — Image prompt sheet
- `04_layout.html` — HTML layout
- `05_review_report.md` — Editorial review report
- `images/` — Generated images directory
