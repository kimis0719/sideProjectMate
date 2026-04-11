---
name: bars-assessment
description: "Specialized skill for designing BARS (Behaviorally Anchored Rating Scale) assessment tools. Used by the rubric-designer agent when defining behavioral anchors per competency and designing BEI questions and SJT items. Automatically applied in contexts involving 'BARS,' 'behavioral rating scale,' 'BEI interview,' 'SJT,' 'assessment center,' or 'behavioral anchors.' Actual assessment execution or psychometric validation (factor analysis) is outside the scope of this skill."
---

# BARS Assessment — Behaviorally Anchored Rating Scale Design Tool

A specialized skill that enhances the rubric-designer agent's assessment tool design capabilities.

## Target Agent

- **rubric-designer** — BARS scoring guides, BEI questions, SJT item design

## BARS (Behaviorally Anchored Rating Scale) Design

### BARS Components

```
Competency: [Competency Name]
Definition: [Competency Definition]

5 — Exceptional
  Anchor: "[Specific behavioral description]"

4 — Proficient
  Anchor: "[Specific behavioral description]"

3 — Competent
  Anchor: "[Specific behavioral description]"

2 — Developing
  Anchor: "[Specific behavioral description]"

1 — Inadequate
  Anchor: "[Specific behavioral description]"
```

### Behavioral Anchor Writing Principles

| Principle | Good Example | Bad Example |
|-----------|-------------|-------------|
| Observable | "Leads weekly team retrospectives, generating 3+ improvement actions" | "Has excellent leadership" |
| Specific | "Writes root cause analysis report within 15 min of incident" | "Solves problems well" |
| Clear level distinction | Lv.3: Applies existing methods / Lv.4: Proposes improvements | Unclear level differences |
| Includes frequency/quality | "Publishes 2+ technical blog posts per quarter" | "Writes occasionally" |

### 5-Step BARS Design Process

```
1. CIT (Critical Incident Technique)
   → Collect effective/ineffective behaviors for the target job

2. Behavioral Categorization
   → Classify collected behaviors by competency

3. Anchor Placement
   → Place each behavior on the 1-5 point scale

4. Expert Validation
   → 3-5 SMEs review appropriateness of anchor placement

5. Final Confirmation
   → Adopt only anchors with 70%+ retranslation agreement
```

## BEI (Behavioral Event Interview) Question Design

### Question Structure: STAR-L

```
S - Situation: "Please describe the specific situation"
T - Task: "What was your role/assignment at that time?"
A - Action: "What specific actions did you take?"
R - Result: "What were the results? Can you quantify them?"
L - Learning: "What did you learn from that experience?"
```

### BEI Question Examples by Competency

| Competency | Question | Evaluation Points |
|------------|----------|------------------|
| Problem Solving | "Describe an experience resolving an unexpected technical issue?" | Systematic approach, creativity, speed |
| Collaboration | "Describe an experience reaching consensus with a disagreeing colleague?" | Listening, persuasion, finding common ground |
| Leadership | "Describe an experience where you led your team to achieve a goal?" | Vision, motivation, results |
| Learning Agility | "Describe an experience quickly mastering a new technology/tool?" | Learning strategy, application speed |
| Customer Focus | "Describe an experience handling a customer complaint?" | Empathy, resolution, follow-up |

### BEI Follow-up Questions (Probing)

| Situation | Follow-up Question |
|-----------|-------------------|
| Vague answer | "Could you be more specific?" |
| Unclear attribution | "Did the team do that, or did you do it personally?" |
| Unclear results | "How would you express that result numerically?" |
| Missing STAR element | "What specific actions did you take at that point?" |

## SJT (Situational Judgment Test) Item Design

### SJT Item Template

```markdown
**Situation:** [Specific scenario that could occur in the job]

Select the most effective and least effective action from the following:

(A) [Action option 1]
(B) [Action option 2]
(C) [Action option 3]
(D) [Action option 4]

Answer: Best = (C), Worst = (A)
Scoring: Corresponds to competency [X] at level [N]
```

### SJT Option Design Principles

| Principle | Description |
|-----------|-------------|
| 4-5 options | All plausible but with varying effectiveness |
| Avoid extremes | No obviously best/worst choices |
| Realistic situations | Scenarios that could actually occur in the job |
| Single competency | Each item measures only one competency |

## Assessment Method Comparison

| Method | Validity | Cost | Application |
|--------|----------|------|-------------|
| BARS | High | Medium | Regular performance evaluations |
| BEI | Very High | High | Hiring, promotion |
| SJT | Medium-High | Low | Large-scale screening |
| 360-degree | Medium | Medium | Competency development feedback |
| AC (Assessment Center) | Very High | Very High | Key talent selection |
