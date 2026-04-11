# Documentary Research Harness

A harness where an agent team collaborates to produce documentary research, treatment plans, interview questions, and narration scripts.

## Structure

```
.claude/
├── agents/
│   ├── researcher.md           — Researcher (research, fact verification, statistics collection)
│   ├── story-architect.md      — Story Architect (3-act treatment, scene division, narrative arc)
│   ├── interviewer.md          — Interviewer (interviewee selection, question design)
│   ├── narrator.md             — Narrator (narration script, tone, rhythm)
│   └── fact-checker.md         — Fact Checker (cross-verification, source confirmation, consistency)
├── skills/
│   ├── documentary-research/
│   │   └── skill.md            — Orchestrator (team coordination, workflow, error handling)
│   ├── investigative-research/
│   │   └── skill.md            — researcher+fact-checker extension (PRIMA, CRAAP, triangulation)
│   ├── narrative-structure/
│   │   └── skill.md            — story-architect+narrator extension (5 narrative types, emotion curves)
│   └── interview-design/
│       └── skill.md            — interviewer extension (VOICE selection, funnel model, ethics)
└── CLAUDE.md                   — This file
```

## Usage

Trigger the `/documentary-research` skill, or make a natural language request such as "Plan a documentary."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_research_brief.md` — Research brief
- `02_structure.md` — Treatment/structure design
- `03_interview_guide.md` — Interview guide
- `04_narration_script.md` — Narration script
- `05_review_report.md` — Fact-check/review report
