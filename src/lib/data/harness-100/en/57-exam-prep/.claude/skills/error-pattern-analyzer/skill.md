---
name: error-pattern-analyzer
description: "A specialized skill for systematically classifying error patterns and constructing concept deficit maps. Used by error-analyst and diagnostician agents when analyzing learner error data to diagnose root causes and develop customized remediation strategies. Automatically applied in contexts such as 'error patterns', 'wrong answer analysis', 'concept deficits', 'weakness analysis', 'error types'. However, psychological testing and learning disability diagnosis are outside the scope of this skill."
---

# Error Pattern Analyzer — Error Pattern Analysis Tool

A specialized skill that enhances the error-analyst and diagnostician agents' error analysis capabilities.

## Target Agents

- **error-analyst** — Error pattern classification, remediation strategy formulation
- **diagnostician** — Weakness identification, concept deficit diagnosis

## 5-Type Error Classification System

### Type 1: Conceptual Gap

**Definition:** The core concept is not understood or is misunderstood
**Signal:** Repeated errors on questions related to the same concept
**Prescription:** Concept re-learning -> varied examples -> self-explanation

```
Example: All normalization questions answered incorrectly
-> Functional dependency concept itself is inaccurate
-> Prescription: Re-learn functional dependency + step-by-step normalization practice
```

### Type 2: Procedural Error

**Definition:** The concept is understood but mistakes occur during application
**Signal:** Errors occur at a specific step in the solution process
**Prescription:** Step-by-step checklist + repeated practice

```
Example: Understands SQL JOIN concept but gets wrong results with multiple JOINs
-> JOIN order and condition application procedure error
-> Prescription: Step-by-step JOIN worksheet + progressively increasing complexity
```

### Type 3: Careless Mistake

**Definition:** Understands the material but makes errors due to inattention
**Signal:** Same question type is sometimes right, sometimes wrong; increases under time pressure
**Prescription:** Verification habits + time management training

### Type 4: Trap Error

**Definition:** Falls for intentional error-inducing devices set by the question writer
**Signal:** Repeatedly selects attractive distractors
**Prescription:** Trap pattern learning + "Why is this NOT the answer?" training

### Type 5: Knowledge Gap

**Definition:** The area has not been studied at all
**Signal:** Guessing-level accuracy (25%) on a specific topic
**Prescription:** New study of the area is required

## Error Analysis Report Template

```markdown
### Error Analysis Results

#### 1. Error Type Distribution

| Error Type | Count | Ratio | Severity |
|-----------|-------|-------|---------|
| Conceptual gap | 8 | 32% | High |
| Procedural error | 5 | 20% | Medium |
| Careless mistake | 4 | 16% | Low |
| Trap error | 5 | 20% | Medium |
| Knowledge gap | 3 | 12% | High |

#### 2. Concept Deficit Map

[Concept A] <- Prerequisite concept
    |
[Concept B] <- Deficit discovered here
    |
[Concept C] <- Cannot learn (requires B first)

#### 3. Remediation Priority Order

1st: Re-learn Concept B (affects downstream Concept C)
2nd: New study of knowledge gap areas
3rd: Trap pattern recognition training
```

## Concept Deficit Tracking Matrix

### Prerequisite Dependency Graph

Track inter-concept dependencies to find the root deficit:

```
If the learner got "tree traversal" wrong:
  -> Check understanding of "recursion"
    -> Check understanding of "stack"
      -> Check understanding of "function call structure"

The lowest-level deficit = root cause
```

### Remediation Priority Calculation

```
Priority = Deficit Severity x Impact Scope x Exam Frequency

Deficit severity: Complete deficit (3), Partial deficit (2), Unstable (1)
Impact scope: Number of downstream concepts (more = higher)
Exam frequency: Exam weight over last 3 years
```

## Error Pattern Characteristics by Exam Type

| Exam Type | Primary Error Patterns | Key Countermeasures |
|-----------|----------------------|-------------------|
| Certification (written) | Similar concept confusion, memorization gaps | Comparison tables, flashcards |
| Certification (practical) | Procedural errors, time overrun | Hands-on practice, timed drills |
| Standardized tests | Trap errors, time allocation | Trap pattern training, time strategy |
| Civil service | Detail confusion, statute memorization | Keyword mnemonics, past exam repetition |
| TOEIC | Listening concentration, vocabulary confusion | Shadowing, similar vocabulary organization |
