---
name: comic-creator
description: "A full production pipeline where an agent team collaborates to create comics — from storyboarding through dialogue, image generation, and editing — covering 4-panel strips, short-form, and long-form (including webtoon). Use this skill for 'create a comic,' 'draw a 4-panel strip,' 'webtoon production,' 'comic storyboard,' 'comic strip,' 'comic scenario,' 'illustrated comic,' 'comic storyboard,' and all other comic creation tasks. Also supports image generation or editing specification when an existing scenario is provided. Note: actual image editing software (Photoshop, Clip Studio) operation, print production, and webtoon platform uploads are outside this skill's scope."
---

# Comic Creator — Full Comic Production Pipeline

Produce comics from storyboard through dialogue, image generation, and editing via an agent team, all in one pass. Supports 4-panel strips, short-form, and long-form (chapter-based) formats.

## Execution Mode

**Agent Team** — Five agents communicate directly via SendMessage and cross-validate each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| storyboarder | `.claude/agents/storyboarder.md` | Synopsis, storyboard, panel layout design | general-purpose |
| dialogue-writer | `.claude/agents/dialogue-writer.md` | Character dialogue, sound effects, narration | general-purpose |
| image-generator | `.claude/agents/image-generator.md` | Gemini-based panel image generation | general-purpose |
| comic-editor | `.claude/agents/comic-editor.md` | Speech bubble placement, page editing spec | general-purpose |
| quality-reviewer | `.claude/agents/quality-reviewer.md` | Consistency validation, continuity checks | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by the Orchestrator)

1. Extract from user input:
   - **Topic/Story Idea**: The story to turn into a comic
   - **Format**: 4-panel / Short-form (8-16 pages) / Long-form (chapter-based) / Webtoon
   - **Genre**: Comedy, drama, fantasy, slice-of-life, action, etc.
   - **Art Style** (optional): Manga, American comics, webtoon style, etc.
   - **Existing Files** (optional): Scenario, character settings, etc.
2. Create `_workspace/` directory and `_workspace/panels/` subdirectory
3. Organize input and save to `_workspace/00_input.md`
4. If existing files are available, copy to `_workspace/` and skip corresponding phase
5. Determine execution mode based on request scope

### Phase 2: Team Assembly and Execution

| Order | Task | Owner | Dependency | Deliverable |
|-------|------|-------|------------|-------------|
| 1 | Storyboard | storyboarder | None | `_workspace/01_storyboard.md` |
| 2a | Dialogue writing | dialogue-writer | Task 1 | `_workspace/02_dialogue.md` |
| 2b | Panel image generation | image-generator | Task 1 | `_workspace/03_image_prompts.md`, `_workspace/panels/` |
| 3 | Page editing spec | comic-editor | Tasks 1, 2a, 2b | `_workspace/04_layout.md` |
| 4 | Quality review | quality-reviewer | Tasks 2a, 2b, 3 | `_workspace/05_review_report.md` |

Tasks 2a (dialogue) and 2b (images) run **in parallel**. Both depend only on Task 1 (storyboard).

**Inter-agent communication flow:**
- storyboarder completes -> delivers per-panel situations and emotions to dialogue-writer; character sheets and compositions to image-generator
- dialogue-writer completes -> delivers SFX style to image-generator; bubble types and reading order to comic-editor
- image-generator completes -> delivers image files and blank area info to comic-editor
- comic-editor completes -> delivers editing spec to quality-reviewer
- quality-reviewer cross-validates all deliverables. On RED Must Fix findings, sends revision requests -> rework -> re-validate (up to 2 cycles)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm all RED Must Fix items have been addressed
3. Report final summary to user

## Execution Modes by Scope

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|----------------|
| "Create a comic," "full production" | **Full Pipeline** | All 5 agents |
| "Just create a storyboard" | **Storyboard Mode** | storyboarder + reviewer |
| "Make a comic from this scenario" (existing file) | **Image Mode** | image-generator + comic-editor + reviewer |
| "Just write the dialogue" | **Dialogue Mode** | storyboarder + dialogue-writer + reviewer |
| "Review this comic" | **Review Mode** | reviewer only |

**Using Existing Files**: If the user provides a scenario, storyboard, etc., copy to `_workspace/` and skip that agent's phase.

## Data Transfer Protocol

| Strategy | Method | Use Case |
|----------|--------|----------|
| File-based | `_workspace/` directory | Store and share major deliverables |
| Message-based | SendMessage | Real-time key information delivery, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order_number}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Image generation failure | Proceed with text prompts only; user can retry with the prompts |
| Character consistency breaks | Strengthen character descriptions in prompts and regenerate (up to 2 times) |
| Agent failure | Retry once -> if still failing, proceed without that deliverable; note in review report |
| RED found in review | Send revision request -> rework -> re-validate (up to 2 cycles) |
| Content rejected as inappropriate | Modify prompt and retry; note in report |

## Test Scenarios

### Normal Flow
**Prompt**: "Create a 4-panel comic about a programmer's daily life. Comedy genre."
**Expected Result**:
- Storyboard: 4-panel setup-development-twist-punchline storyboard, character sheet
- Dialogue: Character-specific speech, sound effects, punchline
- Images: 4 panel images generated (consistent art style)
- Editing: Speech bubble placement, reading flow specification
- Review: Full consistency matrix verified

### Existing File Flow
**Prompt**: "Create a webtoon from this scenario" + attached scenario file
**Expected Result**:
- Incorporate existing scenario into `_workspace/01_storyboard.md`
- Storyboarder adds panel layout design on top of existing scenario
- Deploy dialogue-writer + image-generator + comic-editor + reviewer

### Error Flow
**Prompt**: "Just create a quick storyboard, any topic"
**Expected Result**:
- Switch to storyboard mode (storyboarder + reviewer)
- Topic is unclear, so storyboarder proposes 3 genre-based synopses
- Review report notes "Dialogue/image/editing not generated"

## Agent Extension Skills

| Agent | Extension Skill | Knowledge Provided |
|-------|----------------|-------------------|
| storyboarder, image-generator | `/panel-composition` | Camera angles, gaze flow, page rhythm, prompt structure |
| dialogue-writer, comic-editor | `/visual-narrative` | Speech bubble systems, SFX typography, Show-Don't-Tell, scene transitions |
| storyboarder, image-generator | `/character-design-system` | Character sheets, silhouette test, expression charts, AI consistency strategy |
