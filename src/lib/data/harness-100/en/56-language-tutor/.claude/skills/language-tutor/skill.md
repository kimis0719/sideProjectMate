---
name: language-tutor
description: "A foreign language learning full pipeline. An agent team collaborates to provide level testing, curriculum design, lesson generation, quizzes, and review management. Use this skill for requests like 'study English', 'learn Japanese', 'learn a foreign language', 'language learning', 'English grammar', 'conversation practice', 'level test', 'vocabulary memorization', 'self-study English', 'beginner Chinese', 'TOEIC preparation', 'English conversation', and other foreign language learning needs. Also supports learning specific skill areas only. However, real-time voice conversation (STT/TTS), native speaker matching, and taking official exams on behalf of the learner are outside the scope of this skill."
---

# Language Tutor — Foreign Language Learning Full Pipeline

An agent team collaborates to deliver level testing, curriculum design, lesson generation, quiz creation, and review management.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| level-assessor | `.claude/agents/level-assessor.md` | CEFR-based level diagnosis, skill-area strength/weakness analysis | general-purpose |
| curriculum-designer | `.claude/agents/curriculum-designer.md` | Customized curriculum, weekly plans, learning strategies | general-purpose |
| lesson-tutor | `.claude/agents/lesson-tutor.md` | Grammar, vocabulary, conversation, reading, and writing lessons | general-purpose |
| quiz-master | `.claude/agents/quiz-master.md` | Varied quiz types, difficulty adjustment, grading | general-purpose |
| review-coach | `.claude/agents/review-coach.md` | Spaced repetition, weakness reinforcement, progress tracking, motivation | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Target language**: Which foreign language the learner wants to study
    - **Native language**: The learner's native language (default: English)
    - **Learning experience**: Prior study experience and self-assessed current level
    - **Learning goal**: Travel / work / exam / immigration / hobby, etc.
    - **Available time**: Weekly hours available for study
    - **Existing materials** (optional): Prior study materials, exam scores, etc.
2. Create a `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`

### Phase 2: Team Assembly and Execution

| Order | Task | Agent | Depends On | Deliverable |
|-------|------|-------|-----------|-------------|
| 1 | Level assessment | level-assessor | None | `_workspace/01_level_assessment.md` |
| 2 | Curriculum design | curriculum-designer | Task 1 | `_workspace/02_curriculum.md` |
| 3 | First lesson | lesson-tutor | Task 2 | `_workspace/03_lesson_01.md` |
| 4 | First quiz | quiz-master | Task 3 | `_workspace/04_quiz_01.md` |
| 5 | Review plan | review-coach | Tasks 2, 3, 4 | `_workspace/05_review_plan.md` |

**Inter-agent communication flow:**
- level-assessor completes -> sends skill-area levels, strengths/weaknesses, learning goals, and available time to curriculum-designer
- curriculum-designer completes -> sends Week 1 topics, grammar, and vocabulary to lesson-tutor; sends milestone criteria to quiz-master
- lesson-tutor completes -> sends key learning items to quiz-master; sends learning items to review-coach
- quiz-master -> sends results to review-coach -> weakness reinforcement + review schedule generated

**Continuous learning cycle:**
Lessons, quizzes, and reviews run iteratively. When the user requests more lessons:
1. lesson-tutor generates the next lesson (`03_lesson_02.md`, `03_lesson_03.md`, ...)
2. quiz-master creates a quiz for that lesson (`04_quiz_02.md`, ...)
3. review-coach updates the review plan + generates a progress report

### Phase 3: Progress Reporting

review-coach periodically generates progress reports:
- `_workspace/06_progress_report.md` — Overall progress, skill-area growth, quiz trends, study patterns

## Task-Scale Modes

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "I want to start learning English" | **Full Pipeline** | All 5 agents |
| "Test my English level" | **Diagnostic Mode** | level-assessor only |
| "Give me an English grammar lesson" | **Lesson Mode** | lesson-tutor (+ level-assessor if needed) |
| "Quiz me on this unit" | **Quiz Mode** | quiz-master only |
| "Create a review plan" | **Review Mode** | review-coach only |
| "Create a TOEIC prep curriculum" | **Exam-Specific Mode** | level-assessor + curriculum-designer + quiz-master |

**Automatic level detection**: If the user does not know their level, provisionally estimate it from the expressions they use in conversation and suggest a diagnostic test.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information exchange, difficulty adjustment requests |
| Task-based | TaskCreate/TaskUpdate | Track progress, manage learning cycles |

File naming convention: `{order}_{deliverable}_{number}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Target language not specified | Default to English, but ask for confirmation |
| Level diagnosis refused | Set provisional level via self-assessment; adjust in first lesson |
| Agent failure | Retry once -> proceed without that deliverable if still failing |
| Difficulty mismatch | Adjust immediately based on learner feedback; update curriculum |
| Limited support for rare languages | Inform the user of supported range; focus on major languages (English, Japanese, Chinese, Spanish, French, German) |

## Test Scenarios

### Normal Flow
**Prompt**: "I want to get better at English speaking. I travel abroad often for work, and I can study about 5 hours per week."
**Expected Results**:
- Level assessment: Adaptive diagnostic test administered; CEFR level determined per skill area
- Curriculum: 12-week business English plan focused on conversation + emails + presentations
- First lesson: Business greetings and self-introduction patterns + 20 key vocabulary items
- Quiz: 15 items based on Lesson 1 content
- Review plan: Spaced repetition schedule + weakness reinforcement activities

### Existing File Flow
**Prompt**: "Build a weakness-focused curriculum based on this TOEIC score report" + score report attached
**Expected Results**:
- Score report copied as reference material in `_workspace/01_level_assessment.md`
- level-assessor determines skill-area levels based on the score report (streamlined diagnostic test)
- curriculum-designer + lesson-tutor + quiz-master + review-coach deployed

### Error Flow
**Prompt**: "Maybe I will try learning a language"
**Expected Results**:
- Target language not specified -> suggest English by default + offer alternatives
- Learning goal unclear -> propose 3 goals (travel / work / hobby) and ask user to choose
- After selection, execute full pipeline

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| review-coach | `spaced-repetition` | SM-2 algorithm, Ebbinghaus forgetting curve, review session design |
| level-assessor | `cefr-assessment` | CEFR 6-level descriptors, adaptive diagnostic tests, CEFR-to-exam mapping |
