---
name: game-narrative
description: "A full narrative pipeline where an agent team collaborates to design game story, quests, dialogue, and branching scenarios all at once. Use this skill for 'create a game scenario,' 'game story design,' 'quest design,' 'game dialogue writing,' 'branching scenarios,' 'world-building,' 'NPC dialogue,' 'game scenario branching,' 'interactive story,' and all other aspects of game narrative design. Also supports quest/dialogue/branch design when existing world-building or story is provided. Note: game programming, level design (terrain/maps), game balancing (numerical values), and UI/UX design are outside the scope of this skill."
---

# Game Narrative — Full Game Narrative Design Pipeline

An agent team collaborates to design game world-building, quests, dialogue, and branching all at once.

## Execution Mode

**Agent Team** — 5 members communicate directly via SendMessage and cross-validate each other's work.

## Agent Composition

| Agent | File | Role | Type |
|-------|------|------|------|
| worldbuilder | `.claude/agents/worldbuilder.md` | World-building, factions, character design | general-purpose |
| quest-designer | `.claude/agents/quest-designer.md` | Main/side quest design | general-purpose |
| dialogue-writer | `.claude/agents/dialogue-writer.md` | NPC dialogue, choices, cutscenes | general-purpose |
| branch-architect | `.claude/agents/branch-architect.md` | Branch structures, endings, flags | general-purpose |
| narrative-reviewer | `.claude/agents/narrative-reviewer.md` | Consistency, plot hole verification | general-purpose |

## Workflow

### Phase 1: Preparation (Performed Directly by the Orchestrator)

1. Extract from user input:
   - **Game Genre**: RPG/Adventure/Visual Novel/MMORPG, etc.
   - **World-Building Direction**: Fantasy/Sci-Fi/Modern/Historical, etc.
   - **Story Tone**: Dark/Light/Humorous/Epic
   - **Expected Scale**: Playtime, number of quests
   - **Existing Settings** (optional): World-building, characters, etc. provided by the user
2. Create the `_workspace/` directory in the project root
3. Organize the input and save it to `_workspace/00_input.md`
4. If existing files are present, copy them to `_workspace/` and skip the corresponding Phase
5. **Determine the execution mode** based on the scope of the request

### Phase 2: Team Assembly and Execution

| Order | Task | Assigned To | Dependencies | Deliverable |
|-------|------|------------|--------------|-------------|
| 1 | World-building | worldbuilder | None | `_workspace/01_worldbuilding.md` |
| 2 | Quest design | quest-designer | Task 1 | `_workspace/02_quest_design.md` |
| 3a | Dialogue writing | dialogue-writer | Tasks 1, 2 | `_workspace/03_dialogue_script.md` |
| 3b | Branch design | branch-architect | Tasks 1, 2 | `_workspace/04_branch_map.md` |
| 4 | Narrative review | narrative-reviewer | Tasks 2, 3a, 3b | `_workspace/05_review_report.md` |

Tasks 3a (dialogue) and 3b (branching) are **executed in parallel**. Since both depend on Task 2 (quests), they can start simultaneously after quest design is complete.

**Inter-team communication flow:**
- worldbuilder complete -> Deliver factions, characters, and locations to quest-designer; deliver character personalities and speech patterns to dialogue-writer; deliver faction relationships and world rules to branch-architect
- quest-designer complete -> Deliver per-quest dialogue lists to dialogue-writer; deliver branching points to branch-architect
- dialogue-writer <-> branch-architect: Coordinate choices and branching flags with each other
- reviewer cross-validates all deliverables. When RED Must Fix is found, request revisions from the relevant agent -> rework -> re-verify (up to 2 times)

### Phase 3: Integration and Final Deliverables

1. Verify all files in `_workspace/`
2. Confirm that all RED Must Fix items from the review report have been addressed
3. Report the final summary to the user:
   - World-building settings — `01_worldbuilding.md`
   - Quest design — `02_quest_design.md`
   - Dialogue script — `03_dialogue_script.md`
   - Branch structure map — `04_branch_map.md`
   - Review report — `05_review_report.md`

## Modes by Task Scale

| User Request Pattern | Execution Mode | Agents Deployed |
|---------------------|---------------|-----------------|
| "Design a full game scenario," "Full narrative" | **Full Pipeline** | All 5 |
| "Just design the world-building" | **World-Building Mode** | worldbuilder + narrative-reviewer |
| "Create quests from this world-building" (existing files) | **Quest Mode** | quest-designer + dialogue-writer + narrative-reviewer |
| "Just write NPC dialogue" (existing quests) | **Dialogue Mode** | dialogue-writer + narrative-reviewer |
| "Just design branching scenarios" (existing quests) | **Branch Mode** | branch-architect + narrative-reviewer |

**Using Existing Files**: When the user provides existing settings such as world-building or quests, copy the files to `_workspace/` and skip the corresponding steps.

## Data Transfer Protocol

| Strategy | Method | Purpose |
|----------|--------|---------|
| File-Based | `_workspace/` directory | Storing and sharing major deliverables |
| Message-Based | SendMessage | Real-time delivery of key information, revision requests |
| Task-Based | TaskCreate/TaskUpdate | Progress tracking, dependency management |

File naming convention: `{sequence}_{deliverable}.{extension}`

## Error Handling

| Error Type | Strategy |
|-----------|----------|
| Genre/setting unclear | Worldbuilder proposes 3 concepts, proceed after user selection |
| Request based on existing IP | Respect original settings, create only in expandable areas, note copyright considerations |
| Agent failure | 1 retry -> if still fails, proceed without that deliverable, note omission in review report |
| RED found in review | Request revision from relevant agent -> rework -> re-verify (up to 2 times) |

## Test Scenarios

### Normal Flow
**Prompt**: "Create an RPG game scenario in a steampunk world. 5 main quests, 3 endings"
**Expected Result**:
- World-building: Steampunk world settings, 3+ factions, 5+ key characters, historical timeline
- Quests: 5 main + 3-5 side, reward table, difficulty curve
- Dialogue: 5+ cutscenes, 10+ NPC conversations, bark table
- Branching: 3-5 key branch points, 3+ endings + 1 hidden, flag system
- Review: Complete consistency matrix, branch path simulation

### Existing File Utilization Flow
**Prompt**: "Create quests and dialogue from this world-building" + world-building document attached
**Expected Result**:
- Copy existing world-building to `_workspace/01_worldbuilding.md`
- Quest Mode: Deploy quest-designer + dialogue-writer + narrative-reviewer
- Skip worldbuilder

### Error Flow
**Prompt**: "Create a game scenario, pick the genre yourself"
**Expected Result**:
- Worldbuilder proposes 3 concepts: Fantasy/Sci-Fi/Post-Apocalyptic
- Proceed with full pipeline after user selection
- Review report notes "Proceeded based on user selection"

## Extended Skills per Agent

Each agent leverages the following extended skills' specialized knowledge to enhance deliverable quality:

| Agent | Extended Skill | Knowledge Provided |
|-------|---------------|-------------------|
| quest-designer | `/quest-design-patterns` | 12 quest archetypes, DRIP reward model, difficulty curves |
| dialogue-writer | `/dialogue-systems` | VOICE character voice, choice psychology, bark system, cutscene direction |
| branch-architect | `/branching-logic` | 6 branching patterns, flag system design, ending architecture |
