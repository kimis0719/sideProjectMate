---
name: research-assistant
description: "A pipeline where an agent team systematically performs academic research assistance. Use this skill for requests such as 'search for papers,' 'literature review,' 'organize research materials,' 'academic research,' 'organize references,' 'prior research analysis,' 'research trend analysis,' 'literature search,' or 'academic note organization.' Note: experiment execution, statistical analysis execution, final paper writing, and journal submission are outside the scope of this skill."
---

# Research Assistant — Academic Research Assistance Pipeline

An agent team collaborates to execute: literature search, note-taking, critical synthesis, and reference management.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| literature-searcher | `.claude/agents/literature-searcher.md` | Literature search, relevance filtering | general-purpose |
| note-taker | `.claude/agents/note-taker.md` | Structured reading note creation | general-purpose |
| critic-synthesizer | `.claude/agents/critic-synthesizer.md` | Critical analysis, thematic synthesis | general-purpose |
| reference-manager | `.claude/agents/reference-manager.md` | Bibliographic information, citation format management | general-purpose |
| research-coordinator | `.claude/agents/research-coordinator.md` | Quality verification, final summary | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Research Topic/Question**: What to investigate
    - **Research Purpose** (optional): Paper writing, presentation, report, etc.
    - **Citation Format** (optional): APA, MLA, Chicago, etc. (default: APA 7th)
    - **Scope Limitations** (optional): Time period, language, field, number of sources
    - **Existing Materials** (optional): Already collected papers, notes
2. Create the `_workspace/` directory in the project root
3. Organize inputs and save to `_workspace/00_input.md`
4. If existing materials are provided, copy them to `_workspace/` and skip the relevant phase
5. Determine the **execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Literature Search | literature-searcher | None | `_workspace/01_literature_search.md` |
| 2a | Reading Notes | note-taker | Task 1 | `_workspace/02_reading_notes.md` |
| 2b | Draft Bibliography | reference-manager | Task 1 | `_workspace/04_bibliography.md` (draft) |
| 3 | Critical Synthesis | critic-synthesizer | Task 2a | `_workspace/03_critical_synthesis.md` |
| 4 | Final Bibliography | reference-manager | Task 3 | `_workspace/04_bibliography.md` (final) |
| 5 | Research Coordination | research-coordinator | Tasks 2a, 3, 4 | `_workspace/05_research_summary.md` |

Tasks 2a (notes) and 2b (draft bibliography) are executed **in parallel**.

**Inter-agent Communication Flow:**
- literature-searcher completes -> Delivers source list and priorities to note-taker; delivers bibliographic info to reference-manager
- note-taker completes -> Delivers notes and connections to critic-synthesizer
- critic-synthesizer completes -> Delivers citation list to reference-manager
- research-coordinator cross-verifies all deliverables. When RED issues are found, sends correction requests to the relevant agent -> rework -> re-verification (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

1. Review all files in `_workspace/`
2. Confirm all RED items from the research coordination report have been addressed
3. Present the final summary to the user:
    - Literature Search Results — `01_literature_search.md`
    - Reading Notes — `02_reading_notes.md`
    - Critical Synthesis — `03_critical_synthesis.md`
    - Bibliography — `04_bibliography.md`
    - Research Report — `05_research_summary.md`

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|---------------|-----------------|
| "Do a literature review," "Prior research analysis" | **Full Pipeline** | All 5 agents |
| "Just search for papers" | **Search Mode** | literature-searcher + reference-manager |
| "Organize these papers" (existing sources provided) | **Note Mode** | note-taker + critic-synthesizer + reference-manager |
| "Change the reference format" | **Bibliography Mode** | reference-manager solo |
| "Synthesize and analyze these sources" | **Synthesis Mode** | critic-synthesizer + research-coordinator |

**Using Existing Files**: If the user provides a paper list or notes, copy them to `_workspace/` and skip the corresponding phase.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Primary deliverable storage and sharing |
| Message-based | SendMessage | Real-time critical information transfer, revision requests |
| Web exploration | WebSearch/WebFetch | Academic resource search and collection |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Web search failure | Recommend based on known major journals and authors; note "search limitations" |
| Full text inaccessible | Work based on abstracts; mark "full text unverified" |
| Insufficient sources | Expand search to adjacent fields; label as "preliminary synthesis" |
| Agent failure | Retry once; if still failing, proceed without that deliverable; note omission in report |
| Citation format unknown | Apply APA 7th as default; request confirmation from the user |

## Test Scenarios

### Normal Flow
**Prompt**: "Do a literature review on 'hallucination mitigation techniques in large language models.' Use APA format."
**Expected Results**:
- Literature Search: 10+ sources, Boolean query documented, core/supporting/background classification
- Reading Notes: Structured notes per source, methodology analysis, key quote extraction
- Critical Synthesis: Thematic synthesis, research gap identification, temporal development trajectory
- Bibliography: APA 7th format, in-text citation guide, BibTeX
- Research Report: All consistency matrix items verified

### Existing Materials Flow
**Prompt**: "Organize and synthesize these 5 papers" + paper list provided
**Expected Results**:
- Skip literature search; organize provided paper list as `01_literature_search.md`
- Focus on note-taker + critic-synthesizer + reference-manager

### Error Flow
**Prompt**: "Find papers on the intersection of quantum computing and machine learning"
**Expected Results**:
- Switch to search mode
- Search for related papers via web search
- If results are limited, expand to adjacent fields + label as "preliminary search"

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| literature-searcher, critic-synthesizer | `systematic-review-protocol` | PRISMA flow diagram, PICO queries, Boolean strategies, literature quality assessment, thematic synthesis |
| reference-manager | `citation-formatter` | APA/MLA/Chicago formats, BibTeX conversion, citation quality checks |
