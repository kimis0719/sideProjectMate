---
name: gov-funding-plan
description: "Full pipeline where an agent team collaborates to generate government funding proposal announcement analysis, technical/business section writing, budget planning, documentation preparation, and submission verification. Use this skill for requests like 'write a government funding proposal', 'government project application', 'R&D business plan', 'TIPS business plan', 'government R&D budget planning', 'analyze the announcement', 'write the technical section', 'write the business section', 'government project budget', and other government funding proposal tasks. Also supports budget planning or verification when existing technical or business plans are available. Note: actual online system submission, corporate document issuance, accounting processing, and patent filing are outside the scope of this skill."
---

# Gov Funding Plan — Government Funding Proposal Pipeline

An agent team collaborates to generate announcement analysis, technical and business section writing, budget planning, and submission verification for government funding proposals.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| announcement-analyst | `.claude/agents/announcement-analyst.md` | Announcement analysis, requirements extraction | general-purpose |
| tech-writer | `.claude/agents/tech-writer.md` | Technical section writing | general-purpose |
| biz-writer | `.claude/agents/biz-writer.md` | Business feasibility section writing | general-purpose |
| budget-planner | `.claude/agents/budget-planner.md` | Budget planning and cost allocation | general-purpose |
| submission-reviewer | `.claude/agents/submission-reviewer.md` | Submission quality verification | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Announcement/Program**: Program name, announcement document
    - **Applicant Info**: Company type, size, technology area
    - **Project Overview**: Technology description, development goals
    - **Existing Materials** (optional): Technical plans, business plans, prior proposals
2. Create `_workspace/` directory and save input to `_workspace/00_input.md`
3. Determine execution mode based on request scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Announcement analysis | announcement-analyst | None | `_workspace/01_announcement_analysis.md` |
| 2a | Technical section | tech-writer | Task 1 | `_workspace/02_tech_section.md` |
| 2b | Business section | biz-writer | Task 1 | `_workspace/03_biz_section.md` |
| 3 | Budget planning | budget-planner | Tasks 1, 2a, 2b | `_workspace/04_budget_plan.md` |
| 4 | Submission review | submission-reviewer | Tasks 2a, 2b, 3 | `_workspace/05_review_report.md` |

Tasks 2a and 2b run **in parallel**.

**Inter-agent communication flow:**
- announcement-analyst completes > passes criteria to tech-writer and biz-writer, passes budget guidelines to budget-planner
- tech-writer completes > passes technical needs to budget-planner
- biz-writer completes > passes commercialization costs to budget-planner
- budget-planner completes > passes budget plan to submission-reviewer
- submission-reviewer cross-validates all deliverables. On CRITICAL findings, requests corrections > rework > re-verify (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm all CRITICAL findings addressed
3. Report final summary to user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Write a full proposal" | **Full pipeline** | All 5 agents |
| "Analyze this announcement" | **Analysis mode** | announcement-analyst only |
| "Write the technical section" | **Tech mode** | announcement-analyst + tech-writer + reviewer |
| "Write the business section" | **Biz mode** | announcement-analyst + biz-writer + reviewer |
| "Plan the budget" | **Budget mode** | announcement-analyst + budget-planner + reviewer |
| "Review this proposal" | **Review mode** | submission-reviewer only |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| No announcement document | Request user to provide the announcement or specify the program |
| Technical details insufficient | Request additional technical information from user |
| Budget standards unclear | Apply conservative estimates, flag for user review |
| Agent failure | Retry once > proceed without that deliverable |

## Agent Extension Skills

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| scoring-optimizer | `.claude/skills/scoring-optimizer/skill.md` | submission-reviewer, tech-writer, biz-writer | Evaluation scoring strategy, high-score tactics |
| budget-standard-checker | `.claude/skills/budget-standard-checker/skill.md` | budget-planner, submission-reviewer | Budget compliance verification, cost category standards |
