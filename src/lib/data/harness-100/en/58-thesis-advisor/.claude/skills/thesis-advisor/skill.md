---
name: thesis-advisor
description: "A thesis writing support full pipeline. An agent team collaborates to perform topic selection, literature review, methodology design, writing, and proofreading. Use this skill for requests like 'help with my thesis', 'find a research topic', 'literature review', 'methodology design', 'write my thesis', 'proofread my thesis', 'dissertation', 'journal submission', 'research design', and other academic thesis writing needs. Existing manuscripts or reference lists can augment the relevant phase. However, actual data collection/analysis execution, statistical software operation, and journal submission system operation are outside the scope of this skill."
---

# Thesis Advisor — Thesis Writing Support Full Pipeline

An agent team collaborates to perform topic selection, literature review, methodology design, writing, and proofreading.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| topic-explorer | `.claude/agents/topic-explorer.md` | Topic exploration, research question formulation | general-purpose |
| literature-analyst | `.claude/agents/literature-analyst.md` | Literature survey, critical review | general-purpose |
| methodology-expert | `.claude/agents/methodology-expert.md` | Research design, analysis method selection | general-purpose |
| writing-coach | `.claude/agents/writing-coach.md` | Thesis structure design, draft writing | general-purpose |
| proofreader | `.claude/agents/proofreader.md` | Proofreading, format verification, consistency review | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Discipline**: Major and sub-field
    - **Thesis type**: Master's / Doctoral / Journal article / Undergraduate thesis
    - **Topic of interest** (optional): Specific topic or keywords
    - **Advisor's research area** (optional): Lab research direction
    - **Existing materials** (optional): Existing manuscripts, reference lists, data
    - **Deadline** (optional): Submission date
2. Create a `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. If existing materials are provided, copy them to `_workspace/` and adjust the relevant phase
5. Determine the **execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Agent | Depends On | Deliverable |
|-------|------|-------|-----------|-------------|
| 1 | Topic exploration | topic-explorer | None | `_workspace/01_topic_proposal.md` |
| 2 | Literature review | literature-analyst | Task 1 | `_workspace/02_literature_review.md` |
| 3 | Methodology design | methodology-expert | Tasks 1, 2 | `_workspace/03_methodology_design.md` |
| 4 | Draft writing | writing-coach | Tasks 1, 2, 3 | `_workspace/04_draft_manuscript.md` |
| 5 | Proofreading | proofreader | Task 4 | `_workspace/05_proofread_report.md` |

**Inter-agent communication flow:**
- topic-explorer completes -> sends research questions and keywords to literature-analyst; sends hypotheses and variables to methodology-expert
- literature-analyst completes -> sends methodology trends from prior studies to methodology-expert; sends literature review content to writing-coach
- methodology-expert completes -> sends full methodology design to writing-coach
- writing-coach completes -> sends completed draft to proofreader
- proofreader completes -> on critical findings, requests corrections from the relevant agent (max 2 rounds)

### Phase 3: Integration and Final Report

1. Verify all files in `_workspace/`
2. Confirm that all critical proofreading items have been addressed
3. Report the final summary to the user

## Task-Scale Modes

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Thesis from start to finish", "full support" | **Full Pipeline** | All 5 agents |
| "Help me find a research topic" | **Topic Exploration Mode** | topic-explorer only |
| "Do a literature review" | **Literature Review Mode** | topic-explorer + literature-analyst |
| "Design my methodology" | **Methodology Mode** | methodology-expert only (uses existing RQ) |
| "Write my thesis", "draft writing" | **Writing Mode** | writing-coach + proofreader |
| "Proofread my thesis" (existing manuscript) | **Proofreading Mode** | proofreader only |

**Existing material usage**: If the user provides existing manuscripts, reference lists, etc., skip or augment the relevant phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information exchange, revision requests |
| Task-based | TaskCreate/TaskUpdate | Track progress |

File naming convention: `{order}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Academic DB search failure | Substitute with web search; note "search limited" in report |
| Cannot determine field | Ask user narrowing questions; infer from interests |
| Existing manuscript format unclear | Apply standard dissertation format |
| Agent failure | Retry once -> proceed without that deliverable if still failing |
| Critical finding in proofreading | Request correction from relevant agent -> re-verify (max 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "I want to write an education master's thesis. I'm interested in the impact of flipped learning on learning motivation."
**Expected Results**:
- Topic proposal: Discover research gap in flipped learning x motivation, 3-5 RQs, candidate topic comparison
- Literature review: 20+ prior studies on flipped learning and motivation, theoretical framework
- Methodology: Quasi-experimental design or survey, sample/instruments/analysis methods
- Draft: Master's thesis structure (6 chapters), Introduction through Methods completed
- Proofreading: Format, style, and consistency verification

### Existing File Flow
**Prompt**: "Proofread this manuscript" + thesis file attached
**Expected Results**:
- Proofreading Mode (proofreader only)
- Grammar, format, and consistency verification report

### Error Flow
**Prompt**: "Recommend a thesis topic; I haven't decided on a field yet"
**Expected Results**:
- Ask questions about interests and strengths to narrow the field, then proceed with topic exploration

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| methodology-expert | `research-methodology` | Research design matrix, sample size calculation, validity/reliability, analysis method selection |
| writing-coach, proofreader | `academic-writing-style` | Per-chapter thesis structure, academic style rules, APA citations, proofreading checklist |
