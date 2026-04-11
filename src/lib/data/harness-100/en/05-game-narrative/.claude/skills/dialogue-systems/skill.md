---
name: dialogue-systems
description: "A specialized skill for the dialogue-writer agent covering game dialogue systems. Provides character voice design, choice psychology, bark systems, cutscene direction, and emotion tag systems. Use for 'game dialogue,' 'NPC conversations,' 'choice design,' 'character voice,' and similar topics."
---

# Dialogue Systems — Game Dialogue System Methodology

Specialized game dialogue knowledge used by the dialogue-writer agent when writing NPC dialogue, choices, and cutscenes.

## Why Game Dialogue Is Different

Novel dialogue is read. Film dialogue is heard. Game dialogue is **chosen by the player**. This interactive element changes everything.

## Character Voice Design: VOICE Framework

| Element | Description | Design Question |
|---------|-------------|-----------------|
| **V**ocabulary | Vocabulary level and range | What words does this character use, and which do they never use? |
| **O**pinion | Attitude toward the world | Optimistic? Cynical? Pragmatic? Idealistic? |
| **I**diom | Speech habits, punctuation patterns | Distinctive exclamations, sentence endings, repeated expressions? |
| **C**adence | Sentence rhythm and length | Short, clipped speech? Long, elegant sentences? |
| **E**motion | Emotional expression style | Express emotions directly? Imply through actions? Suppress? |

### Character Voice Card Example

```
Character: Seasoned Mercenary Captain
- V: Heavy military terminology, minimal emotional vocabulary. "Operation," "retreat," "supply"
- O: Realism, mocks idealism. "Heroes die young"
- I: Habit of ending sentences with "...yeah." Frequent imperative sentences
- C: Short sentences, occasionally long monologues (when reminiscing)
- E: Never expresses emotions directly. Shows only through actions
```

## Choice Design Psychology

### Choice Type Classification

| Type | Description | Narrative Function | Example |
|------|-------------|-------------------|---------|
| **Personality Expression** | Player role-playing | Building character identity | Kind/Cold/Humorous responses |
| **Information Gathering** | Obtaining additional info | World exploration | "What does that mean?" |
| **Moral Dilemma** | Irreconcilable value conflicts | Emotional weight | If you could only save one? |
| **Strategic Choice** | Affects gameplay | Resource/path decisions | Frontal assault/Stealth/Negotiation |
| **Relationship Choice** | Changes NPC relationships | Social simulation | Agree/Disagree/Evade |

### Choice Design Rules

1. **Predictable outcomes**: Reading the choices should allow rough prediction of results. "Burn the innocent village" should not lead to a good outcome
2. **Emotional differentiation**: Not all choices should be "nice words vs. mean words." Even with the same intent, the **method** should differ
3. **Rule of 3**: 2-4 choices, optimal is 3 (proactive/neutral/aggressive variants)
4. **No false choices**: If every option leads to the same result, the player feels betrayed
5. **Silence is also a choice**: Treat "..." or timeout as a meaningful response

### Designing the Weight of Choices

```
Weight = Irreversibility x Scope of Impact x Emotional Investment

- Irreversibility: Re-selectable (low) ~ Permanent (high)
- Scope of Impact: Immediate dialogue change (low) ~ Ending change (high)
- Emotional Investment: First-met NPC (low) ~ Long-time companion (high)
```

## Bark System

Barks are **short lines NPCs say automatically in non-dialogue situations**. They are a key element that makes the world feel alive.

### Bark Categories

| Category | Trigger | Example |
|----------|---------|---------|
| **Idle** | Waiting near the player | "The market is quiet today..." |
| **React** | Reacting to player actions | "Whoa, careful!" (during combat) |
| **Ambient** | Weather/time/location changes | "Looks like rain..." |
| **Relationship** | Changes based on affinity | High affinity: "Hail, hero!" / Low: "Hmph, you again" |
| **Story** | Based on quest progression | "The elder was looking for you" |
| **Combat** | During battle situations | "They're behind us!", "Need healing!" |

### Bark Quality Rules

- **No repeating the same bark**: At least 3-5 variations per trigger
- **Maintain character voice**: Barks also follow the VOICE framework
- **Information delivery**: Naturally convey quest hints or world information through barks
- **Length**: 1-2 sentences, 3 seconds maximum

## Cutscene Dialogue Direction

### Dialogue Density by Cutscene Type

| Cutscene Type | Dialogue Ratio | Silent Direction Ratio | Purpose |
|--------------|---------------|----------------------|---------|
| **Opening** | 30% | 70% | World immersion, visual impact |
| **Character Introduction** | 60% | 40% | Imprinting character personality |
| **Pre-Battle** | 40% | 60% | Building tension |
| **Twist/Reveal** | 50% | 50% | Shock + lingering impression |
| **Ending** | 40% | 60% | Emotional catharsis |

### Dialogue-Silence Rhythm Formula

```
[Dialogue] — [Reaction shot 1-2 sec] — [Dialogue] — [Long silence 3-5 sec] — [Decisive line]

Absolute prohibition: [Dialogue][Dialogue][Dialogue] in succession — no room for emotions to build
```

## Dialogue Format Standard

```
DIALOGUE_ID: D_[Chapter]_[Scene]_[Sequence]
SPEAKER: [Character Name]
EMOTION: [neutral/happy/angry/sad/fearful/surprised/contempt]
CONDITION: [IF flag_xxx == true]
VOICE_NOTE: [Acting direction — "whispered," "suppressing anger"]

[Dialogue content]

-> CHOICE (if choices exist)
  A: [Choice text] -> GOTO D_XX_XX_XX / SET flag_xxx
  B: [Choice text] -> GOTO D_XX_XX_XX / SET flag_xxx
```
