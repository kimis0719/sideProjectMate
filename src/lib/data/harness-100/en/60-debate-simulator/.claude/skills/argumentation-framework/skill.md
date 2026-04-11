---
name: argumentation-framework
description: "A specialized skill that systematically provides the Toulmin argument model, evidence type classification, and rebuttal strategies for debate argumentation. Used by pro-debater and con-debater agents to construct robust arguments and effectively rebut opposing claims. Automatically applied in contexts such as 'argumentation structure', 'Toulmin model', 'argument construction', 'rebuttal strategy', 'evidence types', 'argument strengthening'. However, legal advocacy and academic paper argumentation structure are outside the scope of this skill."
---

# Argumentation Framework — Argument Construction Framework

A specialized skill that enhances the pro-debater and con-debater agents' argumentation capabilities.

## Target Agents

- **pro-debater** — Pro argument construction, rebuttal preparation
- **con-debater** — Con argument construction, alternative proposals

## Toulmin Argument Model

### 6-Element Structure

```
[Data/Evidence]  -->  Therefore  -->  [Claim]
     (Data)             |           (Claim)
                        |
                  [Warrant]       [Qualifier]
                  (Warrant)      "generally," "may"
                     |
                  [Backing]      [Rebuttal]
                  (Backing)     (Rebuttal)
              Warrant's support   Exceptions/counterexamples
```

### Element Descriptions

| Element | Role | Example (Resolution: "Remote work should be expanded") |
|---------|------|-------------------------------------------------------|
| Claim | Statement to be proven | "Remote work should be expanded" |
| Data | Facts supporting the claim | "Remote workers' productivity was 13% higher (Stanford, 2015)" |
| Warrant | Logical bridge from data to claim | "Because productivity gains increase corporate competitiveness" |
| Backing | Additional support for the warrant | "OECD reports identify productivity as the key driver of GDP growth" |
| Qualifier | Adjusts claim strength | "For most knowledge-work occupations" |
| Rebuttal | Acknowledges exceptions/counterarguments | "Excluding manufacturing where on-site work is essential" |

## Argument Types (Appeal Types)

| Type | Description | Effective Use | Caution |
|------|-------------|-------------|---------|
| Logos | Logic, data, statistics | Policy debates, analytical topics | Guard against data distortion |
| Ethos | Credibility, authority | Expert citations, institutional reports | Guard against authority abuse |
| Pathos | Emotion, empathy | Social issues, value debates | Guard against emotional manipulation |
| Kairos | Timeliness, relevance | Current events | Guard against urgency exaggeration |

## Evidence Types and Strength

### Evidence Pyramid (by strength)

```
        [Meta-analysis / Systematic Review]
              Strongest
       /                        \
  [Experimental Studies]    [Large-Scale Surveys]
    Quantitative causal       Quantitative correlational
    /          \              /              \
[Case Studies]  [Expert Opinion]  [Statistical Data]  [Analogy]
   Qualitative     Authority        Descriptive      Explanatory
```

### Evidence Quality Checklist

- [ ] Is the source clearly identified? (Author, institution, year)
- [ ] Is it peer-reviewed research?
- [ ] Is the sample size sufficient?
- [ ] Is the data recent? (Within 5 years recommended)
- [ ] Is the context appropriate for the current resolution?
- [ ] Is correlation being mistaken for causation?

## 5-Type Rebuttal Strategies

### Type 1: Attacking Premises

Challenge the opponent's data or assumptions directly:
- "That study had a sample of only 50 people"
- "That data is from 2015 and the context has changed"

### Type 2: Attacking Logic

Break the logical connection from data to claim:
- "Productivity gains do not necessarily justify expansion"
- "Correlation does not imply causation"

### Type 3: Counter-Example

Present specific cases that refute the claim:
- "Yahoo saw improved performance after eliminating remote work"

### Type 4: Cost-Benefit Attack

Argue that costs/side effects outweigh the benefits:
- "Productivity may rise, but organizational culture damage and isolation are even greater costs"

### Type 5: Counter-Proposal

Present an alternative better than the opponent's approach:
- "Instead of expanding remote work, a hybrid model is more effective"

## Cross-Examination Question Design

### Question Types

| Type | Purpose | Example |
|------|---------|---------|
| Clarification | Demand specificity on vague claims | "Exactly what scope of remote work are you referring to?" |
| Trap | Lead to contradiction | "Then should jobs where productivity drops also go remote?" |
| Dilemma | Either answer is disadvantageous | "If A, then [problem]; if B, then [problem]. Which is it?" |
| Evidence challenge | Attack data reliability | "What population was sampled in that study?" |

## Argument Strength Self-Assessment Matrix

| Criterion | 1 pt (Weak) | 3 pts (Average) | 5 pts (Strong) |
|----------|-------------|-----------------|----------------|
| Evidence quality | Personal opinion | News/reports | Academic research |
| Logical connection | Contains leaps | Generally logical | Airtight |
| Rebuttal resistance | Easily rebutted | Partially rebuttable | Hard to rebut |
| Originality | Common argument | New perspective | Original framework |
