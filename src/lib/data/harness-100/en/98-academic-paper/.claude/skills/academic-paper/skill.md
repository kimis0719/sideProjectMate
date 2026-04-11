---
name: academic-paper
description: "Full research pipeline for academic paper writing where an agent team collaborates to generate research design, experiment protocols, analysis, manuscript writing, and submission preparation. Use this skill for requests such as 'write an academic paper', 'research paper writing', 'help me write a paper', 'design a study', 'run statistical analysis', 'prepare journal submission', 'manuscript writing', 'research methodology design', 'hypothesis testing', 'academic writing', and other academic research paper tasks. Also supports analysis, rewriting, and submission preparation when existing data or drafts are available. However, actual data collection execution, official IRB submission, journal system login and upload, and running actual statistical software are outside the scope of this skill."
---

# Academic Paper — Academic Paper Writing Full Pipeline

An agent team collaborates to generate research design, experiment protocols, analysis, manuscript writing, and submission preparation for an academic paper.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| research-designer | `.claude/agents/research-designer.md` | Research questions, hypotheses, methodology, prior literature | general-purpose |
| experiment-manager | `.claude/agents/experiment-manager.md` | Experiment protocols, data collection planning | general-purpose |
| statistical-analyst | `.claude/agents/statistical-analyst.md` | Statistical analysis, code generation, visualization | general-purpose |
| paper-writer | `.claude/agents/paper-writer.md` | IMRaD-structured writing, citation management | general-purpose |
| submission-preparer | `.claude/agents/submission-preparer.md` | Journal selection, formatting, cover letter | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Research Topic**: Research field, core keywords
    - **Research Level** (optional): Undergraduate/Master's/Doctoral/Faculty level
    - **Target Journal** (optional): Journal name, IF range
    - **Existing Materials** (optional): Data, drafts, literature lists
    - **Constraints** (optional): Deadline, length, special considerations
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it as `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Research Design | designer | None | `_workspace/01_research_design.md` |
| 2 | Experiment Protocol | experiment | Task 1 | `_workspace/02_experiment_protocol.md` |
| 3 | Statistical Analysis | analyst | Tasks 1, 2 | `_workspace/03_analysis_report.md` |
| 4 | Manuscript Writing | writer | Tasks 1, 2, 3 | `_workspace/04_manuscript.md` |
| 5 | Submission Preparation | preparer | Tasks 1, 4 | `_workspace/05_submission_package.md` |
| 6 | Integrated Review | orchestrator | All | `_workspace/06_review_report.md` |

**Inter-Agent Communication Flow:**
- designer completes -> delivers variables and sampling plan to experiment, hypotheses and analysis direction to analyst, theoretical background to writer, research field to preparer
- experiment completes -> delivers data structure to analyst, Methods materials to writer
- analyst completes -> delivers Results materials (APA format + Tables/Figures) to writer, analysis code to preparer
- writer completes -> delivers completed manuscript to preparer
- orchestrator cross-validates overall consistency (hypotheses <-> analysis <-> results <-> discussion)

### Phase 3: Integration and Final Deliverables

1. Verify consistency across all files in `_workspace/`
2. Validate logical consistency of hypotheses-analysis-results-discussion chain
3. Generate the integrated review report
4. Report the final summary to the user

## Execution Modes by Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Write a paper", "Research paper writing" | **Full Pipeline** | All 5 agents |
| "Just design the study" | **Design Mode** | designer only |
| "Analyze this data" + data | **Analysis Mode** | analyst + writer |
| "Polish this manuscript draft" + draft | **Rewriting Mode** | writer + preparer |
| "Prepare for submission" + manuscript | **Submission Mode** | preparer only |
| "Continue with the rest using this design" + design doc | **Continuation Mode** | experiment -> analyst -> writer -> preparer |

**Using Existing Files**: When the user provides data, drafts, or design documents, copy them to `_workspace/` and skip the corresponding phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-Based | `_workspace/` directory | Store and share main deliverables |
| Message-Based | SendMessage | Real-time key information delivery, correction requests |
| Task-Based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Prior literature search failure | Work from user-provided references, note "Limited literature review" |
| Vague research topic | Propose 3 specific sub-topics and request user selection |
| No data available | Provide analysis strategy and code only, instruct "Run after data collection" |
| Agent failure | Retry once -> if still fails, proceed without that deliverable, note omission in review |
| Hypothesis-results mismatch | Paper writer addresses in Discussion, suggests post-hoc analyses |

## Test Scenarios

### Normal Flow
**Prompt**: "Write a paper studying the effect of social media usage time on college students' academic achievement. Survey-based."
**Expected Results**:
- Design: Cross-sectional survey design, social media time (IV) -> GPA (DV), control variables included
- Protocol: Questionnaire (using existing validated scales), online collection procedure
- Analysis: Multiple regression code (R/Python), APA-format results
- Manuscript: Complete IMRaD structure, prior study citations
- Submission: 3 SSCI journal recommendations, cover letter

### Existing File Flow
**Prompt**: "Analyze this data and write the paper" + CSV data attached
**Expected Results**:
- Identify variable structure from the data to develop analysis strategy
- Lightly deploy designer to reverse-extract research framework
- Proceed in order: analyst -> writer -> preparer

### Error Flow
**Prompt**: "Write a paper, but I haven't decided on a topic yet"
**Expected Results**:
- designer asks about the user's area of interest, or
- suggests 3 research topics based on recent trends
- Review report notes "Topic undetermined — proceeded on example basis"

## Agent Extension Skills

| Extension Skill | Path | Target Agent | Role |
|----------------|------|-------------|------|
| research-methodology | `.claude/skills/research-methodology/skill.md` | research-designer, statistical-analyst | Research design, sampling, statistical analysis, ethics |
| citation-standards | `.claude/skills/citation-standards/skill.md` | paper-writer, submission-preparer | APA/IEEE/Chicago citation, IMRaD, submission preparation |
