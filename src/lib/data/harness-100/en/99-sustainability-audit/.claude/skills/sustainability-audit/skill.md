---
name: sustainability-audit
description: "Full audit pipeline for ESG/sustainability where an agent team collaborates to generate environmental, social, and governance assessments along with an integrated report and improvement plan. Use this skill for requests such as 'run an ESG audit', 'write a sustainability report', 'ESG assessment', 'carbon emissions calculation', 'ESG rating diagnosis', 'governance review', 'social responsibility assessment', 'GRI report', 'TCFD disclosure', 'ESG improvement plan', and other ESG/sustainability tasks. Also supports assessment of specific pillars (E/S/G) only or improving existing reports. However, actual on-site audit execution, third-party verification certificate issuance, ESG rating agency score changes, and carbon credit trading are outside the scope of this skill."
---

# Sustainability Audit — ESG/Sustainability Audit Full Pipeline

An agent team collaborates to generate environmental, social, and governance assessments along with an integrated report and improvement plan.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| environmental-analyst | `.claude/agents/environmental-analyst.md` | Carbon emissions, energy, waste, water resources | general-purpose |
| social-assessor | `.claude/agents/social-assessor.md` | Labor, human rights, DEI, supply chain | general-purpose |
| governance-reviewer | `.claude/agents/governance-reviewer.md` | Board, ethics, compliance | general-purpose |
| esg-reporter | `.claude/agents/esg-reporter.md` | GRI/SASB/TCFD report writing | general-purpose |
| improvement-planner | `.claude/agents/improvement-planner.md` | Improvement roadmap, KPIs, investment plan | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Company Information**: Company name, industry, size (revenue/headcount), listing status
    - **Audit Scope** (optional): Full E/S/G or specific pillars
    - **Existing Materials** (optional): Annual reports, existing ESG reports, emissions data
    - **Objectives** (optional): ESG rating target, regulatory compliance, investor requirements
    - **Constraints** (optional): Timeline, budget, specified reporting framework
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it as `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/` and use as reference materials
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1a | Environmental Assessment | environmental | None | `_workspace/01_environmental_assessment.md` |
| 1b | Social Assessment | social | None | `_workspace/02_social_assessment.md` |
| 1c | Governance Assessment | governance | None | `_workspace/03_governance_assessment.md` |
| 2 | Integrated Report | reporter | Tasks 1a, 1b, 1c | `_workspace/04_esg_report.md` |
| 3 | Improvement Plan | planner | Tasks 1a, 1b, 1c, 2 | `_workspace/05_improvement_plan.md` |
| 4 | Cross-Validation | orchestrator | All | `_workspace/06_review_report.md` |

Tasks 1a, 1b, and 1c (E/S/G assessments) run **in parallel**. The three pillars can be assessed independently.

**Inter-Agent Communication Flow:**
- E/S/G analysts mutually: Cross-share inter-pillar issues (environmental -> social impact, governance -> environmental policies)
- E/S/G complete -> deliver pillar data and ratings to reporter
- E/S/G complete -> deliver weaknesses, risks, and improvement opportunities to planner
- reporter completes -> deliver report targets/commitments to planner
- orchestrator cross-validates overall consistency

### Phase 3: Integration and Final Deliverables

1. Verify consistency across all files in `_workspace/`
2. Detect discrepancies across E/S/G assessments, report, and improvement plan
3. Generate the cross-validation report
4. Report the final summary to the user

## Execution Modes by Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Run an ESG audit", "Sustainability report" | **Full Audit** | All 5 agents |
| "Just calculate carbon emissions" | **Environmental Only** | environmental only |
| "Just review governance" | **Governance Only** | governance only |
| "Create an ESG improvement plan" + existing report | **Improvement Mode** | planner only |
| "Convert this report to GRI format" | **Report Mode** | reporter only |
| "Just review environmental and social" | **Partial Audit** | relevant pillars + reporter |

**Using Existing Files**: When the user provides existing ESG reports, annual reports, etc., use them as reference materials to improve accuracy.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-Based | `_workspace/` directory | Store and share main deliverables |
| Message-Based | SendMessage | Cross-pillar issue sharing, correction requests |
| Task-Based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Company data unavailable | Estimate using industry averages, attach "Estimate" label |
| Web search failure | Work with general ESG standards, note "Data limitations" |
| Industry-specific standards unknown | Search based on SASB industry classification, apply general standards if unavailable |
| Agent failure | Retry once -> if still fails, proceed with that pillar omitted |
| E/S/G inconsistency | Detected in cross-validation -> request corrections from relevant agent (up to 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "Run an ESG audit for our company (manufacturing, 500 employees, $100M revenue). Also write a GRI-based report."
**Expected Results**:
- Environmental: Manufacturing-specific Scope 1/2 emission estimates, waste/water quality assessment
- Social: Serious accident law compliance, accident rates, DEI metrics
- Governance: Board structure, compliance, internal controls
- Report: GRI Standards-based integrated report, materiality assessment
- Improvement: Prioritized 3-year roadmap

### Partial Audit Flow
**Prompt**: "Calculate our carbon emissions and create a reduction roadmap"
**Expected Results**:
- Deploy environmental + planner
- Scope 1/2/3 emissions calculation
- Reduction target setting (SBTi-based) + reduction roadmap

### Error Flow
**Prompt**: "Write an ESG report, but I don't have any data"
**Expected Results**:
- Write an "estimate-based ESG report" using industry average data
- Attach "Estimate" labels to all data
- Provide a separate data request list for actual data collection

## Agent Extension Skills

| Extension Skill | Path | Target Agent | Role |
|----------------|------|-------------|------|
| ghg-protocol | `.claude/skills/ghg-protocol/skill.md` | environmental-analyst | Scope 1/2/3 emission calculation, emission factors, SBTi targets |
| materiality-assessment | `.claude/skills/materiality-assessment/skill.md` | esg-reporter, improvement-planner | Double materiality, matrix, industry-specific issues, KPIs |
