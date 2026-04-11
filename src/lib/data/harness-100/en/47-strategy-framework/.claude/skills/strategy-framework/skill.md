---
name: strategy-framework
description: "A full pipeline that systematizes an organization's strategy framework through OKR design, BSC mapping, SWOT analysis, vision & mission statement, and strategy execution roadmap. Use this skill for 'build a strategy framework,' 'design OKRs,' 'BSC analysis,' 'SWOT analysis,' 'write vision and mission,' 'strategy roadmap,' 'strategy formulation,' 'mid-to-long-term strategy,' 'business strategy framework,' and 'strategy system design' — across the full spectrum of organizational strategy development. It also supports supplementing and validating existing OKRs or SWOT analyses. Note: Financial statement preparation, ERP system implementation, performance review execution, and real-time KPI dashboard development are outside the scope of this skill."
---

# Strategy Framework — Full Strategy Pipeline

Systematizes an organization's strategy through the sequence: OKR → BSC → SWOT → Vision & Mission → Execution Roadmap.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| okr-designer | `.claude/agents/okr-designer.md` | OKR goal & key result design, alignment | general-purpose |
| bsc-analyst | `.claude/agents/bsc-analyst.md` | BSC four-perspective mapping, KPI system | general-purpose |
| swot-specialist | `.claude/agents/swot-specialist.md` | SWOT analysis, TOWS strategy derivation | general-purpose |
| strategy-writer | `.claude/agents/strategy-writer.md` | Vision & mission, strategy execution roadmap | general-purpose |
| strategy-reviewer | `.claude/agents/strategy-reviewer.md` | Cross-verification, consistency checking | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by the orchestrator)

1. Extract from user input:
    - **Organization Info**: Name, industry, size, current situation
    - **Strategy Period**: Annual/3-year/5-year
    - **Existing Strategy Assets** (optional): Existing OKRs, vision & mission, analytical materials
    - **Special Requirements** (optional): Emphasis on specific frameworks, focus on certain perspectives
2. Create the `_workspace/` directory at the project root
3. Organize input and save as `_workspace/00_input.md`
4. If existing files are present, copy them to `_workspace/` and skip the corresponding phase
5. **Determine the execution mode** based on request scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | OKR design | okr-designer | None | `_workspace/01_okr_design.md` |
| 2a | BSC mapping | bsc-analyst | Task 1 | `_workspace/02_bsc_mapping.md` |
| 2b | SWOT analysis | swot-specialist | Task 1 | `_workspace/03_swot_analysis.md` |
| 3 | Vision & Mission + Roadmap | strategy-writer | Tasks 1, 2a, 2b | `_workspace/04_vision_mission.md`, `_workspace/05_strategy_roadmap.md` |
| 4 | Strategy review | strategy-reviewer | Tasks 1, 2a, 2b, 3 | `_workspace/06_review_report.md` |

Tasks 2a (BSC) and 2b (SWOT) execute **in parallel**. Both depend only on Task 1 (OKR), so they can start simultaneously.

**Inter-agent communication flow:**
- okr-designer completes → sends OKR system to bsc-analyst; sends strategic assumptions to swot-specialist
- bsc-analyst completes → sends strategic blind spots to swot-specialist; sends KPI system to strategy-writer
- swot-specialist completes → sends TOWS strategy priorities to strategy-writer
- strategy-writer completes → sends all documents to strategy-reviewer
- strategy-reviewer cross-verifies all deliverables. When RED Must Fix items are found, sends revision requests to the relevant agent → rework → re-verify (up to 2 iterations)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all RED Must Fix items from the review report have been addressed
3. Report the final summary to the user:
    - OKR Design Document — `01_okr_design.md`
    - BSC Mapping Table — `02_bsc_mapping.md`
    - SWOT Analysis Report — `03_swot_analysis.md`
    - Vision & Mission Statement — `04_vision_mission.md`
    - Strategy Execution Roadmap — `05_strategy_roadmap.md`
    - Review Report — `06_review_report.md`

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Build a strategy framework," "Full strategy system" | **Full Pipeline** | All 5 agents |
| "Just design OKRs" | **OKR Mode** | okr-designer + reviewer |
| "Run a SWOT analysis" | **SWOT Mode** | swot-specialist + reviewer |
| "Write the vision and mission" (existing analysis available) | **Document Mode** | strategy-writer + reviewer |
| "Review this OKR" | **Review Mode** | reviewer only |
| "Create OKR and BSC" | **Analysis Mode** | okr-designer + bsc-analyst + reviewer |

**Existing file utilization**: When the user provides existing files (OKR, SWOT, etc.), copy the file to the appropriate numbered position in `_workspace/` and skip the corresponding agent's phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information transfer, revision requests |

File naming convention: `{order_number}_{deliverable_name}.md`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Insufficient organization info | Design hypothesis-based OKR using industry benchmarks, tag with "HYPOTHESIS-BASED" |
| Web search failure | Proceed with general knowledge, tag with "DATA LIMITED" |
| Agent failure | Retry once → if still failing, proceed without that deliverable and note the omission in the review report |
| RED found in review | Send revision request to the relevant agent → rework → re-verify (up to 2 iterations) |
| OKR-SWOT contradiction | Identify the contradiction point and coordinate between okr-designer and swot-specialist |

## Test Scenarios

### Normal Flow
**Prompt**: "Build a 2025 strategy framework for a Series B SaaS startup (50 employees). We're in the B2B HR tech space and want to grow ARR from $5M to $10M."
**Expected Result**:
- OKR: 3-5 company-level Objectives + department-level cascading
- BSC: Four-perspective KPI mapping + strategy map, reflecting core SaaS metrics (ARR, NRR, CAC, LTV)
- SWOT: Reflecting HR tech industry trends, 5+ TOWS strategies
- Vision & Mission: Statements appropriate for a SaaS company
- Roadmap: Quarterly milestones + ARR growth trajectory

### Existing File Flow
**Prompt**: "I've already done the SWOT analysis. Based on this, build the OKR, BSC, and roadmap." + attached SWOT file
**Expected Result**:
- Copy the SWOT file to `_workspace/03_swot_analysis.md`
- Skip swot-specialist; deploy okr-designer + bsc-analyst + strategy-writer + reviewer
- Incorporate the existing SWOT's TOWS strategies into the OKR and roadmap

### Error Flow
**Prompt**: "Build a strategy framework for our company"
**Expected Result**:
- Insufficient organization info → Ask follow-up questions about industry/size/current situation
- If only minimal info (industry name) is provided, generate a hypothesis-based framework using benchmarks
- Tag all documents with "HYPOTHESIS-BASED — Needs validation with actual data"

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Skill | File | Target Agent | Role |
|-------|------|-------------|------|
| okr-quality-checker | `.claude/skills/okr-quality-checker/skill.md` | okr-designer, strategy-reviewer | QSIM/SMART-V criteria, OKR structure verification, scoring system, anti-patterns |
| tows-matrix-builder | `.claude/skills/tows-matrix-builder/skill.md` | swot-specialist, strategy-writer | TOWS matrix structure, SO/WO/ST/WT strategy derivation guide, priority evaluation |
