---
name: incident-postmortem
description: "A full pipeline where an agent team collaborates to generate incident postmortem reports. Systematically performs timeline reconstruction, root cause analysis, impact assessment, and remediation planning. Use this skill for requests like 'write an incident postmortem', 'post-incident analysis report', 'create an incident report', 'incident report', 'root cause analysis', 'RCA report', 'organize incident timeline', 'establish remediation measures', and other incident analysis tasks. Note: real-time incident response (on-call), monitoring system setup, and alert configuration are outside the scope of this skill."
---

# Incident Postmortem — Incident Post-Analysis Pipeline

An agent team collaborates to perform timeline reconstruction -> root cause analysis -> impact assessment -> remediation planning -> report generation.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| timeline-reconstructor | `.claude/agents/timeline-reconstructor.md` | Event collection, chronological ordering, gap identification | general-purpose |
| root-cause-investigator | `.claude/agents/root-cause-investigator.md` | 5 Whys, Fishbone, Fault Tree | general-purpose |
| impact-assessor | `.claude/agents/impact-assessor.md` | User/revenue/SLA/reputation impact assessment | general-purpose |
| remediation-planner | `.claude/agents/remediation-planner.md` | Short/mid/long-term countermeasures, action items | general-purpose |
| postmortem-reviewer | `.claude/agents/postmortem-reviewer.md` | Cross-validation, blameless culture verification | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by Orchestrator)

1. Extract from user input:
    - **Incident Description**: What happened and when
    - **Evidence** (optional): Logs, metric screenshots, chat records, alert records
    - **Impact Information** (optional): Number of affected users, services, duration
    - **Actions Taken** (optional): Emergency measures already performed
2. Create `_workspace/` directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are available, copy them to `_workspace/` and skip the corresponding Phase
5. Determine **execution mode** based on the scope of the request (see "Modes by Task Scale" below)

### Phase 2: Team Assembly and Execution

| Order | Task | Assignee | Dependencies | Deliverable |
|-------|------|----------|-------------|-------------|
| 1 | Timeline Reconstruction | reconstructor | None | `_workspace/01_timeline.md` |
| 2a | Root Cause Analysis | investigator | Task 1 | `_workspace/02_root_cause.md` |
| 2b | Impact Assessment | assessor | Task 1 | `_workspace/03_impact_assessment.md` |
| 3 | Remediation Planning | planner | Tasks 2a, 2b | `_workspace/04_remediation_plan.md` |
| 4 | Final Review | reviewer | Tasks 1-3 | `_workspace/05_review_report.md` |

Tasks 2a (root cause) and 2b (impact) can be **executed in parallel**.

**Inter-team Communication Flow:**
- reconstructor completes -> delivers timeline and trigger candidates to investigator; delivers incident duration and metrics to assessor
- investigator completes -> delivers root cause and contributing factors to planner
- assessor completes -> delivers impact magnitude and SLA violation status to planner
- planner completes -> delivers full countermeasures to reviewer
- reviewer cross-validates all deliverables. Requests fixes for RED Must Fix items (up to 2 times)

### Phase 3: Integrated Report Generation

1. Generate `_workspace/postmortem_report.md` integrating all deliverables
2. Report structure: Summary -> Timeline -> Root Cause -> Impact -> Remediation -> What Went Well -> Lessons Learned
3. Deliver the final report to the user

## Modes by Task Scale

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|----------------|-----------------|
| "Write a postmortem report" | **Full Pipeline** | All 5 agents |
| "Organize the incident timeline" | **Timeline Mode** | reconstructor + reviewer |
| "Analyze the root cause" | **RCA Mode** | reconstructor + investigator + reviewer |
| "Just create remediation measures" (cause analysis exists) | **Remediation Mode** | planner + reviewer |
| "Review this postmortem" | **Review Mode** | reviewer only |

**Leveraging Existing Files**: If the user provides existing timelines, cause analyses, etc., copy the files to the appropriate location in `_workspace/` and skip the corresponding agent's step.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share main deliverables |
| Message-based | SendMessage | Real-time delivery of key information, fix requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient incident information | Ask user additional questions, tag uncertain parts with "[Unconfirmed]" |
| Logs/metrics inaccessible | Reconstruct from verbal accounts, tag with "[Verbal account-based]" |
| Agent failure | Retry once -> if fails, proceed without that deliverable, note omission in review |
| RED found in review | Request fix from relevant agent -> rework -> re-verify (up to 2 times) |
| Blaming language found | Reviewer immediately requests fix — blameless culture is an absolute principle |

## Test Scenarios

### Normal Flow
**Prompt**: "Yesterday at 2 PM the payment service was down for 30 minutes. It happened right after a deployment and was recovered by rollback. Create a postmortem report."
**Expected Result**:
- Timeline: Deployment -> incident start -> detection -> response -> rollback -> recovery in chronological order
- Root Cause: Specific defect in deployed code, contributing factors like no canary deployment
- Impact: User count, revenue loss, SLA impact estimates
- Remediation: SMART action items like canary deployment adoption, auto-rollback, alert improvements
- Integrated Report: Complete postmortem ready for executive reporting

### Existing File Utilization Flow
**Prompt**: "Review this postmortem report" + report attached
**Expected Result**:
- Copy existing report to `_workspace/`
- Execute in review mode
- Verify consistency, completeness, and blameless culture adherence
- Provide improvement suggestions

### Error Flow
**Prompt**: "The API server was slow this morning. Analyze the cause."
**Expected Result**:
- Collect incident details through additional questions (time, impact, actions, etc.)
- Execute RCA mode with collected information
- Clearly mark uncertain parts

## Agent Extension Skills

| Skill | Path | Enhanced Agent | Role |
|-------|------|---------------|------|
| rca-methodology | `.claude/skills/rca-methodology/skill.md` | root-cause-investigator | 5 Whys, Fishbone, Fault Tree, change analysis, cognitive bias prevention |
| sla-impact-calculator | `.claude/skills/sla-impact-calculator/skill.md` | impact-assessor | SLA/SLO/SLI framework, error budgets, revenue loss estimation, severity levels |
