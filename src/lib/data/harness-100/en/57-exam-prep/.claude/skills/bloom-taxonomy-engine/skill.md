---
name: bloom-taxonomy-engine
description: "A specialized skill for question design and learning level analysis using Bloom's Taxonomy of Educational Objectives. Used by examiner and learning-designer agents when creating questions at various cognitive levels and hierarchizing learning objectives. Automatically applied in contexts such as 'Bloom's Taxonomy', 'cognitive levels', 'question design', 'learning objective classification', 'higher-order thinking'. However, official curriculum certification and school curriculum planning are outside the scope of this skill."
---

# Bloom Taxonomy Engine — Cognitive-Level Question Design Tool

A specialized skill that enhances the examiner and learning-designer agents' question design capabilities.

## Target Agents

- **examiner** — Cognitive-level question creation, difficulty balancing
- **learning-designer** — Learning objective hierarchization, level-appropriate activity design

## Bloom's Cognitive Domain — 6 Levels

### Revised Bloom's Taxonomy (Anderson & Krathwohl, 2001)

| Level | Cognitive Level | Definition | Key Verbs |
|-------|---------------|-----------|-----------|
| 1 | **Remember** | Recall facts and concepts | List, define, identify, memorize |
| 2 | **Understand** | Grasp meaning, explain | Explain, summarize, classify, compare |
| 3 | **Apply** | Execute procedures, use knowledge | Use, calculate, execute, solve |
| 4 | **Analyze** | Break into components, find relationships | Distinguish, deconstruct, organize, attribute |
| 5 | **Evaluate** | Judge based on criteria | Judge, critique, justify, verify |
| 6 | **Create** | Produce something new | Design, construct, plan, produce |

## Per-Level Question Design Guide

### Level 1: Remember

**Item types:** Multiple choice, true/false, term matching
```
Example:
Q: Which of the following belongs to the transport layer of the TCP/IP protocol?
(a) HTTP  (b) TCP  (c) IP  (d) ARP
```
**Recommended proportion:** 15-20% of the exam

### Level 2: Understand

**Item types:** Interpretive multiple choice, short answer, comparison
```
Example:
Q: Explain the differences between TCP and UDP in terms of reliability and speed.
```
**Recommended proportion:** 20-25%

### Level 3: Apply

**Item types:** Calculation problems, code writing, case application
```
Example:
Q: Calculate the number of usable hosts for a subnet mask of 255.255.255.192.
```
**Recommended proportion:** 25-30%

### Level 4: Analyze

**Item types:** Case analysis, log analysis, comparative analysis
```
Example:
Q: Analyze the following network failure log and deduce the cause.
```
**Recommended proportion:** 15-20%

### Level 5: Evaluate

**Item types:** Judgment essays, design comparison evaluation
```
Example:
Q: Evaluate which of the two database designs below is more suitable
   from the perspectives of normalization, performance, and maintainability.
```
**Recommended proportion:** 5-10%

### Level 6: Create

**Item types:** Design problems, projects, comprehensive essays
```
Example:
Q: Design a system architecture that meets the following requirements.
```
**Recommended proportion:** 5-10%

## Bloom Distribution Guide by Exam Type

| Exam Type | Remember | Understand | Apply | Analyze | Evaluate | Create |
|-----------|----------|-----------|-------|---------|----------|--------|
| Certification (written) | 30% | 30% | 25% | 10% | 5% | 0% |
| Certification (practical) | 5% | 15% | 40% | 25% | 10% | 5% |
| Standardized tests | 20% | 25% | 25% | 20% | 10% | 0% |
| Graduate exams | 10% | 15% | 20% | 25% | 20% | 10% |
| Civil service exams | 35% | 30% | 20% | 10% | 5% | 0% |

## Learning Activity Design (for learning-designer)

### Effective Activities by Bloom Level

| Level | Learning Activity | Tools/Methods |
|-------|------------------|--------------|
| Remember | Flashcards, repeated reading, summary notes | SRS, mind maps |
| Understand | Explain in own words, create examples | Feynman technique, analogies |
| Apply | Practice problems, hands-on exercises | Drills, coding assignments |
| Analyze | Case analysis, comparison table creation | Matrices, diagrams |
| Evaluate | Discussion, peer review, critique writing | Rubric-based assessment |
| Create | Projects, design work, presentations | PBL, portfolios |

## Question Quality Verification Checklist

- [ ] Is each item tagged with its Bloom level?
- [ ] Does the overall Bloom distribution match the exam's purpose?
- [ ] Are higher-order thinking items (Analyze + Evaluate + Create) at least 30%?
- [ ] Is there no cue leakage between items (one item hinting at another's answer)?
- [ ] Are distractors plausible (attractive wrong answers)?
