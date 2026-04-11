# Language Tutor Harness

An agent team harness for foreign language learning: level testing, curriculum design, lessons, quizzes, and review management.

## Structure

```
.claude/
├── agents/
│   ├── level-assessor.md        — Level Assessor (CEFR-based diagnosis, skill area analysis)
│   ├── curriculum-designer.md   — Curriculum Designer (learning path, goals, schedule)
│   ├── lesson-tutor.md          — Lesson Tutor (pedagogy, examples, practice)
│   ├── quiz-master.md           — Quiz Master (by type, difficulty, feedback)
│   └── review-coach.md          — Review Coach (spaced repetition, error management, motivation)
├── skills/
│   ├── language-tutor/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── cefr-assessment/
│   │   └── skill.md             — CEFR Assessment (level diagnosis, skill-based evaluation)
│   └── spaced-repetition/
│       └── skill.md             — Spaced Repetition (Ebbinghaus, optimal review schedule)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/language-tutor` skill, or make a natural language request such as "Help me learn a foreign language."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_level_assessment.md` — Level test results
- `02_curriculum.md` — Learning curriculum
- `03_lessons.md` — Lesson materials
- `04_quizzes.md` — Quizzes
- `05_review_plan.md` — Review plan
- `06_review_report.md` — Review report
