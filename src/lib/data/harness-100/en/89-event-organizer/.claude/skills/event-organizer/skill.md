---
name: event-organizer
description: "event concept basis, venue·logistics, program design, promotion, execution plan, companyafter assessment agent team to Korean creation Full pipeline. 'event basis', 'event preparation', ' basis', 'taxun- preparation', ' design', ' event', 'beforewhen basis', ' basis', 'event program', 'event promotion', 'event checklist', 'event budget' etc. event basis·operations before skill usage. scale team department versusscale to all scale applied possible. However, actual venue exampleapprox., processing, actualtime technical operations, quality person work is outside this skill's scope."
---

# Event Organizer — event basis·operations Full pipeline

event concept→venue→program→promotion→execution→companyafterassessment An agent team collaborates to generate all deliverables at once.

## execution mode

**agent team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## agent composition

| agent | file | role | type |
|---------|------|------|------|
| concept-planner | `.claude/agents/concept-planner.md` | concept, goal, target, budget | general-purpose |
| logistics-manager | `.claude/agents/logistics-manager.md` | venue, flow of movement, equipment, planbefore | general-purpose |
| program-designer | `.claude/agents/program-designer.md` | , tax, speaker | general-purpose |
| promotion-lead | `.claude/agents/promotion-lead.md` | channelstrategy, promotioncontent, etc.record | general-purpose |
| evaluation-analyst | `.claude/agents/evaluation-analyst.md` | KPI, document, ROI, | general-purpose |

## workflow

### Phase 1: preparation (Orchestrator directly perform)

1. Extract from user input:
 - **event purpose**: for eventperson
 - **event type**: /taxun-///beforewhen/ etc.
 - **scale**: expected attendee number
 - **budget** (optional): total budget or 1person budget
 - **daywhen/venue** (optional): or condition
 - **constraint condition** (optional): number requirements
2. `_workspace/` Create the directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. existing material `_workspace/` companyand applicable Phase 
5. Determine the **execution mode** based on the scope of the request

### Phase 2: team composition and execution

| order | task | responsible | dependency | deliverable |
|------|------|------|------|--------|
| 1 | concept basis | planner | None | `_workspace/01_concept_plan.md` |
| 2a | logistics | logistics | task 1 | `_workspace/02_logistics_plan.md` |
| 2b | program design | designer | task 1 | `_workspace/03_program_design.md` |
| 3 | promotion plan | promotion | task 1, 2a, 2b | `_workspace/04_promotion_plan.md` |
| 4 | assessment framework | analyst | task 1, 2a, 2b, 3 | `_workspace/05_evaluation_framework.md` |

task 2a(logistics) and 2b(program) ** execution**. task 1(concept) only dependency.

**teamKRW between flow:**
- planner complete → logisticsto scale·budget·, designerto ·target·message deliver
- logistics + designer → between↔program consistency confirm
- logistics + designer complete → promotionto venue·program information deliver
- promotion complete → analystto promotion KPI deliver
- analyst all deliverable cross-verification, dayvalue findings when revision request (versus 2)

### Phase 3: integration and final deliverable

1. `_workspace/` Verify all files in the directory
2. analyst consistency verify result reflected
3. Report the final summary to the user

## task scaleby mode

| user request pattern | execution mode | deploy agent |
|----------------|----------|-------------|
| "event overall basisplease do" | **Full pipeline** | 5people beforeKRW |
| "program only designplease do" | **program mode** | planner + designer |
| "event promotion strategy" | **promotion mode** | planner + promotion |
| "event checklist only create it" | **checklist mode** | logistics |
| "companyafter assessment report create it" (event complete after) | **assessment mode** | analyst |

## data deliver protocol

| strategy | method | also |
|------|------|------|
| File-based | `_workspace/` | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information transfer, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{}_{agent}_{deliverable}.{extensionspecialist}`

## error handling

| error type | strategy |
|----------|------|
| event information insufficient | planner typeby basic template provide, "[detailed needed]" specify |
| budget un- | 3degree scale(/during/versus)by scenario provide |
| venue un- | logistics requirements checklist and recommendation standard provide |
| agent failure | Retry once -> proceed without that deliverable |
| consistency dayvalue | analyst revision request → re-task (versus 2) |

## test scenario

### flow
**Prompt**: "200people scale AI technical basisplease do. budget 50,000 KRW, fromfrom next itemsand ."
**expected result**:
- concept: AI ·case, SMART goal, budget allocation
- logistics: from 200people venue requirements, flow of movement, D-day timeline
- program: +tax 5~6items, speaker , MC when
- promotion: D-60 timeline, SNS when, email when
- assessment: KPI total, documentdegree, ROI analysis framework

### departmentminute request flow
**Prompt**: "next week team program only . 20people, ."
**expected result**:
- program mode (planner + designer)
- , , 
- scale betweenKorean deliverable

### error flow
**Prompt**: "event basisplease do, also "
**expected result**:
- planner event type 5degree proposal (purposeby)
- each typeby scale/budget/duration guideperson provide
- user optional after Full pipeline progress

## agentby extension skill

| extension skill | | target agent | role |
|----------|------|-------------|------|
| budget-planning | `.claude/skills/budget-planning/skill.md` | concept-planner, logistics-manager | budget category, calculation template, from guide |
| venue-evaluation | `.claude/skills/venue-evaluation/skill.md` | logistics-manager | venue assessment scorecard, company checklist, totalapprox. confirm |
