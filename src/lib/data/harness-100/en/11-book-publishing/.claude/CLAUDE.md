# Book Publishing Harness

A harness where an agent team collaborates to produce e-book publishing deliverables: manuscript editing, cover design, table of contents, metadata, and distribution setup.

## Structure

```
.claude/
├── agents/
│   ├── manuscript-editor.md     — Editor (structural editing, style correction, consistency)
│   ├── proofreader.md           — Proofreader (spelling, grammar, notation standardization)
│   ├── cover-designer.md        — Cover Designer (cover concept, image generation, typography)
│   ├── metadata-manager.md      — Metadata Manager (ISBN, classification, description, keywords, distribution)
│   └── publishing-reviewer.md   — Publishing Reviewer (quality verification, spec compliance, final check)
├── skills/
│   ├── book-publishing/
│   │   └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── developmental-editing/
│   │   └── skill.md             — manuscript-editor extension (SPINE check, genre-specific editing, pacing)
│   ├── cover-design-psychology/
│   │   └── skill.md             — cover-designer extension (genre conventions, typography, AI prompts)
│   └── book-metadata-seo/
│       └── skill.md             — metadata-manager extension (BISAC/KDC, keywords, AIDA descriptions)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/book-publishing` skill, or make a natural language request such as "Publish my e-book" or "Edit my manuscript."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_edited_manuscript.md` — Edited manuscript
- `02_proofread_report.md` — Proofreading report
- `03_cover_concept.md` — Cover concept/images
- `04_metadata.md` — Metadata/distribution settings
- `05_review_report.md` — Review report
