---
name: debate-simulator
description: "A debate simulation full pipeline. An agent team collaborates to perform topic analysis, pro argument construction, con argument construction, cross-examination, judge evaluation, and comprehensive report writing. Use this skill for requests like 'run a debate simulation', 'build pro and con arguments', 'debate', 'debate preparation', 'argument analysis', 'pro vs con', 'debate topic analysis', 'cross-examination practice', 'debate competition prep', and other debate-related needs. Existing arguments or debate materials can augment the relevant phase. However, live voice debate facilitation and audience voting system operation are outside the scope of this skill."
---

# Debate Simulator — Debate Simulation Full Pipeline

An agent team collaborates to perform topic analysis, pro/con argument construction, cross-examination, judge evaluation, and comprehensive report writing.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and simulate an actual debate.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| topic-analyst | `.claude/agents/topic-analyst.md` | Topic analysis, issue structuring | general-purpose |
| pro-debater | `.claude/agents/pro-debater.md` | Pro-side argument construction | general-purpose |
| con-debater | `.claude/agents/con-debater.md` | Con-side argument construction | general-purpose |
| judge | `.claude/agents/judge.md` | Argument evaluation, verdict rendering | general-purpose |
| rapporteur | `.claude/agents/rapporteur.md` | Comprehensive report writing | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Resolution**: A clear resolution that can be debated pro/con
    - **Debate purpose** (optional): Educational / decision-making / competition prep / analysis
    - **User's position** (optional): Pro / Con / Neutral
    - **Debate format** (optional): Parliamentary / Lincoln-Douglas / Open debate
    - **Existing materials** (optional): Related reports, papers, articles
2. Create a `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. Determine the **execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Agent | Depends On | Deliverable |
|-------|------|-------|-----------|-------------|
| 1 | Topic analysis | topic-analyst | None | `_workspace/01_topic_analysis.md` |
| 2a | Pro argument construction | pro-debater | Task 1 | `_workspace/02_pro_arguments.md` |
| 2b | Con argument construction | con-debater | Task 1 | `_workspace/03_con_arguments.md` |
| 3 | Cross-examination | pro + con | Tasks 2a, 2b | `_workspace/04_cross_examination.md` |
| 4 | Judge evaluation | judge | Tasks 2a, 2b, 3 | `_workspace/05_judge_verdict.md` |
| 5 | Comprehensive report | rapporteur | All | `_workspace/06_final_report.md` |

Tasks 2a (pro) and 2b (con) run **in parallel**. However, since the con side may reference pro arguments, initial arguments are constructed independently and cross-referenced during the rebuttal phase.

**Inter-agent communication flow:**
- topic-analyst completes -> sends pro-favorable materials to pro-debater; con-favorable materials to con-debater; evaluation criteria to judge
- pro-debater + con-debater complete -> cross-examination simulation: exchange questions and answers
- cross-examination completes -> judge evaluates all arguments + cross-examination
- judge completes -> rapporteur synthesizes everything into a comprehensive report

### Phase 3: Cross-Examination Simulation

The orchestrator mediates cross-examination:
1. Deliver pro-debater's cross-examination questions to con-debater
2. Record con-debater's answers
3. Deliver con-debater's cross-examination questions to pro-debater
4. Record pro-debater's answers
5. Save the results to `_workspace/04_cross_examination.md`

### Phase 4: Integration and Final Report

1. Verify all files in `_workspace/`
2. Verify the comprehensive report's balance and completeness
3. Report the final summary to the user

## Task-Scale Modes

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Run a debate simulation", "full debate" | **Full Simulation** | All 5 agents |
| "Just analyze the topic", "structure the issues" | **Analysis Mode** | topic-analyst only |
| "Just build pro and con arguments" | **Argument Mode** | topic-analyst + pro + con |
| "Write pro arguments for this topic" | **Single-Side Mode** | topic-analyst + pro-debater |
| "Evaluate this debate" (existing materials) | **Evaluation Mode** | judge + rapporteur |

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time cross-examination exchange, revision requests |
| Task-based | TaskCreate/TaskUpdate | Track progress |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Resolution unclear | Ask user to clarify, or have topic-analyst reframe |
| Pro/con balance impossible | Adjust premises to reframe the resolution |
| Background materials insufficient | Apply analogous cases; note "limited data" |
| Web search failure | Work from general knowledge; note in report |
| Agent failure | Retry once -> proceed without that deliverable |

## Test Scenarios

### Normal Flow
**Prompt**: "Run a debate simulation on the topic: 'AI replacing human jobs is socially desirable'"
**Expected Results**:
- Topic analysis: 3-4 structured issues, background materials, debate format
- Pro: 3-5 core claims + evidence + cross-examination questions
- Con: Pro rebuttal + independent claims + alternative proposal
- Cross-examination: 3 rounds of Q&A per side
- Judge: 100-point evaluation + verdict + feedback
- Report: Balanced comprehensive report + insights

### Existing File Flow
**Prompt**: "Run cross-examination and judge evaluation based on these debate materials" + pro/con argument files attached
**Expected Results**:
- Existing materials copied to `_workspace/02_pro_arguments.md` and `_workspace/03_con_arguments.md`
- Skip topic-analyst, pro-debater, con-debater; deploy cross-examination + judge + rapporteur

### Error Flow
**Prompt**: "Run a debate simulation; pick a topic for me"
**Expected Results**:
- Resolution unclear -> topic-analyst proposes 3 current-event-based resolutions for selection
- After selection, proceed with full simulation

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| pro-debater, con-debater | `argumentation-framework` | Toulmin argument model, evidence pyramid, 5-Type rebuttal strategies, cross-examination design |
| judge, rapporteur | `logical-fallacy-detector` | 4-category logical fallacy classification, fallacy penalty standards, argument soundness rubric |
