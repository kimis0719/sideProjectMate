---
name: startup-launcher
description: "Full launch pipeline where an agent team collaborates to generate idea validation, business model design, MVP planning, and pitch deck creation in one pass. Use this skill for requests like 'plan a startup', 'validate a business idea', 'create a business model', 'write a pitch deck', 'design an MVP', 'prepare for fundraising', 'startup preparation', 'write a business plan', 'startup launch strategy', 'BM design', and other startup launch tasks. Also supports pitch deck writing or market validation when existing business models or MVPs are available. Note: company incorporation procedures, actual investment contract writing, code development, and accounting/tax processing are outside the scope of this skill."
---

# Startup Launcher — Startup Launch Pipeline

An agent team collaborates to generate idea validation, business model, MVP design, and pitch deck through market analysis > business model > MVP > pitch deck > review.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| market-analyst | `.claude/agents/market-analyst.md` | Market validation, competitive analysis | general-purpose |
| business-modeler | `.claude/agents/business-modeler.md` | Revenue model, unit economics, financials | general-purpose |
| mvp-architect | `.claude/agents/mvp-architect.md` | MVP scope, tech stack, roadmap | general-purpose |
| pitch-creator | `.claude/agents/pitch-creator.md` | Pitch deck, investor narrative | general-purpose |
| launch-reviewer | `.claude/agents/launch-reviewer.md` | Consistency verification, investment readiness QA | general-purpose |

## Workflow

### Phase 1: Preparation (performed directly by the orchestrator)

1. Extract the following from user input:
    - **Startup idea**: Problem to solve, proposed solution
    - **Target market**: Industry, geography, customer segment
    - **Stage**: Idea/Validation/MVP/Growth
    - **Funding goal** (optional): Investment round, target amount
    - **Existing assets** (optional): Market research, business plan, prototype, etc.
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. If pre-existing files are available, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Market validation | market-analyst | None | `_workspace/01_market_validation.md` |
| 2 | Business model | business-modeler | Task 1 | `_workspace/02_business_model.md` |
| 3 | MVP design | mvp-architect | Task 2 | `_workspace/03_mvp_design.md` |
| 4 | Pitch deck | pitch-creator | Tasks 1, 2, 3 | `_workspace/04_pitch_deck.md` |
| 5 | Launch review | launch-reviewer | Task 4 | `_workspace/05_review_report.md` |

**Inter-agent communication flow:**
- market-analyst completes > passes market data to business-modeler, pain points to mvp-architect
- business-modeler completes > passes financials to mvp-architect and pitch-creator
- mvp-architect completes > passes MVP plan to pitch-creator
- pitch-creator completes > passes deck to launch-reviewer
- launch-reviewer cross-validates all deliverables. On CRITICAL findings, requests corrections > rework > re-verify (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all CRITICAL findings have been addressed
3. Report the final summary to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Plan a startup", "full launch prep" | **Full pipeline** | All 5 agents |
| "Just validate the market" | **Validation mode** | market-analyst + reviewer |
| "Create a business model" | **BM mode** | market-analyst + business-modeler + reviewer |
| "Write a pitch deck" (BM exists) | **Pitch mode** | pitch-creator + reviewer |
| "Design an MVP" (BM exists) | **MVP mode** | mvp-architect + reviewer |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Idea too vague | Request clarification on problem/solution/target customer |
| No market data available | Use analogous market estimation, note assumptions |
| Agent failure | Retry once > proceed without that deliverable |
| CRITICAL in review | Request correction > rework > re-verify (up to 2 rounds) |

## Agent Extension Skills

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| unit-economics-calculator | `.claude/skills/unit-economics-calculator/skill.md` | business-modeler, launch-reviewer | LTV, CAC, margin, BEP calculation methodology |
| pitch-deck-framework | `.claude/skills/pitch-deck-framework/skill.md` | pitch-creator, launch-reviewer | Pitch deck structure, storytelling, slide design framework |
