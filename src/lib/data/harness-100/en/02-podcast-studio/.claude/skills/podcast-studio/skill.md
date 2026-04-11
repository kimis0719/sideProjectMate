---
name: podcast-studio
description: "A full production pipeline where an agent team collaborates to generate podcast episode content — planning, research, scripting, show notes, and distribution strategy — all at once. Use this skill for requests like 'plan a podcast episode,' 'write an episode script,' 'podcast scriptwriting,' 'podcast show notes,' 'episode planning,' 'interview script,' 'podcast distribution,' 'audio content planning,' and other podcast production tasks. Also supports show note or distribution package creation when an existing script or research is provided. Note: actual audio recording/editing (Audacity, GarageBand), podcast hosting API integration, and RSS feed technical setup are outside this skill's scope."
---

# Podcast Studio — Full Podcast Production Pipeline

An agent team collaborates to produce podcast episodes through the pipeline of planning → research → scripting → show notes → distribution, all at once.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Roster

| Agent | File | Role | Type |
|-------|------|------|------|
| researcher | `.claude/agents/researcher.md` | Topic investigation, fact-checking, talking point extraction | general-purpose |
| scriptwriter | `.claude/agents/scriptwriter.md` | Episode script writing, dialogue cue insertion | general-purpose |
| shownote-editor | `.claude/agents/shownote-editor.md` | Show notes, timestamps, reference compilation | general-purpose |
| distribution-manager | `.claude/agents/distribution-manager.md` | Platform-specific metadata, promotional copy | general-purpose |
| production-reviewer | `.claude/agents/production-reviewer.md` | Cross-validation, consistency checks | general-purpose |

## Workflow

### Phase 1: Preparation (Performed directly by the orchestrator)

1. Extract from user input:
   - **Topic/Keywords**: The subject the episode will cover
   - **Podcast Info** (optional): Show tone, listener base, existing episode direction
   - **Episode Type** (optional): Solo/Interview/Panel/Storytelling/Q&A
   - **Guest Info** (optional): Guest name, area of expertise
   - **Constraints** (optional): Episode length, specific requirements
   - **Existing Files** (optional): Scripts, research materials, etc. provided by the user
2. Create the `_workspace/` directory at the project root
3. Organize the input and save it as `_workspace/00_input.md`
4. If existing files are provided, copy them to `_workspace/` and skip the corresponding phase
5. Determine the **execution mode** based on request scope (see "Scope-Based Modes" below)

### Phase 2: Team Assembly and Execution

Assemble the team and assign tasks. Task dependencies are as follows:

| Order | Task | Owner | Depends On | Deliverable |
|-------|------|-------|------------|-------------|
| 1 | Topic research | researcher | None | `_workspace/01_research_brief.md` |
| 2 | Script writing | scriptwriter | Task 1 | `_workspace/02_script.md` |
| 3a | Show notes | shownote-editor | Tasks 1, 2 | `_workspace/03_shownotes.md` |
| 3b | Distribution package | distribution-manager | Tasks 1, 2 | `_workspace/04_distribution_package.md` |
| 4 | Production review | production-reviewer | Tasks 2, 3a, 3b | `_workspace/05_review_report.md` |

Tasks 3a (show notes) and 3b (distribution) run **in parallel**. Both depend on Task 2 (script), so they can start simultaneously once the script is complete.

**Inter-agent communication flow:**
- researcher complete → deliver talking points & facts to scriptwriter, references to shownote-editor, trending keywords to distribution-manager
- scriptwriter complete → deliver segment timecodes to shownote-editor, key quotes to distribution-manager
- shownote-editor complete → deliver episode summary & quotes to distribution-manager
- reviewer cross-validates all deliverables. On 🔴 Must Fix: request revision from the responsible agent → rework → re-validate (up to 2 rounds)

### Phase 3: Integration and Final Deliverables

Compile the final deliverables based on the reviewer's report:

1. Verify all files in `_workspace/`
2. Confirm all 🔴 Must Fix items from the review report have been addressed
3. Report the final summary to the user:
   - Research Brief — `01_research_brief.md`
   - Episode Script — `02_script.md`
   - Show Notes — `03_shownotes.md`
   - Distribution Package — `04_distribution_package.md`
   - Review Report — `05_review_report.md`

## Scope-Based Modes

Adjust the agents deployed based on the scope of the user's request:

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|----------------|-----------------|
| "Plan a podcast episode," "full production" | **Full Pipeline** | All 5 |
| "Just write the script," "script only" | **Script Mode** | researcher + scriptwriter + reviewer |
| "Create show notes from this script" (existing file) | **Show Notes Mode** | shownote-editor + reviewer |
| "Create promo copy for this episode" (existing script) | **Distribution Mode** | distribution-manager + reviewer |
| "Review this script" | **Review Mode** | reviewer only |

**Using Existing Files**: If the user provides a script, research materials, or other existing files, copy them to the appropriate numbered position in `_workspace/` and skip that phase's agent.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-based | `_workspace/` directory | Primary deliverable storage and sharing |
| Message-based | SendMessage | Real-time key information transfer, revision requests |
| Task-based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{order}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Web search failure | Researcher works from general knowledge, report notes "data limitation" |
| Guest info unavailable | Provide generic interview framework, request guest info from user |
| Agent failure | Retry once → if still failing, proceed without that deliverable, note omission in review report |
| 🔴 found in review | Request revision from responsible agent → rework → re-validate (up to 2 rounds) |

## Test Scenarios

### Happy Path
**Prompt**: "Plan a 30-minute interview podcast episode on AI ethics. The guest is an AI researcher"
**Expected Results**:
- Research: 5+ latest AI ethics issues, guest background, 5 talking points
- Script: 30-minute length (~4,500 words in English), opening + 3–4 segments + closing, guest questions included
- Show notes: Timestamps, reference links, key quotes
- Distribution: Platform-specific descriptions, 3 social media copy variants, promotional calendar
- Review: All consistency matrix items verified

### Existing File Flow
**Prompt**: "Create show notes and a distribution package from this script" + script file attached
**Expected Results**:
- Existing script copied to `_workspace/02_script.md`
- Show Notes Mode + Distribution Mode merged: shownote-editor + distribution-manager + reviewer deployed
- researcher, scriptwriter skipped

### Error Flow
**Prompt**: "Just write a podcast script quickly, any topic"
**Expected Results**:
- Switch to Script Mode (researcher + scriptwriter + reviewer)
- Topic is unclear, so researcher proposes 3 trending topics before proceeding
- Review report notes "show notes/distribution package not generated"

## Agent Extension Skills

Each agent leverages the following extension skills to enhance deliverable quality:

| Agent | Extension Skill | Knowledge Provided |
|-------|----------------|-------------------|
| scriptwriter | `/interview-techniques` | DEPTH question model, emotional arc, type-specific question patterns |
| scriptwriter, shownote-editor | `/audio-storytelling` | 5 narrative arcs, BPM pacing, 12 audio devices |
| distribution-manager | `/podcast-growth` | Platform-specific metadata optimization, 7-day promotional calendar, HIKE copy formula |
