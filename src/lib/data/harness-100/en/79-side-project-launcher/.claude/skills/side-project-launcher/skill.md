---
name: side-project-launcher
description: "companyproject basis A pipeline where an agent team collaborates for comprehensive planning. 'companyproject basis', 'company project idea', ' project', 'MVP ', ' reporting ', 'service launch', '1person development', 'indie hacking', 'week project', 'tech stack ', 'company ' etc. companyproject basis before skill usage. existing idea case also tech stack MVP design degreeKRW. However, actual code writing, specialistperson whenplan work, person/from versus is outside this skill's scope."
---

# Side Project Launcher — companyproject basis pipeline

ideaverify→tech stack→MVP→developmentroadmap→launchchecklist An agent team collaborates to generate all deliverables at once.

## execution mode

**agent team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## agent composition

| agent | file | role | type |
|---------|------|------|------|
| idea-validator | `.claude/agents/idea-validator.md` | market analysis, competition research, differentiation verify | general-purpose |
| techstack-analyst | `.claude/agents/techstack-analyst.md` | tech stack comparison, recommendation, person design | general-purpose |
| mvp-designer | `.claude/agents/mvp-designer.md` | core feature definition, , | general-purpose |
| roadmap-builder | `.claude/agents/roadmap-builder.md` | development schedule, launch strategy, checklist | general-purpose |
| launch-reviewer | `.claude/agents/launch-reviewer.md` | cross-verification, execution possiblenature confirm | general-purpose |

## workflow

### Phase 1: preparation (Orchestrator directly perform)

1. Extract from user input:
 - **idea**: , problem
 - **development competency** (optional): usage possibleKorean technical, development level
 - ** time** (optional): week deploy possible time
 - **budget** (optional): month operations cost Korean
 - **existing file** (optional): basisfrom, etc.
2. `_workspace/` Create the directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/`and skip the corresponding Phase
5. Determine the **execution mode** based on the scope of the request

### Phase 2: team composition and execution

| order | task | responsible | dependency | deliverable |
|------|------|------|------|--------|
| 1 | idea verify | validator | None | `_workspace/01_idea_validation.md` |
| 2 | tech stack | techstack | task 1 | `_workspace/02_techstack_recommendation.md` |
| 3 | MVP design | designer | task 1, 2 | `_workspace/03_mvp_spec.md` |
| 4 | roadmap·launch | roadmap | task 2, 3 | `_workspace/04_roadmap_launch.md` |
| 5 | launch review | reviewer | task 1~4 | `_workspace/05_review_report.md` |

**teamKRW between flow:**
- validator complete → techstackto project type·difficulty, designerto UVP·differentiation point, roadmapto market deliver
- techstack complete → designerto technical constraint·implementation difficulty, roadmapto learning time·technical risk deliver
- designer complete → roadmapto featureby time·priority deliver
- reviewer all deliverable cross-verification. 🔴 required revision findings when Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds)

### Phase 3: integration and final deliverable

1. `_workspace/` Verify all files in the directory
2. review reportConfirm that all critical revisions from the review report have been addressed
3. Report the final summary to the user

## task scaleby mode

| user request pattern | execution mode | deploy agent |
|----------------|----------|-------------|
| "companyproject overall basis" | **Full pipeline** | 5people beforeKRW |
| " idea verifyplease do" | **verify mode** | validator + reviewer |
| "tech stack recommendationplease do" (idea ) | **technical mode** | validator + techstack + reviewer |
| "MVP " (technical decision) | **MVP mode** | designer + roadmap + reviewer |
| "launch checklist create it" | **launch mode** | roadmap + reviewer |

**existing file utilization**: user basisfrom, tech stack decision etc. provide applicable stage case.

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
| idea un-present | trend based idea 3items proposal after optional also |
| development None | code/code recommendation, learning roadmap included |
| web search failure | general market degreeas analysis, "data limitation" specify |
| agent failure | Retry once -> proceed without that deliverable, note the gap in the review report |
| reviewfrom 🔴 findings | Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds) |

## test scenario

### flow
**Prompt**: "developmentspecialist interview preparation week web companyproject . React week developmentto do ."
**expected result**:
- verify: interview preparation market analysis, existing service(LeetCode, ) versus differentiation
- technical: React + Supabase + Vercel recommendation, free utilization
- MVP: core feature 3~5items, , data model
- roadmap: 4week sprint, Product Hunt launch strategy
- review: overall consistency verify, risk matrix

### existing file utilization flow
**Prompt**: "un- idea verify tech stack also . MVP only " + basisfrom department
**expected result**:
- MVP mode: designer + roadmap + reviewer deploy
- validator, techstack case

### error flow
**Prompt**: " reporting idea "
**expected result**:
- validator user company question or trend based idea 3items proposal
- optional after Full pipeline progress
- review report "idea stage" specify

## agentby extension skill

| agent | extension skill | also |
|---------|----------|------|
| idea-validator | `market-sizing-calculator` | TAM/SAM/SOM calculation, revenue model verify |
| techstack-analyst | `techstack-decision-matrix` | tech stack comparison matrix, person cost total |
