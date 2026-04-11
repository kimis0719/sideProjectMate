---
name: wedding-planner
description: "wedding preparation A pipeline where an agent team collaborates for comprehensive planning. 'wedding preparation ', ' ', 'wedding budget', 'wedding hall recommendation', 'studio/dress/makeup comparison', 'invitation document', 'wedding checklist', 'honeymoon plan', 'betrothal gifts preparation', 'trousseau list', 'wedding timeline' etc. wedding preparation before skill usage. item only neededKorean case also applicable departmentminute only degreeKRW. However, actual vendor exampleapprox. versus, processing, marriage registration versus is outside this skill's scope."
---

# Wedding Planner — wedding preparation comprehensive pipeline

timelinedesign→budgetmanagementtable→vendorcomparisontable→checklist→invitationdocument An agent team collaborates to generate all deliverables at once.

## execution mode

**agent team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## agent composition

| agent | file | role | type |
|---------|------|------|------|
| timeline-designer | `.claude/agents/timeline-designer.md` | D-day , monthby schedule | general-purpose |
| budget-controller | `.claude/agents/budget-controller.md` | budget allocation, cost reduction | general-purpose |
| vendor-analyst | `.claude/agents/vendor-analyst.md` | vendor research, comparisontable | general-purpose |
| checklist-builder | `.claude/agents/checklist-builder.md` | checklist, invitation document | general-purpose |
| wedding-reviewer | `.claude/agents/wedding-reviewer.md` | cross-verification, consistency confirm | general-purpose |

## workflow

### Phase 1: preparation (Orchestrator directly perform)

1. Extract from user input:
 - **wedding ceremony date**: D-day or example period
 - **wedding type** (optional): wedding hall///
 - **budget** (optional): total budget or itemby budget
 - **guest scale** (optional): expected guest number
 - **by request** (optional): degree, style, etc.
 - **existing file** (optional): existing checklist, budgettable etc.
2. `_workspace/` Create the directory at the project root
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/`and skip the corresponding Phase
5. Determine the **execution mode** based on the scope of the request

### Phase 2: team composition and execution

| order | task | responsible | dependency | deliverable |
|------|------|------|------|--------|
| 1 | timeline design | timeline | None | `_workspace/01_timeline.md` |
| 2a | budget management | budget | task 1 | `_workspace/02_budget.md` |
| 2b | vendor comparison | vendor | task 1 | `_workspace/03_vendor_comparison.md` |
| 3 | checklist·invitation | checklist | task 1, 2a, 2b | `_workspace/04_checklist_invitation.md` |
| 4 | comprehensive review | reviewer | task 1~3 | `_workspace/05_review_report.md` |

task 2a(budget) and 2b(vendor) ** execution**. task 1(timeline) only dependency when whenworkto do number .

**teamKRW between flow:**
- timeline complete → budgetto expense timing, vendorto exampleapprox. period, checklistto monthby to do day deliver
- budget ↔ vendor: budget Korean also ↔ vendor price 
- checklist timeline + budget + vendor result integrationto checklist writing
- reviewer all deliverable cross-verification. 🔴 required revision findings when Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds)

### Phase 3: integration and final deliverable

1. `_workspace/` Verify all files in the directory
2. review reportConfirm that all critical revisions from the review report have been addressed
3. Report the final summary to the user

## task scaleby mode

| user request pattern | execution mode | deploy agent |
|----------------|----------|-------------|
| "wedding preparation overall " | **Full pipeline** | 5people beforeKRW |
| "wedding timeline only " | **timeline mode** | timeline + reviewer |
| "wedding budget organizationplease do" | **budget mode** | timeline + budget + reviewer |
| "wedding hall comparisonplease do" | **vendor mode** | vendor + reviewer |
| "invitation document " | **document mode** | checklist + reviewer |
| " wedding plan reviewplease do" | **review mode** | reviewer |

**existing file utilization**: user existing budgettable, vendor list etc. provide applicable stage case.

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
| wedding date un- | 6months/12months after 2degree scenario present |
| budget un-present | Korean pyeongbalanced wedding cost standardas progress, "budget needed" specify |
| web search failure | general whentax based task, " information confirm needed" specify |
| agent failure | Retry once -> proceed without that deliverable, note the gap in the review report |
| reviewfrom 🔴 findings | Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds) |

## test scenario

### flow
**Prompt**: "withinyear 5month wedding. guest 200people , budget total 50000,000 KRW. from wedding hall ."
**expected result**:
- timeline: D-12months schedule, 5month peak season basis exampleapprox. 
- budget: 50000,000 KRW itemby allocation, catering cost(200people) proportion High
- vendor: wedding hall 3 comparison, studio/dress/makeup recommendation
- checklist: overall checklist + invitation document 4
- review: consistency matrix beforeitem confirm

### existing file utilization flow
**Prompt**: "wedding hall studio/dress/makeup also . degree checklist budget organization "
**expected result**:
- existing decision matters `_workspace/` basisrecord
- budget + checklist + reviewer deploy
- timeline between, vendor case

### error flow
**Prompt**: "wedding preparation department ? also plan "
**expected result**:
- date un- → timeline 6months/12months 2degree scenario present
- budget un- → budget scaleby pyeongbalanced budget planwithin
- stage(date·budget ) guide provide

## agentby extension skill

| agent | extension skill | also |
|---------|----------|------|
| vendor-analyst, budget-controller | `vendor-negotiation-guide` | vendor comparison matrix, price standardtable, negotiation strategy |
| budget-controller, wedding-reviewer | `wedding-budget-optimizer` | budget allocation official, cost standardtable, approx. strategy |
