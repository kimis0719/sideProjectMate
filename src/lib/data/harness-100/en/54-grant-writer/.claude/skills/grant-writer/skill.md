---
name: grant-writer
description: "A grant/funding application full pipeline. An agent team collaborates to generate announcement analysis, business plan, budget, compliance verification, and submission checklist. Use this skill for requests like 'grant application', 'funding program business plan', 'government funding', 'grant proposal', 'write a business plan', 'budget preparation', 'funding program preparation', 'R&D project application', 'startup support program', 'small business support', and other grant/funding application needs. Also supports review of existing business plans. However, actual online system access and submission, supporting document issuance, and presentation coaching for reviewer panels are outside the scope of this skill."
---

# Grant Writer — Grant/Funding Application Full Pipeline

An agent team collaborates to generate announcement analysis, business plan, budget, compliance verification, and submission checklist.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| announcement-analyst | `.claude/agents/announcement-analyst.md` | Announcement analysis, evaluation criteria, key keywords | general-purpose |
| plan-writer | `.claude/agents/plan-writer.md` | Business plan writing, technical/business/execution capability | general-purpose |
| budget-designer | `.claude/agents/budget-designer.md` | Budget preparation, category calculation, settlement guide | general-purpose |
| compliance-checker | `.claude/agents/compliance-checker.md` | Compliance, score optimization, eligibility verification | general-purpose |
| submission-verifier | `.claude/agents/submission-verifier.md` | Document completeness, format check, submission checklist | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by orchestrator)

1. Extract from user input:
    - **Announcement Information**: Announcement document, program name, administering agency (file or URL)
    - **Applicant Information**: Company/institution name, industry, size, core technology/product
    - **Business Idea**: Overview of the proposed project
    - **Existing Materials** (optional): Existing business plans, financial statements, resumes, etc.
2. Create `_workspace/` directory at the project root
3. Organize the input and save to `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/` and skip the corresponding Phase

### Phase 2: Team Assembly and Execution

| Order | Task | Assigned To | Dependencies | Deliverable |
|-------|------|-------------|-------------|-------------|
| 1 | Announcement Analysis | announcement-analyst | None | `_workspace/01_announcement_analysis.md` |
| 2a | Business Plan Writing | plan-writer | Task 1 | `_workspace/02_business_plan.md` |
| 2b | Budget Preparation | budget-designer | Tasks 1, 2a | `_workspace/03_budget_plan.md` |
| 3 | Compliance Verification | compliance-checker | Tasks 1, 2a, 2b | `_workspace/04_compliance_report.md` |
| 4 | Submission Verification | submission-verifier | Tasks 1-3 | `_workspace/05_submission_checklist.md` |

**Inter-team Communication Flow:**
- announcement-analyst completes → delivers evaluation criteria, keywords, strategy to plan-writer; delivers budget regulations to budget-designer
- plan-writer completes → delivers implementation plan and resource needs to budget-designer
- compliance-checker cross-validates business plan + budget. If 🔴 Disqualification Risk found, sends revision request (up to 2 times)
- submission-verifier performs final completeness verification of all documents

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all 🔴 items from compliance report are resolved
3. Report the final summary to the user

## Execution Modes by Request Scale

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|----------------|-----------------|
| "Prepare full funding application" | **Full Pipeline** | All 5 |
| "Analyze this announcement" | **Analysis Mode** | announcement-analyst only |
| "Just write a business plan" | **Plan Mode** | announcement-analyst + plan-writer + compliance-checker |
| "Just prepare the budget" | **Budget Mode** | budget-designer + compliance-checker |
| "Review this business plan" | **Review Mode** | compliance-checker + submission-verifier |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Announcement not provided | Search for announcement by program name via web; if unsuccessful, request from user |
| Insufficient business info | Write general framework based on industry/technology, mark as [Confirmation Required] |
| Eligibility non-compliance found | Analyze alternatives (consortium, joint application, requirement supplementation) |
| Agent failure | Retry once → if still fails, proceed without that deliverable, note omission |
| Regulation violation found | Send revision request → rework → re-validate (up to 2 times) |

## Agent Extension Skills

| Agent | Extension Skill | Role |
|-------|----------------|------|
| compliance-checker, plan-writer | `scoring-optimizer` | Score analysis, high-score writing strategy, disqualification risk checklist, bonus point guide |
| budget-designer | `budget-rule-engine` | Per-category ceiling rules, labor cost rate tables, calculation basis templates, settlement preparation |
