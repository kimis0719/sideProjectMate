---
name: knowledge-base-builder
description: "A pipeline where an agent team builds organizational knowledge management systems. Use this skill for requests such as 'build a knowledge base,' 'wiki setup,' 'knowledge management system,' 'internal wiki,' 'organize team documentation,' 'technical documentation wiki,' 'create onboarding docs,' 'organize organizational knowledge,' or 'build documentation system.' Note: CMS server setup, database installation, and search engine deployment are outside the scope of this skill."
---

# Knowledge Base Builder — Organizational Knowledge Management Pipeline

An agent team collaborates to execute: knowledge collection, taxonomy design, markdown wiki generation, search indexing, and maintenance guidelines.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and perform cross-validation.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| knowledge-collector | `.claude/agents/knowledge-collector.md` | Knowledge collection, inventory building | general-purpose |
| taxonomy-designer | `.claude/agents/taxonomy-designer.md` | Classification system, tags, navigation design | general-purpose |
| wiki-builder | `.claude/agents/wiki-builder.md` | Markdown wiki page generation | general-purpose |
| search-optimizer | `.claude/agents/search-optimizer.md` | Search index, metadata optimization | general-purpose |
| maintenance-planner | `.claude/agents/maintenance-planner.md` | Governance, update cycles, quality management | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by Orchestrator)

1. Extract from user input:
    - **Target Organization/Project**: What knowledge to manage
    - **Target Audience**: Who will use it
    - **Existing Documents** (optional): Currently available documents, codebase
    - **Platform Preference** (optional): MkDocs, Docusaurus, Notion, GitHub Wiki, etc.
2. Create the `_workspace/` directory in the project root
3. Organize inputs and save to `_workspace/00_input.md`
4. If existing documents are available, designate them for analysis
5. Determine the **execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependencies | Deliverable |
|-------|------|-------|-------------|-------------|
| 1 | Knowledge Collection | knowledge-collector | None | `_workspace/01_knowledge_inventory.md` |
| 2 | Taxonomy Design | taxonomy-designer | Task 1 | `_workspace/02_taxonomy.md` |
| 3a | Wiki Page Generation | wiki-builder | Tasks 1, 2 | `_workspace/03_wiki/` |
| 3b | Search Index | search-optimizer | Tasks 1, 2 | `_workspace/04_search_index.md` (draft) |
| 4 | Search Index Finalization | search-optimizer | Task 3a | `_workspace/04_search_index.md` (final) |
| 5 | Maintenance Guide | maintenance-planner | Tasks 1, 2, 3a | `_workspace/05_maintenance_guide.md` |

Tasks 3a (wiki generation) and 3b (search index draft) are executed **in parallel**.

**Inter-agent Communication Flow:**
- knowledge-collector completes -> Delivers inventory to taxonomy-designer; delivers original content to wiki-builder
- taxonomy-designer completes -> Delivers structure and naming conventions to wiki-builder; delivers tag scheme to search-optimizer
- wiki-builder completes -> Delivers page list to search-optimizer; delivers structure info to maintenance-planner
- maintenance-planner writes guide based on all deliverables

### Phase 3: Integration and Final Deliverables

1. Review all files in `_workspace/`
2. Verify no broken links or missing pages in the wiki
3. Present the final summary to the user:
    - Knowledge Inventory — `01_knowledge_inventory.md`
    - Taxonomy — `02_taxonomy.md`
    - Markdown Wiki — `03_wiki/`
    - Search Index — `04_search_index.md`
    - Maintenance Guide — `05_maintenance_guide.md`

## Execution Modes by Request Scope

| User Request Pattern | Execution Mode | Deployed Agents |
|---------------------|---------------|-----------------|
| "Build a knowledge base," "Create a wiki" | **Full Pipeline** | All 5 agents |
| "Just organize existing docs" | **Organization Mode** | knowledge-collector + taxonomy-designer |
| "Just design the taxonomy" | **Taxonomy Mode** | taxonomy-designer solo |
| "Create wiki pages with this structure" | **Generation Mode** | wiki-builder + search-optimizer |
| "Just write a maintenance guide" | **Guide Mode** | maintenance-planner solo |

**Using Existing Files**: If existing documents are available, knowledge-collector analyzes them and converts to an inventory.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Primary deliverable storage and sharing |
| Message-based | SendMessage | Real-time critical information transfer, revision requests |
| Code exploration | Read/Grep/Glob | Extract documentation targets from codebase |

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Source inaccessible | Infer knowledge based on user description; mark as "inference-based" |
| Excessive knowledge scope | Propose MVP scope; take a phased approach based on priorities |
| Existing taxonomy conflict | Respect existing structure while presenting improvement proposals in parallel |
| Agent failure | Retry once; if still failing, proceed without that deliverable; note omission in report |
| Wiki platform unspecified | Default to pure Markdown (GitHub/MkDocs compatible) |

## Test Scenarios

### Normal Flow
**Prompt**: "Create a wiki for our team's development processes and onboarding docs. We're a 5-developer team using React + Node.js."
**Expected Results**:
- Knowledge Collection: Inventory of dev processes, environment setup, coding conventions, deployment procedures, etc.
- Taxonomy: Categories such as Getting Started, Development, Deployment, Reference
- Wiki: 10+ pages with YAML front matter and cross-links
- Search Index: JSON format with synonym dictionary
- Maintenance Guide: Governance model and update cycles

### Existing Materials Flow
**Prompt**: "Create a wiki based on these README files" + multiple README files
**Expected Results**:
- knowledge-collector extracts knowledge from READMEs
- Analyzes existing structure to design taxonomy
- Converts to markdown wiki, preserving original content

### Error Flow
**Prompt**: "Build a company knowledge base"
**Expected Results**:
- Scope is broad, so knowledge-collector suggests domain scoping questions
- Proposes MVP based on typical corporate knowledge structure template
- Maintenance guide includes "phased expansion roadmap"

## Agent Extension Skills

Extension skills that enhance each agent's domain expertise:

| Agent | Extension Skill | Role |
|-------|----------------|------|
| taxonomy-designer | `information-architecture` | 4 IA systems, card sorting, sitemap design, tag governance |
| maintenance-planner, wiki-builder | `content-lifecycle-manager` | 5-stage lifecycle, quality scorecard, RACI governance, content auditing |
