---
name: branching-logic
description: "A specialized skill for the branch-architect agent covering branching logic. Provides branching structure patterns, flag system design, ending architecture, and state management methodology. Use for 'branch design,' 'multiple endings,' 'flag systems,' 'branching structures,' and similar topics."
---

# Branching Logic — Branching Logic Design Methodology

Specialized knowledge used by the branch-architect agent when designing branching structures, endings, and flag systems.

## Why Branching Logic Matters

Branching is the **key differentiator** that separates game narrative from novels and film. However, the more branches there are, the more production costs increase exponentially. The art lies in making players feel significant variation with fewer branches.

## 6 Branching Structure Patterns

### 1. Bottleneck Structure (Hub-and-Spoke)
```
    A
   / \
  B   C  <- Branch
   \ /
    D    <- Bottleneck (convergence)
   / \
  E   F  <- Re-branch
   \ /
    G    <- Bottleneck
```
- **Advantage**: Freedom of choice within a feasible production scope
- **Key Point**: All paths converge at bottleneck points, but the **manner of convergence must differ**
- **Suited For**: Most commercial RPGs (The Witcher 3, Mass Effect)

### 2. Parallel Paths
```
  A -> B -> C -> D  (Route 1)
  A -> E -> F -> D  (Route 2)
  A -> G -> H -> D  (Route 3)
```
- **Advantage**: High replay value
- **Disadvantage**: Requires 3x the content
- **Suited For**: Short games, visual novels

### 3. Branching Tree
```
       A
      /|\
     B C D
    /|   |\
   E F   G H
```
- **Advantage**: Intuitive, easy to design
- **Disadvantage**: Ending count explosion (2^n), sparse late-game content
- **Suited For**: Short interactive fiction

### 4. Folding Structure (Delayed Consequences)
```
  Choice Moment     ...     Result Manifestation
  Choice at A ->  Passes through B, C, D  ->  Result appears at E
```
- **Advantage**: Big impact with few branches, "my choice mattered" feeling
- **Key Point**: Set a flag and trigger it much later
- **Suited For**: Long RPGs, episodic games

### 5. State Accumulation Structure
```
  Choice 1: Honor +10 / Infamy +10
  Choice 2: Honor +5  / Infamy +5
  ...
  At threshold: Ending A (Honor 70+) / B (Infamy 70+) / C (Neutral)
```
- **Advantage**: The **sum of actions** determines the outcome, not a single choice
- **Key Point**: Players naturally accumulate their tendencies
- **Suited For**: RPGs with morality systems (inFamous, Fable)

### 6. Hybrid Structure
Real games **combine** the above patterns:
- **Main Story**: Bottleneck structure (controllable)
- **Sub Quests**: Branching tree (independent, short)
- **Relationship System**: State accumulation (NPC affinity)
- **Key Choices**: Folding (delayed consequences)

## Flag System Design

### Flag Naming Convention

```
[Category]_[Subject]_[State]

Examples:
QUEST_bandit_camp_destroyed     — Quest-related
REL_npc_aria_friendship_high    — Relationship-related
WORLD_bridge_repaired           — World state
PLAYER_has_ancient_sword        — Player possession
STORY_chapter2_twist_revealed   — Story progression
MORAL_saved_village             — Moral choice
```

### Flag Types

| Type | Value Format | Usage | Example |
|------|-------------|-------|---------|
| **Boolean** | true/false | Event occurrence | `QUEST_dragon_slain = true` |
| **Counter** | Integer | Cumulative actions | `MORAL_mercy_count = 3` |
| **Enum** | String | Path selection | `FACTION_chosen = "rebels"` |
| **Timestamp** | Game time | Time-limited quests | `QUEST_deadline = day_30` |

### Flag Dependency Matrix

Manage all flags needed for branch decisions in a matrix:

```
| Branch Point | Required Flags | Condition | Result |
|-------------|---------------|-----------|--------|
| CH3_Battle | REL_aria >= 50 AND QUEST_sword = true | Met | Aria joins |
| CH3_Battle | REL_aria < 50 OR QUEST_sword = false | Not met | Solo combat |
```

## Ending Architecture

### Ending Classification

| Type | Achievement Condition | Target Player Percentage |
|------|----------------------|------------------------|
| **Standard Ending** | Main quests complete | 70-80% |
| **Best Ending** | Standard + key side quests + max relationships | 15-20% |
| **Worst Ending** | Accumulated critical choices | 5-10% |
| **Hidden Ending** | Special condition combinations | 1-3% |
| **True Ending** | Second playthrough + hidden conditions | 0.5-1% |

### Ending Satisfaction Rules

1. **Every ending must have closure** — even a "bad ending" should be narratively complete
2. **The best ending should not be too easy** — rewards proportional to effort
3. **Hidden endings must have hints** — completely blind discovery leads to dissatisfaction
4. **Post-ending summary**: A "choice results" screen showing the player's key choices and outcomes

## Branch Testing: Path Simulation

Document and verify all possible paths:

```
Path 1 (Path of Justice): A->B->D->F->Best Ending
  - Flags: MORAL_good=5, REL_aria=80, QUEST_all_done=true
  - Missing Content: None
  - Plot Holes: None

Path 2 (Path of Pragmatism): A->C->D->G->Standard Ending
  - Flags: MORAL_neutral=3, REL_aria=40
  - Missing Content: Aria romance sub-quest
  - Plot Holes: Conditional branch needed when Aria is mentioned in CH4

Path 3 (Path of Destruction): A->C->E->H->Worst Ending
  - Flags: MORAL_evil=5, REL_aria=-20
  - Plot Holes: None
```
