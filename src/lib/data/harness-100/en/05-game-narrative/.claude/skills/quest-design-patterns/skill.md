---
name: quest-design-patterns
description: "A specialized skill for the quest-designer agent covering quest design patterns. Provides quest archetypes, reward psychology, difficulty curves, and player motivation frameworks. Use for 'quest design,' 'reward systems,' 'mission structure,' 'quest patterns,' and similar topics."
---

# Quest Design Patterns — Quest Design Pattern Methodology

Specialized game design knowledge used by the quest-designer agent when designing main/side quests.

## Why Patterns Are Needed

Quests are the **glue connecting narrative and gameplay**. If the game just repeats "go kill 10 of these," players will disengage. Combining diverse structural patterns is what keeps players saying "just one more quest."

## 12 Quest Archetypes

### Combat/Action Category

| # | Archetype | Core Loop | Narrative Function | Risk Factor |
|---|-----------|-----------|-------------------|-------------|
| 1 | **Hunt** | Eliminate a specific target | Threat removal, proving heroism | Can become repetitive -> Give the target a story |
| 2 | **Defense** | Protect a base/NPC | Sense of responsibility, time pressure | Frustration on failure -> Provide partial success options |
| 3 | **Pursuit** | Track a fleeing target | Tension, spatial utilization | Repeated failure -> Adjust difficulty with staged clues |

### Exploration/Discovery Category

| # | Archetype | Core Loop | Narrative Function | Risk Factor |
|---|-----------|-----------|-------------------|-------------|
| 4 | **Exploration** | Discover unknown regions | World-building expansion, curiosity | Loss of direction -> Guide with environmental storytelling |
| 5 | **Collection** | Gather items/information | Deepening world understanding | Tedious errands -> Add mini-narrative to each item |
| 6 | **Puzzle** | Solve puzzles/ciphers | Intellectual achievement, learning world rules | Getting stuck -> Provide tiered hint system |

### Social/Relationship Category

| # | Archetype | Core Loop | Narrative Function | Risk Factor |
|---|-----------|-----------|-------------------|-------------|
| 7 | **Escort** | Accompany an NPC | Relationship building, character development | Slow NPC -> Ensure AI behavior quality |
| 8 | **Negotiation** | Resolve through dialogue | Exploring faction relations, role-playing | Obvious answer -> Assign a cost to every choice |
| 9 | **Delivery** | Carry goods/information | World traversal, NPC network | Simple travel -> Insert events during travel |

### Variant/Composite Category

| # | Archetype | Core Loop | Narrative Function | Risk Factor |
|---|-----------|-----------|-------------------|-------------|
| 10 | **Infiltration** | Achieve objective undetected | Tension, alternative play style | Detection=failure prohibited -> Switch to combat on detection |
| 11 | **Competition** | Compete against NPCs/players | Achievement, social comparison | Unfairness -> Visual progress indicators |
| 12 | **Dilemma** | Irreconcilable choices | Moral weight, player identity | Correct answer exists -> Ensure every choice has pros and cons |

## Quest Structure Design: 3-Layer Architecture

```
[Surface Layer] What the player sees: "The village elder asks you to find herbs"
[Mechanical Layer] What the game tracks: Travel -> Collect -> Combat -> Return + Flag changes
[Narrative Layer] What the story conveys: The elder's hidden past, the true purpose of the herbs
```

### Surface Layer Design Rules
- The objective must be **immediately understandable** — "What do I need to do?" is grasped within 3 seconds
- There must be **2 or more paths** to the objective — combat/stealth/persuasion
- **Progress** must be visible — 0/5 -> 3/5 -> Complete

### Mechanical Layer Design Rules
- Quest steps should be **3-7 stages** (under 3: too simple, over 7: fatigue)
- Each step should utilize **different game mechanics** — combat -> dialogue -> exploration variations
- Define **failure states** — What happens on failure? (Retry/Branch/Permanent consequence)

### Narrative Layer Design Rules
- After completing a quest, the player should learn **at least 1 new thing** about the world
- NPC requests have **hidden motivations** — the surface reason and the real reason
- Quest outcomes should **affect subsequent quests** — no isolated quests

## Reward Psychology: DRIP Model

| Element | Description | Application |
|---------|-------------|-------------|
| **D**elayed | Delayed rewards — non-immediate rewards | Main quest rewards come at chapter end |
| **R**andom | Random rewards — variable ratio reinforcement | Loot probability systems |
| **I**ntrinsic | Intrinsic rewards — story, character growth | Emotional cutscenes, relationship changes |
| **P**rogressive | Progressive rewards — cumulative achievement | Achievements, titles, skill trees |

### Reward Balance Formula

```
Quest Reward Value = (Time Required x Base Reward Rate) x Difficulty Coefficient x Choice Bonus

- Base Reward Rate: Baseline experience/gold per minute
- Difficulty Coefficient: Easy(0.8), Normal(1.0), Hard(1.5), Hidden(2.0)
- Choice Bonus: 1.2x-1.5x for completing bonus objectives/moral choices
```

## Difficulty Curve Design

### Ideal Difficulty Curve: Sawtooth Pattern

```
Difficulty
  ^
  |    /\      /\        /\
  |   /  \    /  \      /  \
  |  /    \  /    \    /    \    <- Each tooth = quest chain
  | /      \/      \  /      \
  |/                \/        \
  +----------------------------> Progress
```

- Each tooth's **peak**: Boss battle or key branching point
- Each tooth's **valley**: Recovery quests, story development, exploration
- **Overall slope**: Gradual increase — Chapter 1's highest difficulty < Chapter 3's lowest difficulty

### Main vs. Side Quest Placement

| Progress | Main Quest | Side Quest Role |
|----------|-----------|-----------------|
| 0-20% | Tutorial + World introduction | Basic mechanics learning |
| 20-40% | First crisis | Adding depth to factions/characters |
| 40-60% | Twist + New objective | Discovering hidden narratives |
| 60-80% | Final preparation | Securing key items/alliances |
| 80-100% | Climax + Ending | Epilogue, hidden content |

## Quest Document Template

```
### Quest: [Title]
- **ID**: Q_[Chapter]_[Number]
- **Type**: Main / Side / Hidden
- **Archetype**: [Choose from the 12 archetypes]
- **Prerequisite Quest**: Q_XX_XX
- **Recommended Level**: Lv.XX

#### Overview
[1-2 sentence summary]

#### Trigger Conditions
[Quest start conditions]

#### Steps
1. [Action] — [Game Mechanic] — [Narrative Function]
2. ...

#### Branches
- Choice A: [Result] -> [Subsequent impact]
- Choice B: [Result] -> [Subsequent impact]

#### Rewards
- Experience: X / Gold: X / Item: [Name]
- Narrative Reward: [Relationship changes, new information]

#### Flag Changes
- SET: [flag_name] = [value]
```
