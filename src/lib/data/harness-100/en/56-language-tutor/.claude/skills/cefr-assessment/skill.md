---
name: cefr-assessment
description: "A specialized skill providing CEFR (Common European Framework of Reference) language proficiency assessment matrices and diagnostic tools. Used by the level-assessor agent for precise per-skill level diagnosis and learning gap analysis. Automatically applied in contexts such as 'CEFR level', 'level test', 'language proficiency assessment', 'A1-C2', 'per-skill diagnosis'. However, official exam certification issuance and formal CEFR certification are outside the scope of this skill."
---

# CEFR Assessment — Language Proficiency Assessment Matrix

A specialized skill that enhances the level-assessor agent's diagnostic capabilities.

## Target Agent

- **level-assessor** — CEFR-based level diagnosis, skill-area strength/weakness analysis

## CEFR 6-Level Descriptors (Can-Do Statements)

### A1 (Beginner)

| Skill Area | Can-Do Statement |
|------------|-----------------|
| Listening | Can understand familiar everyday expressions when spoken slowly and clearly |
| Reading | Can understand simple notices, menus, and signs |
| Speaking | Can introduce oneself and exchange basic greetings |
| Writing | Can fill in personal information on forms |
| Vocabulary | 300-600 words |
| Grammar | Be verbs, present tense, basic questions |

### A2 (Elementary)

| Skill Area | Can-Do Statement |
|------------|-----------------|
| Listening | Can grasp the main point of everyday conversations |
| Reading | Can understand short emails and simple texts |
| Speaking | Can communicate in routine situations (shopping, asking for directions) |
| Writing | Can write simple notes and short messages |
| Vocabulary | 1,000-2,000 words |
| Grammar | Past tense, future tense, comparatives, conjunctions |

### B1 (Intermediate)

| Skill Area | Can-Do Statement |
|------------|-----------------|
| Listening | Can understand standard speech about work, school, and leisure |
| Reading | Can understand articles and letters on everyday topics |
| Speaking | Can speak fluently about travel, interests, and experiences |
| Writing | Can write connected texts on familiar topics |
| Vocabulary | 3,000-5,000 words |
| Grammar | Perfect tenses, passive voice, relative clauses, conditionals |

### B2 (Upper-Intermediate)

| Skill Area | Can-Do Statement |
|------------|-----------------|
| Listening | Can understand complex discussions, news broadcasts, and lectures |
| Reading | Can read specialized articles and literary works |
| Speaking | Can engage in natural discussion with native speakers |
| Writing | Can write essays and reports with logical structure |
| Vocabulary | 5,000-8,000 words |
| Grammar | Subjunctive mood, participle clauses, emphasis/inversion |

### C1 (Advanced)

| Skill Area | Can-Do Statement |
|------------|-----------------|
| Listening | Can understand fast-paced native speech and movies naturally |
| Reading | Can deeply comprehend academic papers and technical documents |
| Speaking | Can explain complex topics flexibly and effectively |
| Writing | Can produce well-structured, persuasive extended texts |
| Vocabulary | 8,000-15,000 words |
| Grammar | Subtle nuances, idiomatic expressions, complex structures |

### C2 (Mastery)

| Skill Area | Can-Do Statement |
|------------|-----------------|
| All areas | Native-level accuracy and naturalness |
| Vocabulary | 15,000+ words |
| Grammar | Near error-free, fluent command |

## Adaptive Diagnostic Test Design

### Test Structure (15-20 minutes)

```
[Stage 1] Placement Test (5 items)
  -> Start with B1-level items
  -> 3+ correct -> Stage 2 Upper
  -> 2 or fewer correct -> Stage 2 Lower

[Stage 2] Level Confirmation (10 items)
  -> Upper: B2-C1 items
  -> Lower: A1-A2 items
  -> Determine level based on accuracy rate

[Stage 3] Skill-Area Breakdown (10 items)
  -> Within +/- 1 level of the confirmed level
  -> 2-3 items each for listening/reading/grammar/vocabulary
```

### Item Types by Assessment Area

| Item Type | Assessment Area | CEFR Level Discriminability |
|-----------|----------------|---------------------------|
| Fill-in-the-blank | Grammar, vocabulary | All levels |
| Reading comprehension | Reading ability | B1+ |
| Error identification | Grammatical accuracy | B2+ |
| Sentence reordering | Syntactic understanding | A2-B1 |
| Short writing | Expressive ability | B1+ |
| Dialogue completion | Pragmatics | A2-B2 |

## CEFR-to-Exam Mapping Table

| CEFR | TOEIC | TOEFL iBT | IELTS | JLPT | HSK |
|------|-------|-----------|-------|------|-----|
| A1 | 120-220 | - | - | N5 | 1-2 |
| A2 | 225-545 | - | 3.0-3.5 | N4 | 3 |
| B1 | 550-780 | 42-71 | 4.0-5.0 | N3 | 4 |
| B2 | 785-940 | 72-94 | 5.5-6.5 | N2 | 5 |
| C1 | 945+ | 95-113 | 7.0-8.0 | N1 | 6 |
| C2 | - | 114-120 | 8.5-9.0 | - | - |

## Learning Gap Analysis Report Structure

```markdown
### Skill-Area CEFR Level Profile

| Skill Area | Current Level | Target Level | Gap | Priority |
|------------|--------------|-------------|-----|----------|
| Listening | B1 | B2 | 1 level | High |
| Reading | B2 | B2 | - | Maintain |
| Speaking | A2 | B2 | 2 levels | Top priority |
| Writing | B1 | B2 | 1 level | Medium |
| Vocabulary | B1 | B2 | 1 level | High |
| Grammar | B2 | B2 | - | Maintain |

### Estimated Study Hours (Per CEFR Level Transition)

| Transition | Required Hours (guided study) |
|------------|------------------------------|
| A1 -> A2 | 100-150 hours |
| A2 -> B1 | 150-200 hours |
| B1 -> B2 | 200-250 hours |
| B2 -> C1 | 250-300 hours |
| C1 -> C2 | 300+ hours |
```
