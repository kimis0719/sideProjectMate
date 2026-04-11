---
name: adr-writer
description: "A pipeline where an agent team systematically creates Architecture Decision Records (ADRs). Use this skill for requests such as 'write an ADR,' 'architecture decision record,' 'document a technical decision,' 'architecture decision record,' 'organize architecture selection rationale,' 'technology stack decision,' 'alternative comparison analysis,' 'tradeoff analysis,' or 'architecture decision history.' Note: actual code migration execution, infrastructure provisioning, and performance test execution are outside the scope of this skill."
---

# ADR Writer — Architecture Decision Record Pipeline

An agent team collaborates to execute the full workflow: context analysis, alternative comparison, tradeoff evaluation, decision documentation, and impact tracking for architecture decisions.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| context-analyst | `.claude/agents/context-analyst.md` | Current architecture, problem, and constraint analysis | general-purpose |
| alternative-researcher | `.claude/agents/alternative-researcher.md` | Technology alternative exploration, benchmark collection | general-purpose |
| tradeoff-evaluator | `.claude/agents/tradeoff-evaluator.md` | Weighted evaluation, risk-reward analysis | general-purpose |
| adr-author | `.claude/agents/adr-author.md` | ADR standard format document writing | general-purpose |
| impact-tracker | `.claude/agents/impact-tracker.md` | Impact analysis, migration roadmap | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Decision Topic**: What architecture decision is being made
    - **Project Context** (optional): Technology stack, team size, project phase
    - **Constraints** (optional): Budget, timeline, technical constraints
    - **Existing ADRs** (optional): Previously written ADR list or codebase
2. Create the `_workspace/` directory in the project root
3. Organize inputs and save to `_workspace/00_input.md`
4. If a codebase is available, instruct the context analyst to explore it
5. Determine the **execution mode** based on the scope of the request (see "Execution Modes by Request Scope" below)

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Technical Context Analysis | context-analyst | None | `_workspace/01_context_analysis.md` |
| 2 | Alternatives Research | alternative-researcher | Task 1 | `_workspace/02_alternatives_report.md` |
| 3 | Tradeoff Evaluation | tradeoff-evaluator | Tasks 1, 2 | `_workspace/03_tradeoff_matrix.md` |
| 4a | ADR Document Writing | adr-author | Tasks 1, 2, 3 | `_workspace/04_adr_document.md` |
| 4b | Impact Assessment | impact-tracker | Tasks 1, 2, 3 | `_workspace/05_impact_assessment.md` |

Tasks 4a (ADR document) and 4b (impact assessment) are executed **in parallel**. Both depend only on Tasks 1-3, so they can start simultaneously.

**Inter-agent Communication Flow:**
- context-analyst completes -> Delivers constraints and technology stack to alternative-researcher; delivers quality attribute priorities to tradeoff-evaluator
- alternative-researcher completes -> Delivers alternatives list and data to tradeoff-evaluator
- tradeoff-evaluator completes -> Delivers recommendation to adr-author; delivers risk list to impact-tracker
- adr-author <-> impact-tracker: Cross-verify consistency between ADR document and impact assessment

### Phase 3: Integration and Final Deliverables

1. Review all files in `_workspace/`
2. Validate consistency between the ADR document and impact assessment
3. Present the final summary to the user:
    - Technical Context — `01_context_analysis.md`
    - Alternatives Research — `02_alternatives_report.md`
    - Tradeoff Evaluation — `03_tradeoff_matrix.md`
    - ADR Document — `04_adr_document.md`
    - Impact Assessment — `05_impact_assessment.md`

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|---------------|-----------------|
| "Write an ADR," "Architecture decision record" | **Full Pipeline** | All 5 agents |
| "Just compare alternatives" | **Alternatives Analysis Mode** | context-analyst + alternative-researcher + tradeoff-evaluator |
| "Document this decision" (decision already made) | **Documentation Mode** | adr-author + impact-tracker |
| "Analyze the impact of this ADR" (existing ADR) | **Impact Analysis Mode** | impact-tracker solo |
| "Organize the technical context" | **Context Mode** | context-analyst solo |

**Using Existing Files**: If the user already provides analysis materials, copy them to `_workspace/` and skip the corresponding agent's phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Primary deliverable storage and sharing |
| Message-based | SendMessage | Real-time critical information transfer, revision requests |
| Code exploration | Read/Grep/Glob | Extract architecture information from codebase |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| No codebase available | Analyze context based on user description; mark as "inference-based" |
| Web search failure | Research alternatives based on general technical knowledge; mark as "latest data unverified" |
| Insufficient quantitative data | Substitute with qualitative evaluation; mark as "estimates" in the tradeoff matrix |
| Agent failure | Retry once; if still failing, proceed without that deliverable; note omission in final report |
| Decision deferred | Set ADR status to "Proposed"; specify additional information needed |

## Test Scenarios

### Normal Flow
**Prompt**: "Write an ADR on whether to transition from monolith to microservices. We're currently on Java Spring Boot with a team of 5."
**Expected Results**:
- Context Analysis: Monolith current state, transition triggers, team size constraints
- Alternatives: At least 3 options including microservices, modular monolith, and status quo
- Tradeoff: Weighted evaluation matrix considering the 5-person team's capabilities
- ADR: MADR format, including both decision rationale and rejection reasons
- Impact Assessment: Phased migration roadmap with rollback strategies

### Existing Materials Flow
**Prompt**: "We already compared Redis vs Memcached. Please organize it into an ADR document." + comparison materials provided
**Expected Results**:
- Copy provided comparison materials to `_workspace/`
- Skip or only supplement context-analyst and alternative-researcher phases
- Focus on adr-author + impact-tracker for documentation

### Error Flow
**Prompt**: "Write a database selection ADR."
**Expected Results**:
- Context is insufficient, so context-analyst suggests questions about requirements (data types, scale, access patterns)
- Proceed with work under general scenario assumptions; note assumptions in the ADR
- Add "assumption verification needed" items to the impact assessment

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| tradeoff-evaluator | `quality-attribute-analyzer` | Quality attribute dictionary, CAP theorem, weighted evaluation matrix, simplified ATAM |
| adr-author, impact-tracker | `madr-template-engine` | MADR standard format, ADR status management, numbering system, dependency graph |
