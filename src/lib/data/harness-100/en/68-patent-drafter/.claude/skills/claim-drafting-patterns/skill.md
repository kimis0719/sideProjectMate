---
name: claim-drafting-patterns
description: "Strategic drafting patterns and claim scope design guide for patent claims. The 'claim-drafter' and 'patent-reviewer' agents must use this skill's drafting patterns, terminology rules, and dependent claim strategies when writing or verifying claims. Used for 'claim drafting', 'claim scope design', 'dependent claim strategy', etc. Note: Overall patent orchestration or prior art search is outside the scope of this skill."
---

# Claim Drafting Patterns — Claim Drafting Pattern Guide

Strategic composition, terminology selection, and claim scope optimization methodology for patent claims.

## Drafting Patterns by Claim Type

### Apparatus (Article) Claim Structure

```
In a [title of invention],
[Component A];
[Component B] connected to said [Component A] and performing [Function 1]; and
[Component C] receiving [data/signal] from said [Component B] and performing [Function 2],
comprising [title of invention].
```

### Method (Process) Claim Structure

```
A method for [purpose], comprising:
(a) a step of [subject] performing [Action 1];
(b) a step of performing [Action 2] based on the result of step (a); and
(c) a step of performing [Action 3] according to [condition].
```

### Computer Program Claim

```
A non-transitory computer-readable recording medium storing instructions that, when executed by a processor, cause the processor to perform operations comprising:
performing [Action 1];
performing [Action 2]; and
performing [Action 3].
```

## Claim Scope Design Strategy

### Hierarchical Claim Structure (Claim Tree)

```
Independent Claim 1 (Apparatus — broadest)
  +-- Dependent Claim 2: Component A elaboration
  +-- Dependent Claim 3: Component B elaboration
  +-- Dependent Claim 4: Connection method limitation
  +-- Dependent Claim 5: Additional Component D inclusion

Independent Claim 6 (Method — broadest)
  +-- Dependent Claim 7: Step subdivision
  +-- Dependent Claim 8: Condition addition
  +-- Dependent Claim 9: Additional step

Independent Claim 10 (Recording medium)
```

### Scope Adjustment Techniques

| Technique | Description | Example |
|-----------|-------------|---------|
| Generalization | Use broader terms that encompass specific implementations | "sensor" -> "detection means" |
| Functional Expression | Define by function instead of structure | "means for storing data" |
| Open Transition | Use "comprising" | Allows additional elements beyond those listed |
| Optional Limitation | "Preferably" in dependent claims | Maintains independent claim scope |
| Numerical Range | Broad range -> Narrow range hierarchy | Independent "1-100", Dependent "10-50" |

## Terminology Rules

### Expressions to Avoid

| Prohibited Expression | Problem | Alternative |
|----------------------|---------|-------------|
| "about", "approximately" | Scope unclear (description deficiency) | Specify numerical range |
| "such as", "etc." | Range unspecified | Specific enumeration or broader concept |
| "optimal", "superior" | Subjective, no comparison basis | Present objective criteria |
| "conventional", "existing" | Unclear time reference | Specify particular technology |
| "as needed" | Arbitrary composition | Specify conditions |

### Antecedent Rules

```
First appearance: "a [component]" or "[component]"
Re-appearance: "said [component]" or "the [component]" (same term)

Violation example: "sensor" -> "said detector" (name mismatch = description deficiency)
```

## Rejection Response Patterns

### Novelty Rejection (Article 29, Paragraph 1)

```
Response strategy:
1. Identify differentiating elements from prior art
2. Add differentiating elements to independent claim (amendment)
3. Argue technical significance of differences in opinion statement
4. Merge dependent claims to narrow scope (fallback)
```

### Inventive Step Rejection (Article 29, Paragraph 2)

```
Response strategy:
1. Argue lack of combination motivation: "There is no motivation to combine the prior art references"
2. Argue unexpected effects: "The combination produces synergistic effects"
3. Argue technical prejudice: "A direction a person skilled in the art would not attempt"
4. Commercial success evidence: "Market success demonstrates inventive step"
```

## Claim Self-Check Checklist

- [ ] Does the independent claim cover the broadest scope
- [ ] Are all term antecedents clear
- [ ] Is the transition phrase open-ended ("comprising")
- [ ] Do dependent claims progressively narrow the scope
- [ ] Is there a 3-type claim set (apparatus + method + recording medium)
- [ ] Are all specification embodiments covered by claims
- [ ] Do reference numerals match specification and drawings

## Notes

- Based on Patent Act and examination guidelines
- Detailed drafting examples: See `references/claim-examples.md`
