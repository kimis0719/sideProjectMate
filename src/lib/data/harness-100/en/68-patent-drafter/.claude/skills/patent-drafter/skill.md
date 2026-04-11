---
name: patent-drafter
description: "A full patent specification drafting pipeline. An agent team collaborates to generate prior art search, claims, specification, and drawing descriptions in a single pass. Use this skill for contexts such as 'write a patent specification', 'patent application', 'invention patent', 'draft claims', 'prior art search', 'patent draft', 'patent specification draft', 'convert invention report to patent', 'turn an idea into a patent', and other patent specification drafting tasks. Note: Actual patent office filing, patent examination responses (opinion statements/amendments), patent litigation, and international filing (PCT/Paris Convention) practice are outside the scope of this skill."
---

# Patent Drafter — Patent Specification Drafting Pipeline

Converts an invention's technical idea into a systematic patent specification set.

## Execution Mode

**Agent Team** — 5 agents communicate directly via SendMessage and cross-verify each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| prior-art-researcher | `.claude/agents/prior-art-researcher.md` | Prior art search, novelty/inventive step analysis | general-purpose |
| claim-drafter | `.claude/agents/claim-drafter.md` | Independent/dependent claim drafting, claim scope design | general-purpose |
| specification-writer | `.claude/agents/specification-writer.md` | Detailed description of invention, embodiment writing | general-purpose |
| drawing-designer | `.claude/agents/drawing-designer.md` | Drawing composition, reference numeral descriptions | general-purpose |
| patent-reviewer | `.claude/agents/patent-reviewer.md` | Consistency cross-verification, description deficiency check | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Title of Invention**: Technical title
    - **Technical Field**: The field to which the invention belongs
    - **Invention Overview**: Core technical concept, components, operating principles
    - **Problem to be Solved**: Problems with existing technology and the problem to be solved
    - **Existing Materials** (optional): Invention report, technical documents, prototype information
2. Create the `_workspace/` directory in the project root
3. Organize the input and save to `_workspace/00_input.md`
4. Determine the **execution mode** based on the requested scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Output |
|-------|------|-------|-------------|--------|
| 1 | Prior Art Search | prior-art-researcher | None | `_workspace/01_prior_art_report.md` |
| 2 | Claim Drafting | claim-drafter | Task 1 | `_workspace/02_claims.md` |
| 3a | Specification Writing | specification-writer | Tasks 1, 2 | `_workspace/03_specification.md` |
| 3b | Drawing Design | drawing-designer | Task 2 | `_workspace/04_drawings.md` |
| 4 | Patent Review | patent-reviewer | Tasks 1, 2, 3a, 3b | `_workspace/05_review_report.md` |

Tasks 3a (Specification) and 3b (Drawing) are executed **in parallel**. Both depend on claims, so they can start simultaneously after Task 2 is complete. However, both sides communicate for reference numeral coordination.

**Inter-agent Communication Flow:**
- prior-art-researcher completes -> Delivers differentiation points and design-around direction to claim-drafter
- claim-drafter completes -> Delivers elements and terms to specification-writer, structure to drawing-designer
- specification-writer <-> drawing-designer: Mutual coordination of reference numeral system
- patent-reviewer cross-verifies all deliverables. If Red must-fix items found, requests revision from relevant agent (up to 2 times)

### Phase 3: Integration and Final Deliverables

1. Review all files in `_workspace/`
2. Verify that all Red must-fix items from the review report have been addressed
3. Report the final summary to the user:
    - Prior Art Search Report — `01_prior_art_report.md`
    - Claim Set — `02_claims.md`
    - Detailed Description of Invention — `03_specification.md`
    - Drawing Description — `04_drawings.md`
    - Review Report — `05_review_report.md`

## Modes by Request Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|----------------|-----------------|
| "Write the full patent specification" | **Full Pipeline** | All 5 agents |
| "Just search prior art" | **Search Mode** | prior-art-researcher only |
| "Just draft claims" | **Claims Mode** | claim-drafter + reviewer |
| "Write spec from these claims" (existing claims) | **Specification Mode** | specification-writer + drawing-designer + reviewer |
| "Review this specification" | **Review Mode** | patent-reviewer only |

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Storing and sharing main deliverables |
| Message-based | SendMessage | Real-time delivery of key info, numeral coordination, revision requests |

File naming convention: `{order}_{agent}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Web search failure | Prior art researcher works based on general knowledge, notes "DB search not performed" |
| Insufficient invention info | Request additional info from user, draft with minimum information |
| Agent failure | Retry once -> if failed, proceed without that deliverable, note omission in review report |
| Red items found in review | Request revision from relevant agent -> rework -> re-verify (up to 2 times) |
| Reference numeral mismatch | drawing-designer and specification-writer mutually coordinate |

## Test Scenarios

### Normal Flow
**Prompt**: "Write a patent specification for an IoT-based smart flowerpot automatic watering system. It measures with a soil moisture sensor and AI adjusts the watering amount based on plant type."
**Expected Results**:
- Prior Art Search: 5+ prior patents related to IoT watering systems and smart flowerpots
- Claims: Apparatus independent claim + method independent claim + 5+ dependent claims
- Specification: Complete structure from technical field through embodiments
- Drawings: System block diagram + detailed structure diagram + flowchart
- Review: All consistency matrix items verified

### Partial Flow
**Prompt**: "Just search prior art for this invention idea"
**Expected Results**:
- Switches to search mode (prior-art-researcher only)
- Prior art list + in-depth analysis + novelty/inventive step assessment

### Error Flow
**Prompt**: "Write a patent specification, the idea is new battery technology"
**Expected Results**:
- Full pipeline execution, additional questions due to insufficient invention details
- When drafting with minimum info, many items marked "inventor verification needed"
- Review report includes "recommend rewriting after supplementing detailed information"

## Agent Extension Skills

| Agent | Extension Skill | Purpose |
|-------|----------------|---------|
| claim-drafter, patent-reviewer | `claim-drafting-patterns` | Claim drafting patterns, claim scope design strategy |
| prior-art-researcher | `prior-art-search-strategy` | Prior art search strategy, novelty/inventive step analysis framework |
