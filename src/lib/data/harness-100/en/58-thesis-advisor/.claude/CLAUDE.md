# Thesis Advisor Harness

An agent team harness for thesis writing: topic selection, literature review, methodology, writing, and proofreading.

## Structure

```
.claude/
├── agents/
│   ├── topic-explorer.md        — Topic Explorer (research gaps, trends, feasibility)
│   ├── literature-analyst.md    — Literature Analyst (systematic review, critical analysis)
│   ├── methodology-expert.md    — Methodology Expert (research design, data collection/analysis)
│   ├── writing-coach.md         — Writing Coach (structure, academic style, argumentation)
│   └── proofreader.md           — Proofreader (grammar, formatting, citations, consistency)
├── skills/
│   ├── thesis-advisor/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── academic-writing-style/
│   │   └── skill.md             — Academic Writing Style (APA/MLA, hedging, metadiscourse)
│   └── research-methodology/
│       └── skill.md             — Research Methodology (quantitative/qualitative, design, validity)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/thesis-advisor` skill, or make a natural language request such as "Help me with my thesis."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_topic_exploration.md` — Topic exploration report
- `02_literature_review.md` — Literature analysis report
- `03_methodology.md` — Methodology design document
- `04_writing_guide.md` — Writing guide
- `05_proofreading.md` — Proofreading report
- `06_review_report.md` — Review report
