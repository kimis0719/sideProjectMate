---
name: coding-bootcamp
description: "A coding education full pipeline. An agent team collaborates to deliver curriculum design, hands-on exercises, code review, projects, and portfolio building. Use this skill for requests like 'I want to learn coding', 'I want to become a developer', 'programming curriculum', 'coding exercises', 'review my code', 'build a portfolio', 'developer job prep', 'bootcamp', 'project planning', 'tech interview prep', and other coding education needs. Existing code or study history can augment the relevant phase. However, live video lectures, paid learning platform account management, and actual deployment infrastructure setup are outside the scope of this skill."
---

# Coding Bootcamp — Coding Education Full Pipeline

An agent team collaborates to deliver curriculum design, exercises, code review, projects, and portfolio building.

## Execution Mode

**Agent Team** — 4 agents communicate directly via SendMessage and collaborate.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| curriculum-designer | `.claude/agents/curriculum-designer.md` | Curriculum design, tech stack selection | general-purpose |
| exercise-creator | `.claude/agents/exercise-creator.md` | Exercise creation, test cases | general-purpose |
| code-reviewer | `.claude/agents/code-reviewer.md` | Code review, quality feedback | general-purpose |
| mentor | `.claude/agents/mentor.md` | Project design, portfolio, career guidance | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Current level**: Programming experience, languages used
    - **Goal**: Desired role, employment / career switch / side project
    - **Study time** (optional): Weekly available hours
    - **Duration** (optional): Target timeline
    - **Existing code** (optional): Code for review, existing projects
2. Create a `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. Determine the **execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Agent | Depends On | Deliverable |
|-------|------|-------|-----------|-------------|
| 1 | Curriculum design | curriculum-designer | None | `_workspace/01_curriculum.md` |
| 2 | Exercise creation | exercise-creator | Task 1 | `_workspace/02_exercises/` |
| 3a | Code review | code-reviewer | Task 1 | `_workspace/03_code_review.md` |
| 3b | Project design | mentor | Task 1 | `_workspace/04_project_spec.md` |
| 4 | Portfolio guide | mentor | Tasks 3a, 3b | `_workspace/05_portfolio_guide.md` |

Tasks 3a (code review) and 3b (project design) run **in parallel**.

**Inter-agent communication flow:**
- curriculum-designer completes -> sends weekly learning objectives to exercise-creator; sends per-phase quality expectations to code-reviewer; sends overall roadmap to mentor
- exercise-creator completes -> sends model solution verification request to code-reviewer; shares exercise-project connection points with mentor
- code-reviewer completes -> sends learner coding patterns and strengths/weaknesses to mentor
- mentor synthesizes all information to write the project spec and portfolio guide

### Phase 3: Integration and Final Report

1. Verify all files in `_workspace/`
2. Verify consistency across curriculum -> exercises -> project -> portfolio
3. Report the final summary to the user

## Task-Scale Modes

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "I want to learn coding from scratch", "bootcamp" | **Full Pipeline** | All 4 agents |
| "Just create a curriculum" | **Curriculum Mode** | curriculum-designer only |
| "Create exercises for this topic" | **Exercise Mode** | exercise-creator only |
| "Review this code" (code provided) | **Review Mode** | code-reviewer only |
| "Plan a project for me" | **Project Mode** | mentor only |
| "Help me build a portfolio", "job prep" | **Career Mode** | mentor only |

**Existing data usage**: If the user provides existing code, code-reviewer reviews it; if study history is provided, it is reflected in the curriculum.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information exchange |
| Task-based | TaskCreate/TaskUpdate | Track progress |

File naming convention: `{order}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Learner level unclear | Assess with simple diagnostic coding problems |
| Goal undefined | Provide a general full-stack curriculum by default |
| Web search failure | Work from general technology trend knowledge |
| Specialized language/framework | Design around core principles; refer to language-specific resources |
| Agent failure | Retry once -> proceed without that deliverable if still failing |

## Test Scenarios

### Normal Flow
**Prompt**: "I'm a non-developer and I want to become a frontend developer. I can study 3 hours a day and want to get hired within 6 months."
**Expected Results**:
- Curriculum: HTML/CSS -> JS -> React 24-week roadmap
- Exercises: Difficulty-calibrated exercises per week + test cases
- Project: 2-3 portfolio-worthy real-world project specs
- Portfolio: GitHub profile + resume + interview prep guide

### Existing File Flow
**Prompt**: "Take a look at this code" + code file attached
**Expected Results**:
- Review Mode (code-reviewer only)
- Code quality assessment + specific improvement suggestions + growth roadmap

### Error Flow
**Prompt**: "I want to learn coding but have no idea where to start"
**Expected Results**:
- Level diagnosis + interest exploration questions -> provide a general full-stack curriculum
- Default to 2 hours/day study time

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| exercise-creator | `code-kata-generator` | 5-Tier difficulty system, exercise templates, test case design, scaffolding |
| mentor | `tech-interview-prep` | UMPIRE problem-solving method, 4-step system design, STAR behavioral interviews, portfolio integration |
