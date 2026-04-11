# Translation & Localization Harness

A harness where an agent team collaborates to perform multilingual translation, localization, cultural adaptation, and terminology management.

## Structure

```
.claude/
├── agents/
│   ├── translator.md            — Translator (source analysis, initial translation, nuance preservation)
│   ├── localizer.md             — Localizer (cultural adaptation, idioms, units of measurement, date formats)
│   ├── terminology-manager.md   — Terminology Manager (glossary building, consistency, industry standards)
│   ├── quality-reviewer.md      — Quality Reviewer (accuracy, fluency, localization suitability verification)
│   └── style-harmonizer.md      — Style Harmonizer (tone & voice consistency, brand voice application)
├── skills/
│   ├── translation-localization/
│   │   └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── translation-quality-mqm/
│   │   └── skill.md             — quality-reviewer extension (MQM error classification, severity, scoring)
│   └── cultural-adaptation-guide/
│       └── skill.md             — localizer extension (market-specific format conversion, cultural taboos, idiom substitution)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/translation-localization` skill, or make a natural language request such as "Translate this document."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_source_analysis.md` — Source analysis/translation strategy
- `02_terminology.md` — Glossary
- `03_translation.md` — Translated text
- `04_localization.md` — Localization applied results
- `05_review_report.md` — Quality review report
