---
name: space-concept-board
description: "A full pipeline where an agent team collaborates to generate an interior space concept board all at once. Use this skill for 'interior concept design', 'living room makeover', 'room atmosphere change', 'interior moodboard', 'furniture recommendations', 'space styling', 'color palette design', 'interior budget', 'DIY interior', 'home styling', 'studio interior', 'office interior', and all other space decoration tasks. Also supports item curation and budget management when an existing moodboard is provided. Actual construction work (tile installation, electrical wiring), 3D rendering, and AR furniture placement app integration are outside this skill's scope."
---

# Space Concept Board Pipeline

An agent team collaborates to generate style analysis, moodboard, color palette, furniture/accessory list, budget sheet, and shopping guide all at once.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| style-analyst | `.claude/agents/style-analyst.md` | Space assessment, style diagnosis, reference collection | general-purpose |
| moodboard-designer | `.claude/agents/moodboard-designer.md` | Color palette, texture, material composition | general-purpose |
| item-curator | `.claude/agents/item-curator.md` | Furniture/accessory selection, layout proposals, vendor research | general-purpose |
| budget-manager | `.claude/agents/budget-manager.md` | Price research, budget sheet, shopping guide | general-purpose |
| concept-reviewer | `.claude/agents/concept-reviewer.md` | Cross-verification, consistency checks | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Space information**: Type (living room/bedroom/study/studio), area, structure
    - **Style preference** (optional): Preferred styles, reference images
    - **Budget** (optional): Total budget range
    - **Constraints** (optional): Rental/owned, renovation scope, pets/children
    - **Existing files** (optional): User-provided moodboard, furniture list, etc.
2. Create a `_workspace/` directory at the project root
3. Organize inputs and save to `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/` and skip the corresponding phase
5. Determine the **execution mode** based on the scope of the request (see "Modes by Request Scale" below)

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Style analysis | analyst | None | `_workspace/01_style_analysis.md` |
| 2 | Moodboard design | designer | Task 1 | `_workspace/02_moodboard.md` |
| 3 | Item curation | curator | Tasks 1, 2 | `_workspace/03_item_list.md` |
| 4 | Budget/shopping guide | budget | Tasks 1, 2, 3 | `_workspace/04_budget_shopping.md` |
| 5 | Concept review | reviewer | Tasks 1-4 | `_workspace/05_review_report.md` |

**Inter-team communication flow:**
- analyst complete -> Deliver recommended styles and references to designer, spatial conditions and constraints to curator, budget range and rental status to budget
- designer complete -> Deliver color palette and material board to curator, recommended materials and brands to budget
- curator complete -> Deliver full item list and price ranges to budget
- reviewer cross-verifies all deliverables. If critical issues are found, request revision from the relevant agent -> rework -> re-verify (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm all critical issues from the review report have been addressed
3. Report the final summary to the user:
    - Style analysis — `01_style_analysis.md`
    - Moodboard + color palette — `02_moodboard.md`
    - Furniture/accessory list — `03_item_list.md`
    - Budget sheet + shopping guide — `04_budget_shopping.md`
    - Review report — `05_review_report.md`

## Modes by Request Scale

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|----------------|-----------------|
| "Design the full interior concept" | **Full Pipeline** | All 5 agents |
| "Just create a moodboard" | **Moodboard Mode** | analyst + designer + reviewer |
| "Recommend furniture" (style provided) | **Item Mode** | curator + budget + reviewer |
| "Plan my interior budget" (list provided) | **Budget Mode** | budget + reviewer |
| "Review this concept board" | **Review Mode** | reviewer only |

**Existing file usage**: When the user provides a moodboard, item list, etc., copy the file to the appropriate numbered position in `_workspace/` and skip that stage's agent.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information transfer, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{sequence}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient space information | Apply standard apartment (84 sq m) defaults, note "estimated" in the report |
| Web search failure | Work from general interior knowledge, note "data limitations" |
| Budget not specified | Suggest average budgets by space type, then proceed |
| Agent failure | Retry once -> If still failing, proceed without that deliverable, note the gap in the review report |
| Critical issue found in review | Request revision from the relevant agent -> rework -> re-verify (up to 2 rounds) |

## Test Scenarios

### Normal Flow
**Prompt**: "I want to decorate my 900 sq ft apartment living room in Scandinavian style. My budget is $5,000."
**Expected Results**:
- Style analysis: Scandinavian core elements + living room conditions applied
- Moodboard: White/light gray centered color palette + natural wood and linen materials
- Items: 15-20 products including sofa, table, lighting, rug + size verification
- Budget: Allocation within $5,000 + 3-phase purchase priorities
- Review: All items in consistency matrix verified

### Existing File Flow
**Prompt**: "Recommend furniture that matches this moodboard" + moodboard file attached
**Expected Results**:
- Existing moodboard copied to `_workspace/02_moodboard.md`
- Item mode: curator + budget + reviewer deployed
- analyst, designer are skipped

### Error Flow
**Prompt**: "I want to make my room look nice but I don't know where to start"
**Expected Results**:
- Insufficient space information -> analyst asks about space type/area or applies defaults
- No style preference -> analyst proposes 3 contrasting styles
- No budget specified -> budget presents average budgets by space type

## Agent Extension Skills

| Agent | Extension Skill | Purpose |
|-------|----------------|---------|
| moodboard-designer, style-analyst | `color-harmony-engine` | Color theory, palette formulas, style-specific palette database |
| item-curator, style-analyst | `spatial-layout-guide` | Furniture placement rules, dimension standards, traffic flow design |
