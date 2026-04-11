---
name: okr-quality-checker
description: "A methodology for systematically verifying OKR (Objectives and Key Results) quality. Used for 'OKR verification,' 'OKR quality check,' 'KR measurability,' 'OKR alignment check,' and 'Objective quality' when validating OKRs. Note: OKR software configuration and performance review integration are outside the scope of this skill."
---

# OKR Quality Checker

A skill that enhances OKR quality verification for okr-designer and strategy-reviewer.

## Target Agents

- **okr-designer** — Self-verifies the quality of designed OKRs
- **strategy-reviewer** — Confirms the strategic alignment of OKRs

## Objective Quality Criteria (QSIM)

| Criterion | Description | Pass Condition |
|-----------|-----------|----------------|
| **Q**ualitative | Is it qualitative and inspiring? | Provides direction without numbers |
| **S**trategic | Is it connected to strategy? | Clear link to higher-level goals |
| **I**nspiring | Does it motivate the team? | Challenging yet achievable |
| **M**emorable | Is it easy to remember? | One sentence, clear language |

### Objective BAD vs GOOD

```
BAD:
  "Increase revenue" → Too vague
  "Achieve NPS score of 70" → This is a KR, not an O
  "Stabilize systems" → Not inspiring

GOOD:
  "Build a product that customers love"
  "Establish leading brand recognition in our market"
  "Achieve code quality that the engineering team is proud of"
```

## Key Result Quality Criteria (SMART-V)

| Criterion | Description | Pass Condition |
|-----------|-----------|----------------|
| **S**pecific | Is it specific? | What, where, how |
| **M**easurable | Is it measurable? | Expressed numerically |
| **A**chievable | Is it achievable? | 60-70% probability of achievement |
| **R**elevant | Is it relevant to the O? | Directly contributes to O achievement |
| **T**ime-bound | Does it have a deadline? | Quarterly/semi-annual cadence |
| **V**erifiable | Is it verifiable? | Data source exists |

### KR Types

```
1. Metric-based: "Improve NPS score from 40 to 60"
2. Milestone-based: "Complete MVP launch"
3. Binary: "Obtain ISO certification" (avoid when possible)

Recommended ratio: Metric 70%, Milestone 30%, Binary 0%
```

### KR BAD vs GOOD

```
BAD:
  "Improve customer satisfaction" → Not measurable
  "Zero bugs" → Unrealistic
  "Execute marketing campaign" → An activity, not a result

GOOD:
  "Improve NPS score from 40 to 60 (monthly survey)"
  "Reduce average P0 bug resolution time from 48 hours to 12 hours"
  "Increase organic traffic from 100K to 250K per month"
```

## OKR Structure Verification

### Quantity Guidelines

```
Company level:
  Objectives: 3-5
  Key Results per O: 3-5

Department level:
  Objectives: 2-4
  Key Results per O: 2-4

Individual level:
  Objectives: 2-3
  Key Results per O: 2-3

Total KR count: Maximum 15 per team (exceeding this dilutes focus)
```

### Alignment Verification

```
Vertical alignment (Cascade):
  Company O → Department O → Team KR

  Verification method:
  1. If all department KRs are achieved, does the company KR get achieved?
  2. Are there company KRs not linked to any department?
  3. Are there department KRs unrelated to company goals?

Horizontal alignment (Cross-functional):
  - Are inter-department dependencies reflected in the KRs?
  - Are there conflicting KRs?
    Example: Marketing "Double new leads" vs CS "Cut response time by 50%"
    → Must account for increased CS load when leads increase
```

## Scoring System

### Google Method (0.0 - 1.0)

```
0.0-0.3: Failure — No meaningful progress
0.4-0.6: Progress — Significant effort, partial achievement
0.7: Success — Expected achievement level for a stretch goal
0.8-1.0: Over-achievement — Goal may have been too easy

Healthy average: 0.6-0.7 (scoring 1.0 every quarter means goals are too low)
```

### KR Progress Calculation

```
Metric-based:
  Progress = (Current - Start) / (Target - Start)
  Example: NPS 40→60 target, currently 52 → (52-40)/(60-40) = 0.6

Milestone-based:
  0.0: Not started
  0.3: In progress (early)
  0.5: In progress (midway)
  0.7: Nearly complete
  1.0: Complete
```

## OKR Anti-Patterns

```
1. Disguising KPIs as OKRs
   "Maintain churn rate below 5%" → BAU metric, not an OKR

2. Setting activities as KRs
   "Execute 3 marketing campaigns" → An activity, not a result

3. Sandbagging (deliberately low targets)
   Scoring 1.0 every time → Not challenging enough

4. Too many OKRs
   6 Os x 5 KRs = 30 items → Impossible to focus

5. OKR = Performance evaluation
   Tying bonuses to OKR achievement rates → Incentivizes sandbagging
```

## Verification Report Template

```markdown
## OKR Quality Verification Report

### Quality Score by Objective
| O | QSIM Score | KR Count | KR SMART-V | Alignment |

### Structure Verification
- Total Os: [N] (recommended 3-5)
- Total KRs: [N] (recommended max 15)
- Vertical alignment: [Pass/Fail]
- Horizontal conflicts: [None/Found]

### Improvement Recommendations
| # | Current KR | Issue | Proposed Improvement |
```
