# Coding Bootcamp Harness

A harness where an agent team collaborates to deliver coding education: curriculum design, hands-on exercises, code review, projects, and portfolio building.

## Structure

```
.claude/
├── agents/
│   ├── curriculum-designer.md   — Curriculum Designer (learning path, tech stack, schedule)
│   ├── exercise-creator.md      — Exercise Creator (by difficulty, project-based)
│   ├── code-reviewer.md         — Code Reviewer (quality, patterns, improvements)
│   └── mentor.md                — Mentor (learning strategy, motivation, career)
├── skills/
│   ├── coding-bootcamp/
│       └── skill.md             — Orchestrator (team coordination, workflow, error handling)
│   ├── code-kata-generator/
│   │   └── skill.md             — Code Kata Generator (algorithms, patterns, difficulty)
│   └── tech-interview-prep/
│       └── skill.md             — Tech Interview Prep (by type, mock interviews)
└── CLAUDE.md                    — This file
```

## Usage

Trigger the `/coding-bootcamp` skill, or make a natural language request such as "Help me learn to code."

## Deliverables

All deliverables are saved in the `_workspace/` directory:
- `00_input.md` — Organized user input
- `01_curriculum.md` — Curriculum
- `02_exercises.md` — Practice exercises
- `03_code_review.md` — Code review results
- `04_project_guide.md` — Project guide
- `05_review_report.md` — Review report
