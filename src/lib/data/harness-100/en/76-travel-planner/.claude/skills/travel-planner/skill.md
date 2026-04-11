---
name: travel-planner
description: "A full pipeline where an agent team collaborates to generate everything from destination analysis to local information for travel planning. Used for 'plan a trip', 'Japan travel itinerary', 'Europe backpacking', 'weekend getaway', 'international travel prep', 'travel budget', 'accommodation recommendations', 'travel itinerary', 'local restaurants', 'travel route recommendations', etc. Supports analysis or improvement of existing itineraries. Real-time flight/accommodation booking, visa application processing, and travel agency package comparisons are outside this skill's scope."
---

# Travel Planner — Travel Planning Full Pipeline

Generates destination analysis, itinerary, accommodation, budget, and local information through agent team collaboration in one go.

## Execution Mode

**Agent Team** — 4 agents communicate directly via SendMessage and cross-verify.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| destination-analyst | `.claude/agents/destination-analyst.md` | Destination research, attractions, safety info | general-purpose |
| itinerary-designer | `.claude/agents/itinerary-designer.md` | Daily itinerary, route optimization, accommodation | general-purpose |
| budget-manager | `.claude/agents/budget-manager.md` | Budget calculation, cost comparison, savings tips | general-purpose |
| local-guide | `.claude/agents/local-guide.md` | Transport, restaurants, culture, emergency info | general-purpose |

## Workflow

### Phase 1: Preparation (Orchestrator performs directly)

1. Extract from user input:
    - **Destination**: Country/City (recommend based on criteria if undecided)
    - **Duration**: How many days, departure/arrival dates
    - **Party**: Solo/Couple/Family/Friends + number of people
    - **Budget** (optional): Total budget or budget level (Budget/Standard/Luxury)
    - **Travel Style** (optional): Relaxation/Adventure/Cultural/Culinary
    - **Special Requests** (optional): Must-visit places, exclusions
2. Create `_workspace/` directory at project root
3. Organize inputs and save to `_workspace/00_input.md`
4. **Determine execution mode** based on request scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Destination Analysis | analyst | None | `_workspace/01_destination_analysis.md` |
| 2 | Itinerary + Accommodation | designer | Task 1 | `_workspace/02_itinerary.md`, `_workspace/03_accommodation.md` |
| 3a | Budget Plan | budget | Tasks 1, 2 | `_workspace/04_budget.md` |
| 3b | Local Information | guide | Tasks 1, 2 | `_workspace/05_local_guide.md` |

Tasks 3a (Budget) and 3b (Local Info) run **in parallel**.

**Inter-team communication flow:**
- analyst complete → transmit attractions/time/hours to designer, costs/rates to budget, culture/safety to guide
- designer complete → transmit daily costs/accommodation budget to budget, daily areas/segments to guide
- budget complete → transmit payment info to guide
- guide complete → if inconsistencies found with itinerary, request adjustment from designer

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm consistency across itinerary-budget-local information
3. Report final summary to user:
    - Destination Analysis — `01_destination_analysis.md`
    - Itinerary — `02_itinerary.md`
    - Accommodation Guide — `03_accommodation.md`
    - Budget Plan — `04_budget.md`
    - Local Guide — `05_local_guide.md`

## Modes by Request Scale

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Plan an entire trip" | **Full Pipeline** | All 4 |
| "Where should I go in Japan?" | **Destination Recommendation** | analyst solo |
| "Paris 3-night itinerary only" | **Itinerary Mode** | analyst + designer |
| "Just calculate travel budget" | **Budget Mode** | budget solo |
| "Info I need while there" | **Guide Mode** | guide solo |
| "Improve this itinerary" (existing file) | **Analysis Mode** | designer + budget |

**Using existing files**: If the user provides an existing itinerary, copy to `_workspace/02_itinerary.md` and skip the designer.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key info transfer, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order}_{agent}_{deliverable}.{ext}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Web search failure | Work from general knowledge, note "Latest information verification needed" |
| Destination undecided | Recommend 3 destinations based on user criteria |
| Budget exceeded | Present budget alternatives + adjust priorities |
| Agent failure | Retry once → proceed without that deliverable if failed, note omission in report |
| Itinerary-info inconsistency | Request adjustment from designer (up to 2 times) |

## Test Scenarios

### Normal Flow
**Prompt**: "Plan a 4-night 5-day trip to Tokyo for a couple. Budget $1,500, focusing on food tourism."
**Expected Results**:
- Destination analysis: Tokyo attractions, culinary spots, entry requirements, optimal season
- Itinerary: 5-day schedule, food-focused routes, organized by areas like Tsukiji/Shibuya/Shinjuku
- Accommodation: 3 centrally-located recommendations + booking tips
- Budget: Allocation within $1,500 (flights/accommodation/meals/transport), Budget/Standard/Luxury comparison
- Local guide: Transit (Suica), restaurant list, basic Japanese phrases, emergency contacts

### Existing File Flow
**Prompt**: "Check if this itinerary fits the budget and add local info" + attached itinerary file
**Expected Results**:
- Copy existing itinerary to `_workspace/02_itinerary.md`
- Deploy budget + guide: generate budget calculation + local information

### Error Flow
**Prompt**: "Where should I go in Southeast Asia, budget under $800, solo for 3 nights 4 days"
**Expected Results**:
- Destination undecided → analyst compares 3 destinations based on criteria (Vietnam/Thailand/Philippines, etc.)
- Provide comparison table of estimated costs, pros/cons for each
- Proceed with full pipeline after user selection (or auto-proceed with top recommendation)

## Agent Extension Skills

| Agent | Extension Skill | Purpose |
|-------|----------------|---------|
| itinerary-designer | `route-optimizer` | Route optimization, transport comparison, time block allocation |
| budget-manager | `budget-calculator` | City-specific cost tables, budget allocation formulas, savings strategies |
