---
name: competency-modeler
description: "Comprehensive competency modeling pipeline. An agent team collaborates to execute the full workflow: job analysis, competency dictionary creation, assessment rubric design, development plan formulation, and competency matrix construction. Use this skill for requests such as 'build a competency model,' 'job analysis,' 'competency dictionary,' 'assessment rubric,' 'competency development plan,' 'competency matrix,' 'KSA analysis,' 'job description,' 'behavioral indicators,' or 'competency assessment.' If existing job descriptions or competency data are provided, the corresponding phase is augmented. Note: integration with actual HR systems (SAP HR, Workday), compensation structure design, and legal HR advisory are outside the scope of this skill."
---

# Competency Modeler — Comprehensive Competency Modeling Pipeline

An agent team collaborates to execute the full workflow: job analysis, competency dictionary, assessment rubric, development plan, and competency matrix.

## Execution Mode

**Agent Team** — Four agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| job-analyst | `.claude/agents/job-analyst.md` | Job analysis, KSA extraction | general-purpose |
| competency-architect | `.claude/agents/competency-architect.md` | Competency definition, behavioral indicators, proficiency levels | general-purpose |
| rubric-designer | `.claude/agents/rubric-designer.md` | Assessment criteria, scoring guides, evaluation tools | general-purpose |
| development-planner | `.claude/agents/development-planner.md` | Development plans, learning paths, matrices | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Target Job**: The job title for which to build the competency model
    - **Organization Info** (optional): Industry, size, organizational culture
    - **Purpose** (optional): Hiring/evaluation/development/promotion/organizational design
    - **Grade Range** (optional): Specific grade or all grades
    - **Existing Materials** (optional): Existing job descriptions, competency frameworks
2. Create the `_workspace/` directory in the project root
3. Organize inputs and save to `_workspace/00_input.md`
4. If existing materials are provided, copy them to `_workspace/` and adjust the relevant phase
5. Determine the **execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Job Analysis | job-analyst | None | `_workspace/01_job_analysis.md` |
| 2 | Competency Dictionary | competency-architect | Task 1 | `_workspace/02_competency_dictionary.md` |
| 3 | Assessment Rubric Design | rubric-designer | Tasks 1, 2 | `_workspace/03_assessment_rubric.md` |
| 4a | Development Plan | development-planner | Tasks 1, 2, 3 | `_workspace/04_development_plan.md` |
| 4b | Competency Matrix | development-planner | Tasks 1, 2, 3 | `_workspace/05_competency_matrix.md` |

**Inter-agent Communication Flow:**
- job-analyst completes -> Delivers KSA mapping and task weights to competency-architect; delivers per-task performance standards to rubric-designer
- competency-architect completes -> Delivers competency definitions, behavioral indicators, and proficiency framework to rubric-designer; delivers competency list and proficiency framework to development-planner
- rubric-designer completes -> Delivers assessment result interpretation guide and gap analysis framework to development-planner
- development-planner synthesizes all information to produce the development plan and matrix

### Phase 3: Integration and Final Report

1. Review all files in `_workspace/`
2. Validate consistency across job analysis, competency dictionary, rubric, and development plan
3. Present the final summary to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|---------------|-----------------|
| "Full competency model," "Complete modeling" | **Full Pipeline** | All 4 agents |
| "Job analysis only," "Write a JD" | **Job Analysis Mode** | job-analyst solo |
| "Create a competency dictionary" | **Dictionary Mode** | job-analyst + competency-architect |
| "Design an assessment rubric" | **Rubric Mode** | rubric-designer solo (uses existing dictionary) |
| "Build a development plan" | **Development Plan Mode** | development-planner solo (uses existing competency data) |
| "Create a competency matrix" | **Matrix Mode** | development-planner solo |

**Leveraging Existing Data**: If the user provides existing job descriptions or competency frameworks, skip or augment the corresponding phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Primary deliverable storage and sharing |
| Message-based | SendMessage | Real-time critical information transfer |
| Task-based | TaskCreate/TaskUpdate | Progress tracking |

File naming convention: `{sequence}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient job information | Collect similar job postings via web search; request additional information from the user |
| High industry specificity | Reference NCS/O*NET standards; leverage industry-specific terminology dictionaries |
| Organization info not provided | Work based on a typical mid-sized company; provide customization guide |
| Multiple job requests | Prioritize one core job; provide framework for the rest in the matrix |
| Agent failure | Retry once; if still failing, proceed without the affected deliverable |

## Test Scenarios

### Normal Flow
**Prompt**: "Build a competency model for a backend developer role at an IT company. Include junior through senior levels."
**Expected Results**:
- Job Analysis: Task analysis, KSA extraction, and NCS mapping for a backend developer
- Competency Dictionary: 10-12 competencies (technical + core), behavioral indicators across 5 proficiency levels
- Assessment Rubric: BARS-based scoring guide, BEI questions, SJT items
- Development Plan: Junior-to-senior growth path, 70:20:10 development activities
- Competency Matrix: Required level mapping by seniority

### Partial Request Flow
**Prompt**: "Write a job description for our company's sales role. We are a mid-sized manufacturer."
**Expected Results**:
- Job Analysis Mode (job-analyst solo)
- Manufacturing sales role job description + KSA extraction

### Existing Data Flow
**Prompt**: "Create an assessment rubric based on this competency dictionary" + existing competency dictionary file
**Expected Results**:
- Rubric Mode (rubric-designer solo)
- BARS scoring guide + evaluation tools based on the existing competency dictionary

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| rubric-designer | `bars-assessment` | BARS 5-level design, BEI questions (STAR-L), SJT items, assessment method comparison |
| job-analyst, competency-architect | `ksa-taxonomy` | KSA-O framework, NCS/O*NET mapping, 5-level proficiency scale, JD standards |
