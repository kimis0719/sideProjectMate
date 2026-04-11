# Public Speaking Harness

 comprehensive speechdocument→presentationversus→debatepreparationfrom→Q&Aexpectedanswer→rehearsalguide A harness where an agent team collaborates to produce deliverables.

## structure

```
.claude/
├── agents/
│ ├── audience-analyst.md — audience analysis (target audience, context, expected)
│ ├── speech-writer.md — speech/presentation work (speechdocument, presentationversus)
│ ├── debate-preparer.md — debate preparation expert (, counterargument, gapdocument)
│ ├── qa-strategist.md — Q&A strategy (expected question, answer strategy)
│ └── rehearsal-coach.md — rehearsal value and cross-verification (delivercapability, consistency)
├── skills/
│ ├── public-speaking/
│ │ └── skill.md — Orchestrator (team , workflow, error handling)
│ ├── rhetoric-patterns/
│ │ └── skill.md — numbercompany pattern library (speech-writer extension)
│ └── audience-engagement/
│ └── skill.md — audience strategy (audience-analyst extension)
└── CLAUDE.md — file
```

## usage

`/public-speaking` skill , "speechdocument " specialistannual request.

## deliverable

all deliverable `_workspace/` save:
- `00_input.md` — user input organization
- `01_audience_analysis.md` — audience analysis report
- `02_speech_script.md` — speechdocument/presentation versus
- `03_debate_prep.md` — debate preparationfrom
- `04_qa_playbook.md` — Q&A expected answer
- `05_rehearsal_guide.md` — rehearsal guide and verify report
