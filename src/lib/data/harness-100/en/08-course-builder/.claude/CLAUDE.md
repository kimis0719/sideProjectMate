# Course Builder Harness

A harness where an agent team collaborates to produce online courses from curriculum design through lesson plans, quizzes, and hands-on labs.

## Structure

```
.claude/
├── agents/
│   ├── curriculum-designer.md   — Curriculum Designer (learning objectives, curriculum, module structure)
│   ├── content-writer.md        — Content Writer (lesson plans, slides, instructor notes)
│   ├── quiz-maker.md            — Quiz Maker (formative assessment, summative assessment, feedback)
│   ├── lab-designer.md          — Lab Designer (hands-on labs, projects, rubrics)
│   └── course-reviewer.md      — Course Reviewer (learning objective alignment, difficulty, quality)
├── skills/
│   ├── course-builder/
│   │   └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── learning-design/
│   │   └── skill.md             — curriculum-designer+content-writer extension (Bloom's, Gagne, cognitive load)
│   ├── assessment-engineering/
│   │   └── skill.md             — quiz-maker extension (item design, distractor psychology, rubrics)
│   └── lab-scaffolding/
│       └── skill.md             — lab-designer extension (5-level pyramid, starter code, capstone)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/course-builder` skill, or use natural language such as "Create an online course" or "Design a curriculum."

## Deliverables

All deliverables are saved to the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_curriculum.md` — Curriculum / course design document
- `02_lesson_plans.md` — Lesson plans / instructor notes
- `03_quizzes.md` — Quizzes / assessment items
- `04_labs.md` — Hands-on labs / projects
- `05_review_report.md` — Review report
