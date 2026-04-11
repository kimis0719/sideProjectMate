---
name: exam-prep
description: "An exam preparation full pipeline. An agent team collaborates to perform trend analysis, weakness diagnosis, customized study planning, mock exam creation, and error analysis. Use this skill for requests like 'help me prepare for an exam', 'create a mock exam', 'analyze past exams', 'diagnose weaknesses', 'error analysis', 'college entrance prep', 'certification exam', 'civil service exam', 'TOEIC prep', 'create a study plan', and other exam preparation needs. Existing score reports or error data can be used to augment the diagnostic phase. However, actual exam registration/payment, academy recommendations, and live lecture delivery are outside the scope of this skill."
---

# Exam Prep — Exam Preparation Full Pipeline

An agent team collaborates to perform trend analysis, weakness diagnosis, customized study planning, mock exam creation, and error analysis.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| trend-analyst | `.claude/agents/trend-analyst.md` | Exam trend analysis, frequently tested area identification | general-purpose |
| diagnostician | `.claude/agents/diagnostician.md` | Weakness diagnosis, vulnerability identification | general-purpose |
| learning-designer | `.claude/agents/learning-designer.md` | Customized study plan design, material assembly | general-purpose |
| examiner | `.claude/agents/examiner.md` | Mock exam creation, answer explanation writing | general-purpose |
| error-analyst | `.claude/agents/error-analyst.md` | Error analysis, remediation strategy formulation | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Exam name**: Which exam is being prepared for (college entrance, civil service, certification, TOEIC, etc.)
    - **Subject/area**: All subjects or a specific subject
    - **Current level** (optional): Existing scores, mock exam results, self-assessment
    - **Goal** (optional): Target score, pass threshold
    - **Remaining time** (optional): Time until the exam
    - **Existing data** (optional): Score reports, error notebooks, study history
2. Create a `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. If existing data is provided, copy it to `_workspace/` and adjust the relevant phase accordingly
5. Determine the **execution mode** based on the scope of the request (see "Task-Scale Modes" below)

### Phase 2: Team Assembly and Execution

| Order | Task | Agent | Depends On | Deliverable |
|-------|------|-------|-----------|-------------|
| 1 | Trend analysis | trend-analyst | None | `_workspace/01_trend_analysis.md` |
| 2 | Weakness diagnosis | diagnostician | Task 1 | `_workspace/02_diagnosis_report.md` |
| 3 | Study plan design | learning-designer | Tasks 1, 2 | `_workspace/03_learning_plan.md` |
| 4 | Mock exam creation | examiner | Tasks 1, 2, 3 | `_workspace/04_mock_exam.md`, `04_mock_exam_answer.md` |
| 5 | Error analysis | error-analyst | Task 4 | `_workspace/05_error_analysis.md` |

**Inter-agent communication flow:**
- trend-analyst completes -> sends frequently tested areas and trap types to diagnostician; sends predicted topics to learning-designer; sends frequency and difficulty data to examiner
- diagnostician completes -> sends weak areas, weakness types, and goal gap to learning-designer; sends weakness-focused item requests to examiner
- learning-designer completes -> sends study scope and difficulty guide to examiner
- examiner completes -> sends question sheet, answer key, and item design intents to error-analyst
- error-analyst completes -> feeds remediation items back to learning-designer; sends next-exam reflection items to examiner

### Phase 3: Integration and Final Report

1. Verify all files in `_workspace/`
2. Confirm that the error analysis remediation suggestions are reflected in the study plan
3. Report the final summary to the user:
    - Trend analysis — `01_trend_analysis.md`
    - Weakness diagnosis — `02_diagnosis_report.md`
    - Customized study plan — `03_learning_plan.md`
    - Mock exam question sheet — `04_mock_exam.md`
    - Mock exam answer key — `04_mock_exam_answer.md`
    - Error analysis — `05_error_analysis.md`

## Task-Scale Modes

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Full course exam prep", "comprehensive analysis" | **Full Pipeline** | All 5 agents |
| "Just analyze past exams", "show me trends" | **Trend Analysis Mode** | trend-analyst only |
| "Identify my weaknesses", "diagnose me" | **Diagnostic Mode** | trend-analyst + diagnostician |
| "Create a study plan" | **Study Design Mode** | trend-analyst + diagnostician + learning-designer |
| "Just create a mock exam" | **Mock Exam Mode** | trend-analyst + examiner |
| "Analyze my mock exam errors" (existing data) | **Error Analysis Mode** | error-analyst only |

**Existing data usage**: If the user provides score reports, existing error notebooks, etc., store the data in `_workspace/` and augment the relevant phase's analysis.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information exchange, remediation requests |
| Task-based | TaskCreate/TaskUpdate | Track progress, manage dependencies |

File naming convention: `{order}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Exam info search failure | Ask user to confirm exam format directly; work from general knowledge |
| Insufficient past exam data | Analyze within available range; note "data limited" in report |
| User non-response (diagnostic items) | Substitute with self-assessment checklist; perform subjective diagnosis |
| Excessive subject scope | Process core subjects first; guide remaining subjects to follow-up requests |
| Agent failure | Retry once -> proceed without that deliverable if still failing |

## Test Scenarios

### Normal Flow
**Prompt**: "Help me prepare for the AWS Solutions Architect certification. I have one month left, and I passed the Cloud Practitioner with 75%."
**Expected Results**:
- Trend analysis: Most recent 3-year exam trends, frequently tested domains
- Diagnosis: Weakness areas inferred from 75% Cloud Practitioner score + diagnostic items provided
- Study plan: 30-day schedule, weakness-area-focused curriculum
- Mock exam: Certification-format mock questions (scenario-based + multi-select)
- Error analysis: Pattern analysis + remediation plan

### Existing File Flow
**Prompt**: "Analyze my mock exam results" + error data attached
**Expected Results**:
- Switches to Error Analysis Mode (error-analyst only)
- Pattern analysis based on the attached data
- Remediation study plan proposal

### Error Flow
**Prompt**: "Help me study for an exam"
**Expected Results**:
- Exam not specified -> ask which exam
- Confirm target score / pass threshold
- After minimum information acquired, proceed with full pipeline

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| examiner, learning-designer | `bloom-taxonomy-engine` | Bloom's 6-level question design, exam-type distribution guide, learning activity mapping |
| error-analyst, diagnostician | `error-pattern-analyzer` | 5-Type error classification, concept deficit tracking, remediation priority calculation |
