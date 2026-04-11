---
name: book-publishing
description: "A full production pipeline where an agent team collaborates to perform e-book manuscript editing, proofreading, cover design, metadata setup, and distribution preparation all at once. Use this skill for 'publish my e-book,' 'edit my manuscript,' 'create a book cover,' 'e-book metadata,' 'book proofreading,' 'self-publishing preparation,' 'e-book distribution,' 'manuscript review,' 'ebook production,' and all other aspects of e-book publishing. Also supports cover creation or metadata setup when an existing manuscript is provided. Note: actual EPUB/PDF file conversion, bookstore account registration, print ordering, and marketing execution are outside the scope of this skill."
---

# Book Publishing — E-Book Publishing Full Production Pipeline

An agent team collaborates to perform e-book manuscript editing, proofreading, cover design, metadata, and distribution setup all at once.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| manuscript-editor | `.claude/agents/manuscript-editor.md` | Structural editing, style correction, ToC | general-purpose |
| proofreader | `.claude/agents/proofreader.md` | Spelling, grammar, notation standardization | general-purpose |
| cover-designer | `.claude/agents/cover-designer.md` | Cover concept, image generation | general-purpose |
| metadata-manager | `.claude/agents/metadata-manager.md` | Classification, description, keywords, distribution | general-purpose |
| publishing-reviewer | `.claude/agents/publishing-reviewer.md` | Quality verification, spec compliance | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by the Orchestrator)

1. Extract from user input:
   - **Manuscript**: Manuscript file to edit
   - **Genre**: Business/Self-Help/Fiction/Essay/Technical
   - **Publishing Goal**: Self-publishing/Publisher submission/Internal distribution
   - **Distribution Platforms** (optional): Kyobo, Ridibooks, Amazon KDP, etc.
   - **Existing Files** (optional): Edited manuscript, cover, etc.
2. Create `_workspace/` directory and `_workspace/covers/` subdirectory
3. Organize the input and save it to `_workspace/00_input.md`
4. If existing files are present, copy them to `_workspace/` and skip the corresponding Phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Assigned To | Dependencies | Deliverable |
|-------|------|------------|--------------|-------------|
| 1 | Manuscript editing | manuscript-editor | None | `_workspace/01_edited_manuscript.md` |
| 2a | Proofreading | proofreader | Task 1 | `_workspace/02_proofread_report.md` |
| 2b | Cover design | cover-designer | Task 1 | `_workspace/03_cover_concept.md` |
| 3 | Metadata | metadata-manager | Tasks 1, 2a | `_workspace/04_metadata.md` |
| 4 | Publishing review | publishing-reviewer | Tasks 2a, 2b, 3 | `_workspace/05_review_report.md` |

Tasks 2a (proofreading) and 2b (cover) are **executed in parallel**. Both depend on Task 1 (editing).

**Inter-team communication flow:**
- manuscript-editor complete -> Deliver terminology list to proofreader, tone/genre/target to cover-designer, title/keywords to metadata-manager
- proofreader complete -> Deliver finalized notation to metadata-manager
- cover-designer <-> metadata-manager: Cross-confirm exact title/subtitle/author name notation
- publishing-reviewer cross-validates all deliverables. When RED Must Fix is found, request revisions from the relevant agent -> rework -> re-verify (up to 2 times)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all RED Must Fix items from the review report have been addressed
3. Report the final summary to the user:
   - Edited manuscript — `01_edited_manuscript.md`
   - Proofreading report — `02_proofread_report.md`
   - Cover concept/images — `03_cover_concept.md`
   - Metadata/distribution — `04_metadata.md`
   - Review report — `05_review_report.md`

## Modes by Task Scale

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Publish my e-book," "Full publishing prep" | **Full Pipeline** | All 5 |
| "Just edit the manuscript" | **Editing Mode** | manuscript-editor + proofreader + reviewer |
| "Just proofread" | **Proofreading Mode** | proofreader + reviewer |
| "Just create the cover" | **Cover Mode** | cover-designer + reviewer |
| "Just set up metadata" | **Metadata Mode** | metadata-manager + reviewer |

**Using Existing Files**: When the user provides an edited manuscript, cover, etc., copy the files to the appropriate location in `_workspace/` and skip the corresponding agents.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-Based | `_workspace/` directory | Storing and sharing major deliverables |
| Message-Based | SendMessage | Real-time delivery of key information, revision requests |
| Task-Based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{sequence}_{deliverable_name}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| No manuscript provided | Switch to "planning mode" where manuscript-editor designs ToC and chapter outlines from title/topic |
| Cover image generation failure | Proceed with text concept and prompt only, available for user retry |
| Agent failure | 1 retry -> if still fails, proceed without that deliverable, note omission in review report |
| RED found in review | Request revision from relevant agent -> rework -> re-verify (up to 2 times) |
| ISBN not issued | Include issuance procedure guidance, proceed normally with remaining metadata |

## Test Scenarios

### Normal Flow
**Prompt**: "I want to publish this manuscript as an e-book. It is a self-help book, and I will distribute on Kyobo and Ridibooks." + manuscript file attached
**Expected Result**:
- Editing: Structural + line editing notes, ToC optimization
- Proofreading: Spelling/grammar/notation correction report
- Cover: A/B concept + image generation attempt
- Metadata: BISAC/KDC classification, description, keywords, Kyobo/Ridi distribution settings
- Review: Full consistency matrix, pre-distribution checklist

### Existing File Utilization Flow
**Prompt**: "The manuscript is already edited, just set up the cover and metadata" + edited manuscript attached
**Expected Result**:
- Copy edited manuscript to `_workspace/01_edited_manuscript.md`
- Cover Mode + Metadata Mode merged: Deploy cover-designer + metadata-manager + reviewer
- Skip manuscript-editor, proofreader

### Error Flow
**Prompt**: "Prepare e-book publishing, no manuscript yet, just have a topic — 'Gen Z Financial Planning'"
**Expected Result**:
- Switch to planning mode: manuscript-editor designs ToC and chapter outlines
- Skip proofreading (no manuscript)
- Cover concept and metadata drafted based on the plan
- Review report notes "Manuscript incomplete, planning stage"

## Extended Skills per Agent

Each agent leverages the following extended skills' specialized knowledge to enhance deliverable quality:

| Agent | Extended Skill | Knowledge Provided |
|-------|---------------|-------------------|
| manuscript-editor | `/developmental-editing` | SPINE check, genre-specific editing standards, pacing analysis, editing report format |
| cover-designer | `/cover-design-psychology` | Genre cover conventions, typography strategy, AI prompts, A/B testing |
| metadata-manager | `/book-metadata-seo` | BISAC/KDC classification, keyword optimization, AIDA descriptions, pricing psychology |
