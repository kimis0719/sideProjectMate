# Competency Modeler Harness

A harness where an agent team collaborates to perform the full competency modeling pipeline: job analysis → competency dictionary → assessment rubric design → development plan → competency matrix.

## Structure

```
.claude/
├── agents/
│   ├── job-analyst.md            — Job Analyst (job descriptions, task analysis, KSA extraction)
│   ├── competency-architect.md   — Competency Architect (competency definitions, behavioral indicators, proficiency levels)
│   ├── rubric-designer.md        — Rubric Designer (assessment criteria, scoring guides, assessment tools)
│   └── development-planner.md    — Development Planner (competency development, learning paths, matrix)
├── skills/
│   ├── competency-modeler/
│   │   └── skill.md              — Orchestrator (team coordination, workflow, error handling)
│   ├── bars-assessment/
│   │   └── skill.md              — BARS Assessment Design (behavioral anchors, BEI questions, SJT items)
│   └── ksa-taxonomy/
│       └── skill.md              — KSA Taxonomy (NCS/O*NET mapping, competency levels, JD standards)
└── CLAUDE.md                     — This file
```

## Usage

Trigger the `/competency-modeler` skill, or make a natural language request such as "build a competency model."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_job_analysis.md` — Job analysis report
- `02_competency_dictionary.md` — Competency dictionary
- `03_assessment_rubric.md` — Assessment rubric
- `04_development_plan.md` — Competency development plan
- `05_competency_matrix.md` — Competency matrix
