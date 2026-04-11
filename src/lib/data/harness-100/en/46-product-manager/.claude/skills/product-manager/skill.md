---
name: product-manager
description: "A full PM pipeline where an agent team collaborates to generate roadmaps, PRDs, user stories, sprint plans, and retrospectives in one go. Use this skill for 'Write a PRD,' 'Build a roadmap,' 'Decompose user stories,' 'Plan sprints,' 'Help with product planning,' 'PM tasks,' 'feature specifications,' 'product requirements,' 'backlog grooming,' 'sprint planning,' 'OKR setting,' 'product strategy,' and 'retrospective templates' — the full spectrum of PM work. It also supports user story decomposition and sprint planning when existing PRDs or roadmaps are provided. Note: Actual Jira/Linear ticket creation, design mockup production, code development, and stakeholder meeting facilitation are outside the scope of this skill."
---

# Product Manager — Full PM Pipeline

An agent team collaborates to generate the full pipeline in one pass: Roadmap, PRD, User Stories, Sprint Plan, and Retrospective.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| strategist | `.claude/agents/strategist.md` | Vision, roadmap, OKR, prioritization | general-purpose |
| prd-writer | `.claude/agents/prd-writer.md` | Product requirements document | general-purpose |
| story-writer | `.claude/agents/story-writer.md` | User stories, AC, story map | general-purpose |
| sprint-planner | `.claude/agents/sprint-planner.md` | Sprint plan, capacity, retrospective | general-purpose |
| pm-reviewer | `.claude/agents/pm-reviewer.md` | Consistency verification, feasibility | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by the orchestrator)

1. Extract from user input:
    - **Product/Feature**: The product or feature to be planned
    - **Goals**: Business/user goals to achieve
    - **Team Info** (optional): Team size, role composition, velocity
    - **Constraints** (optional): Timeline, tech stack, resources
    - **Existing Assets** (optional): Existing PRDs, roadmaps, backlogs
2. Create the `_workspace/` directory at the project root
3. Organize input and save as `_workspace/00_input.md`
4. If existing files are present, skip the corresponding phase
5. **Determine the execution mode** based on request scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Roadmap development | strategist | None | `_workspace/01_product_roadmap.md` |
| 2 | PRD writing | prd-writer | Task 1 | `_workspace/02_prd.md` |
| 3 | User story decomposition | story-writer | Tasks 1, 2 | `_workspace/03_user_stories.md` |
| 4 | Sprint planning | sprint-planner | Task 3 | `_workspace/04_sprint_plan.md` |
| 5 | PM review | pm-reviewer | Tasks 1-4 | `_workspace/05_review_report.md` |

**Inter-agent communication flow:**
- strategist completes → sends initiatives, OKRs, and success metrics to prd-writer; sends personas and use cases to story-writer
- prd-writer completes → sends requirements, AC, and scope to story-writer; sends timeline and dependencies to sprint-planner
- story-writer completes → sends story list, dependencies, and total SP to sprint-planner
- pm-reviewer cross-verifies all deliverables. When RED Must Fix items are found, sends revision requests → rework (up to 2 iterations)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all RED Must Fix items from the review report have been addressed
3. Report the final summary to the user

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Plan this product," "Full PM workflow" | **Full Pipeline** | All 5 agents |
| "Just build the roadmap" | **Strategy Mode** | strategist + reviewer |
| "Write a PRD" | **PRD Mode** | strategist + prd-writer + reviewer |
| "Create user stories from this PRD" (existing PRD) | **Story Mode** | story-writer + reviewer |
| "Create a sprint plan" (existing stories) | **Sprint Mode** | sprint-planner + reviewer |
| "Review this plan" | **Review Mode** | reviewer only |

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information transfer, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient product info | Strategist proposes 3 general product categories, then prompts user to choose |
| No team info | Plan based on a standard 4-6 person Scrum team |
| Agent failure | Retry once → if still failing, proceed without that deliverable and note the omission in the review report |
| RED found in review | Send revision request to the relevant agent → rework → re-verify (up to 2 iterations) |

## Test Scenarios

### Normal Flow
**Prompt**: "We want to add team collaboration features to our SaaS product. Plan the product."
**Expected Result**:
- Roadmap: Team collaboration theme OKR, Now/Next/Later roadmap, RICE priorities
- PRD: Team collaboration feature specs, user flows, AC, non-functional requirements
- User Stories: 15-25 stories, story map, total SP
- Sprint Plan: 3-4 sprint plan, capacity, risks, retrospective template
- Review: 100% coverage in requirements traceability matrix

### Existing File Flow
**Prompt**: "Decompose user stories and create a sprint plan from this PRD" + attached PRD file
**Expected Result**:
- Copy existing PRD to `02_prd.md`
- Combine Story Mode + Sprint Mode: deploy story-writer + sprint-planner + reviewer

### Error Flow
**Prompt**: "Help me plan a new feature"
**Expected Result**:
- Product/feature unclear → Strategist asks product context questions before proceeding
- Start with Strategy Mode using minimal information, then progressively expand

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| rice-prioritizer | `.claude/skills/rice-prioritizer/skill.md` | strategist, prd-writer | RICE score formula, Reach/Impact/Confidence/Effort scoring, supplementary frameworks |
| story-point-estimator | `.claude/skills/story-point-estimator/skill.md` | sprint-planner, story-writer | Fibonacci scale reference, three-dimensional complexity assessment, velocity calculation, story decomposition criteria |
