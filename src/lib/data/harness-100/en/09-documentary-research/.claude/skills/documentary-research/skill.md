---
name: documentary-research
description: "A full production pipeline where an agent team collaborates to generate documentary research, treatments, interview questions, and narration scripts all at once. Use this skill for 'plan a documentary,' 'create a documentary treatment,' 'documentary research,' 'create interview questions,' 'write a narration script,' 'investigative reporting plan,' 'documentary scenario,' and all other aspects of documentary production. Also supports treatment writing or narration scripting when existing research materials are provided. Note: actual video filming/editing (Premiere, DaVinci), interview scheduling/conducting, and broadcast transmission are outside the scope of this skill."
---

# Documentary Research — Documentary Production Full Pipeline

An agent team collaborates to generate documentary research, treatments, interview questions, and narration scripts all at once.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| researcher | `.claude/agents/researcher.md` | Research, statistics collection, source organization | general-purpose |
| story-architect | `.claude/agents/story-architect.md` | 3-act treatment, scene division, narrative arc | general-purpose |
| interviewer | `.claude/agents/interviewer.md` | Interview subject selection, question design | general-purpose |
| narrator | `.claude/agents/narrator.md` | Narration script, tone, rhythm | general-purpose |
| fact-checker | `.claude/agents/fact-checker.md` | Fact verification, source confirmation, bias check | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by the Orchestrator)

1. Extract from user input:
   - **Topic**: The subject the documentary will cover
   - **Format**: Investigative/Character-driven/Historical/Observational
   - **Length**: 15 min/30 min/60 min/90 min
   - **Tone** (optional): Objective/Emotional/Tense/Reflective
   - **Existing Files** (optional): Research materials, proposals, etc.
2. Create the `_workspace/` directory in the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. If existing files are present, copy them to `_workspace/` and skip the corresponding Phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Assigned To | Dependencies | Deliverable |
|-------|------|------------|--------------|-------------|
| 1 | Research | researcher | None | `_workspace/01_research_brief.md` |
| 2 | Treatment writing | story-architect | Task 1 | `_workspace/02_structure.md` |
| 3a | Interview guide | interviewer | Tasks 1, 2 | `_workspace/03_interview_guide.md` |
| 3b | Narration script | narrator | Tasks 1, 2 | `_workspace/04_narration_script.md` |
| 4 | Fact-check/Review | fact-checker | Tasks 1, 3a, 3b | `_workspace/05_review_report.md` |

Tasks 3a (interview) and 3b (narration) are **executed in parallel**. Both depend on Tasks 1 (research) and 2 (treatment).

**Inter-team communication flow:**
- researcher complete -> Deliver timelines and key facts to story-architect, deliver expert list to interviewer
- story-architect complete -> Deliver scene-by-scene interview needs to interviewer, deliver tone and emotional flow to narrator
- interviewer <-> narrator: Share interview topics to prevent overlap with narration
- fact-checker cross-validates all deliverables. When RED Must Fix is found, request revisions from the relevant agent -> rework -> re-verify (up to 2 times)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all RED Must Fix items from the review report have been addressed
3. Report the final summary to the user:
   - Research brief — `01_research_brief.md`
   - Treatment — `02_structure.md`
   - Interview guide — `03_interview_guide.md`
   - Narration script — `04_narration_script.md`
   - Fact-check report — `05_review_report.md`

## Modes by Task Scale

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Plan a documentary," "Full production" | **Full Pipeline** | All 5 |
| "Just do the research" | **Research Mode** | researcher + fact-checker |
| "Create a treatment from this material" (existing files) | **Treatment Mode** | story-architect + fact-checker |
| "Just create interview questions" | **Interview Mode** | researcher + interviewer + fact-checker |
| "Just write the narration script" (existing treatment) | **Narration Mode** | narrator + fact-checker |

**Using Existing Files**: When the user provides research materials, treatments, etc., copy the files to the appropriate location in `_workspace/` and skip the corresponding agents.

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
| Web search failure | Work based on general knowledge, note "data limitations" in report |
| Only one perspective found | Intentionally search for opposing perspectives, note in report if not found |
| Agent failure | 1 retry -> if still fails, proceed without that deliverable, note omission in review report |
| RED found in review | Request revision from relevant agent -> rework -> re-verify (up to 2 times) |
| Sensitive topic | Note legal/ethical risks in report, recommend professional legal counsel |

## Test Scenarios

### Normal Flow
**Prompt**: "Plan a 30-minute documentary about the rise in single-person households and social isolation"
**Expected Result**:
- Research: Statistics (single-person household ratio, social isolation indicators), expert list, multiple perspectives
- Treatment: 3-act structure, 7-10 scenes, emotion curve (empathy -> deepening -> hope)
- Interviews: 5-7 person guide including sociology professor, single-person household member, policy official, etc.
- Narration: Approx. 7,500-word script with visual directions
- Fact-check: Statistical source verification, balance verification

### Existing File Utilization Flow
**Prompt**: "Write a documentary treatment and narration script from this research" + research file attached
**Expected Result**:
- Copy existing research to `_workspace/01_research_brief.md`
- Treatment Mode + Narration Mode combined: Deploy story-architect + narrator + fact-checker
- Skip researcher, interviewer

### Error Flow
**Prompt**: "Just do documentary research, any social issue topic"
**Expected Result**:
- Switch to Research Mode (researcher + fact-checker)
- Topic unclear, so researcher proposes 3 recent social issues then proceeds
- Fact-check report notes "Treatment/Interview/Narration not generated"

## Extended Skills per Agent

Each agent leverages the following extended skills' specialized knowledge to enhance deliverable quality:

| Agent | Extended Skill | Knowledge Provided |
|-------|---------------|-------------------|
| researcher, fact-checker | `/investigative-research` | PRIMA source hierarchy, CRAAP reliability assessment, triangulation, bias analysis |
| story-architect, narrator | `/narrative-structure` | 5 narrative types, 3-act structure, emotion curves, scene arrangement strategy |
| interviewer | `/interview-design` | VOICE subject selection, funnel question model, type-specific strategies, ethics principles |
