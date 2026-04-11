# Design System Harness

UI design system construction: a harness in which an agent team collaborates to create design tokens, a component library, Storybook, accessibility verification, and documentation.

## Structure

```
.claude/
├── agents/
│   ├── token-designer.md       — Design tokens (colors, typography, spacing, shadows, motion)
│   ├── component-developer.md  — Component development (React/Vue, variants, composition, state)
│   ├── a11y-auditor.md         — Accessibility verification (WCAG 2.1, ARIA, keyboard, screen reader)
│   ├── storybook-builder.md    — Storybook (stories, interaction tests, documentation)
│   └── doc-writer.md           — Documentation (design principles, usage guides, contribution guide)
├── skills/
│   ├── design-system/
│   │   └── skill.md            — Orchestrator (team coordination, workflow, error handling)
│   ├── wcag-checker/
│   │   └── skill.md            — Accessibility verification (WCAG checklist, contrast ratios, ARIA)
│   └── token-generator/
│       └── skill.md            — Design token generation (color scales, typography, spacing)
└── CLAUDE.md                   — This file
```

## Usage

Trigger the `/design-system` skill, or make a natural language request such as "Build a design system."

## Deliverables

All deliverables are stored in the `_workspace/` directory:
- `00_input.md` — User input and brand information
- `01_design_tokens/` — Design token definition files
- `02_components/` — Component library code
- `03_storybook/` — Storybook stories and configuration
- `04_a11y_report.md` — Accessibility verification report
- `05_docs/` — Design system documentation
