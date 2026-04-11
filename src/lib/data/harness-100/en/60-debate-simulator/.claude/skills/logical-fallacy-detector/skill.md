---
name: logical-fallacy-detector
description: "A specialized skill for identifying and correcting logical fallacies in debates. Used by judge and rapporteur agents to evaluate the logical soundness of both sides' arguments and point out errors. Automatically applied in contexts such as 'logical fallacy', 'fallacy detection', 'sophistry', 'argument evaluation', 'logic verification'. However, formal logic theorem proving and mathematical logic verification are outside the scope of this skill."
---

# Logical Fallacy Detector — Logical Fallacy Detection Tool

A specialized skill that enhances the judge and rapporteur agents' argument evaluation capabilities.

## Target Agents

- **judge** — Argument evaluation, logical fallacy identification
- **rapporteur** — Include logic quality analysis in comprehensive reports

## Major Logical Fallacy Classification

### A. Relevance Fallacies

| Fallacy | Definition | Debate Example | How to Call It Out |
|---------|-----------|---------------|-------------------|
| Ad Hominem | Attacking the person instead of the argument | "Someone without experience has no valid opinion" | "Please evaluate the argument itself" |
| Appeal to Authority | Citing authorities outside their expertise | "A famous actor said so too" | "Do they have expertise in this field?" |
| Appeal to Popularity | Majority opinion = correct | "80% agree, so it must be right" | "Does majority opinion equal validity?" |
| Tu Quoque | "You do it too" as rebuttal | "You have the same problem" | "Your behavior does not invalidate the argument" |
| Straw Man | Distorting the opponent's claim to rebut it | "The opponent wants to eliminate all regulation" | "Please quote the original claim accurately" |

### B. Causal Fallacies

| Fallacy | Definition | Example | How to Call It Out |
|---------|-----------|---------|-------------------|
| Post Hoc | Temporal sequence = causation | "Crime dropped after the policy -> policy caused it" | "What about other variables?" |
| Correlation = Causation | Mistaking correlation for causation | "Ice cream sales up -> crime up" | "Have you considered a third variable (weather)?" |
| Slippery Slope | Assuming extreme consequences | "Allowing this will inevitably lead to ~" | "Please prove the probability of each step" |

### C. Structural Fallacies

| Fallacy | Definition | Example | How to Call It Out |
|---------|-----------|---------|-------------------|
| False Dilemma | Limiting options to only 2 | "Either for or against, nothing else" | "Isn't there a third alternative?" |
| Circular Reasoning | Premise presupposes the conclusion | "This is right because it is right" | "Please provide independent evidence" |
| Hasty Generalization | Generalizing from insufficient cases | "One case was like this, so all are" | "Is the sample sufficient?" |
| False Analogy | Comparing fundamentally dissimilar things | "A national economy is like a household budget" | "What are the key differences between the two?" |
| Red Herring | Diverting to an unrelated topic | Presenting an emotional case unrelated to the topic | "Let's return to the original point" |

### D. Evidence Fallacies

| Fallacy | Definition | Example |
|---------|-----------|---------|
| Cherry Picking | Selecting only favorable data | Citing only success cases from certain countries |
| Appeal to Ignorance | No disproof = true | "There's no counter-evidence, so it must be true" |
| Inadequate Sample | Citing biased samples | Surveys with only voluntary participants |

## Judge Evaluation Rubric (Logic Quality)

### Argument Soundness Assessment Matrix

| Criterion | 1-20 pts | 21-40 pts | 41-60 pts | 61-80 pts | 81-100 pts |
|----------|---------|----------|----------|----------|-----------|
| Logical consistency | Multiple fallacies | 3-4 fallacies | 1-2 fallacies | Generally sound | Airtight logic |
| Evidence quality | No evidence | Weak evidence | Standard evidence | Quality evidence | Academic evidence |
| Rebuttal effectiveness | No rebuttal | Superficial rebuttal | Partial rebuttal | Effective rebuttal | Complete dismantling |
| Staying on point | Frequent digressions | Occasional digressions | Generally on topic | Mostly on topic | Perfectly on topic |

### Fallacy Penalty Standards

| Severity | Penalty | Example |
|----------|---------|---------|
| Minor | -2 pts | Slight exaggeration, unclear source |
| Moderate | -5 pts | Hasty generalization, weak analogy |
| Serious | -10 pts | Straw man attack, false dilemma |
| Critical | -15 pts | Circular reasoning, data manipulation |

## Fallacy Identification Expression Guide (for judge)

**Point out accurately while maintaining respect:**

```
"In the [side] debater's [Nth] argument, a [fallacy name] fallacy is observed.
 Specifically, [quotation]; this constitutes [explanation of why it is fallacious].
 To improve this, [direction for improvement] would be needed."
```
