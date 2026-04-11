---
name: spaced-repetition
description: "A specialized skill for designing vocabulary and grammar review schedules using Spaced Repetition algorithms. Used by the review-coach agent to calculate optimal review intervals based on the Ebbinghaus forgetting curve and maximize long-term memory conversion rates. Automatically applied in contexts such as 'spaced repetition', 'Ebbinghaus', 'review schedule', 'forgetting curve', 'SRS', 'Anki method'. However, external app integration (Anki/Quizlet) and real-time notification system construction are outside the scope of this skill."
---

# Spaced Repetition — Spaced Repetition Algorithm Tool

A specialized skill that enhances the review-coach agent's review design capabilities.

## Target Agent

- **review-coach** — Review scheduling, weakness reinforcement, long-term memory retention

## Ebbinghaus Forgetting Curve-Based Review Intervals

### Base Review Intervals (SM-2 Algorithm Variant)

| Review Round | Interval | Retention Target | Action |
|-------------|----------|-----------------|--------|
| 1st review | 1 day after learning | 80%+ | Review all items |
| 2nd review | 3 days later | 75%+ | Focus on items missed in 1st review |
| 3rd review | 7 days later | 70%+ | Items missed in 2nd review + full sample |
| 4th review | 14 days later | 70%+ | Weak items + random sample |
| 5th review | 30 days later | 65%+ | Long-term memory confirmation test |
| 6th+ | 60, 120 days... | 60%+ | Maintenance review |

### Difficulty-Based Interval Adjustment

Dynamically adjust intervals based on learner response quality:

| Response Quality | Score | Interval Factor | Next Interval |
|-----------------|-------|----------------|---------------|
| Perfect recall (instant) | 5 | x 2.5 | Significantly extended |
| Correct (slight hesitation) | 4 | x 2.0 | Extended |
| Correct (much hesitation) | 3 | x 1.5 | Slightly extended |
| Incorrect (recalled after seeing) | 2 | x 1.0 | Maintained |
| Incorrect (could not recall) | 1 | x 0.5 | Shortened |
| Complete blank | 0 | Reset | Start over |

### Interval Calculation Formula

```
next_interval = previous_interval x EF (Ease Factor)

EF update:
EF' = EF + (0.1 - (5-q) x (0.08 + (5-q) x 0.02))
(q = response quality 0-5)

EF minimum: 1.3 (prevents intervals from becoming too short)
```

## Vocabulary Category-Specific Review Strategies

| Category | Optimal Technique | Review Frequency |
|----------|------------------|-----------------|
| High-frequency basic vocabulary | Repeated exposure in context | Daily natural exposure |
| Medium-frequency practical vocabulary | Flashcards + example sentences | SM-2 algorithm applied |
| Low-frequency specialized vocabulary | Thematic cluster learning | Focus during topic study |
| Idiomatic expressions | Situational role-play | 2-3 times per week |
| Grammar patterns | Transformation drills + writing | SM-2 + weekly writing |

## Review Session Design Principles

### Session Structure (20-minute baseline)

```
[Start] Warm-up (2 min)
  -> Quick recall of 3 key items from previous session

[Core] Spaced Repetition Review (12 min)
  -> 20-30 due cards
  -> Harder cards first (Interleaving)

[Reinforcement] Weakness Focus (4 min)
  -> Re-learn items missed 2+ consecutive times
  -> Apply association/etymology/imagery mnemonics

[Wrap-up] Self-Assessment (2 min)
  -> Self-rate today's session difficulty
  -> Preview next session
```

### Optimal Study Volume

| Learner Level | New Items/Day | Review Items/Day | Total Time |
|--------------|--------------|-----------------|-----------|
| Beginner (A1) | 5-8 | 15-25 | 15-20 min |
| Elementary (A2) | 8-12 | 25-40 | 20-30 min |
| Intermediate (B1-B2) | 10-15 | 30-50 | 25-35 min |
| Advanced (C1+) | 5-10 | 20-30 | 20-25 min |

## Memory Enhancement Techniques (Applied During Review)

| Technique | Description | When to Apply |
|-----------|-------------|--------------|
| Retrieval practice | Attempt to recall without hints first | Every review |
| Elaboration | Explain why this is the correct answer | Items answered correctly 2+ times |
| Interleaving | Mix different item types during review | Review session ordering |
| Dual coding | Text + image + audio | During initial learning |
| Self-reference effect | Connect to personal experience | Creating vocabulary example sentences |
