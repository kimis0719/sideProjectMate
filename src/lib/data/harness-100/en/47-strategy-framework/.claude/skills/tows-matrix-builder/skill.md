---
name: tows-matrix-builder
description: "A methodology for converting SWOT analysis results into a TOWS matrix to derive actionable strategies. Used for 'TOWS analysis,' 'SWOT strategy derivation,' 'strategy matrix,' 'cross-analysis,' and 'SO/WO/ST/WT strategies' when developing SWOT-based strategies. Note: Financial modeling and organizational design are outside the scope of this skill."
---

# TOWS Matrix Builder — SWOT-to-Strategy Conversion Methodology

A skill that enhances strategy derivation for swot-specialist and strategy-writer.

## Target Agents

- **swot-specialist** — Systematically derives TOWS strategies from SWOT analysis
- **strategy-writer** — Connects TOWS strategies to the execution roadmap

## TOWS Matrix Structure

```
              | Strengths (Internal) | Weaknesses (Internal) |
──────────────┼─────────────────────┼──────────────────────┤
Opportunities | SO Strategy          | WO Strategy           |
(External)    | Use strengths to     | Overcome weaknesses   |
              | seize opportunities  | to seize opportunities|
──────────────┼─────────────────────┼──────────────────────┤
Threats       | ST Strategy          | WT Strategy           |
(External)    | Use strengths to     | Minimize weaknesses   |
              | counter threats      | and threats           |
```

## Strategy Derivation Guide by Type

### SO Strategy (Offensive) — "Strengths x Opportunities"

```
Question: "How can we use this strength to maximize this opportunity?"

Patterns:
1. Market expansion: Technology (S) + Growing market (O) → Enter new markets
2. New product development: R&D capability (S) + Customer needs (O) → Differentiated product
3. Alliance/M&A: Brand (S) + Industry restructuring (O) → Strategic partnership

Example:
  S: "Top-tier AI technology development capability"
  O: "Healthcare AI market growing 25% annually"
  SO: "Concentrate AI technology investment in healthcare diagnostics to capture first-mover advantage"
```

### WO Strategy (Redirectional) — "Weaknesses x Opportunities"

```
Question: "Can we overcome this weakness to capture this opportunity?"

Patterns:
1. Capability building: Talent shortage (W) + Market opportunity (O) → Hiring/training investment
2. Partnership: Lack of channels (W) + Growing demand (O) → Distribution partnership
3. Outsourcing/Adoption: Technology gap (W) + Technology maturity (O) → Solution adoption

Example:
  W: "Lack of global sales network"
  O: "Accelerating digital transformation in Southeast Asia"
  WO: "Establish a joint venture with a local partner to enter the Southeast Asian market"
```

### ST Strategy (Defensive) — "Strengths x Threats"

```
Question: "How can we use this strength to defend against or convert this threat?"

Patterns:
1. Differentiation: Technology (S) + Intensifying competition (T) → Widen the technology gap
2. Switching costs: Customer relationships (S) + Substitutes (T) → Strengthen lock-in
3. Preemptive action: Market position (S) + Regulatory change (T) → Lead regulation

Example:
  S: "15 patents held"
  T: "Global enterprise entering the market"
  ST: "Leverage the patent portfolio for technology licensing + strengthen barriers to entry"
```

### WT Strategy (Retreat/Minimize) — "Weaknesses x Threats"

```
Question: "How can we minimize damage at the intersection of weakness and threat?"

Patterns:
1. Shrink/exit: Divest uncompetitive businesses
2. Risk hedging: Diversify dependencies
3. Structural change: Fundamental organizational/process improvement

Example:
  W: "Unstable cash flow"
  T: "Expected economic downturn"
  WT: "Divest non-core business units + secure cash + focus on core competencies"
```

## Strategy Priority Evaluation

```
Score each TOWS strategy against these criteria:

| Criterion | Weight | 1-5 Scale |
|-----------|--------|-----------|
| Strategic impact | 30% | Contribution to business outcomes |
| Feasibility | 25% | Executable with current resources |
| Urgency | 20% | Opportunity cost if delayed |
| Risk | 15% | Impact if it fails |
| Resource efficiency | 10% | Return on investment |

Weighted sum → Select top 3-5
```

## SWOT Element Derivation Guide

### Internal Analysis (S/W) Framework

```
7S Framework:
  Strategy — Strategic position
  Structure — Organizational structure
  Systems — Processes/IT
  Shared Values — Culture/values
  Style — Leadership
  Staff — Workforce/capabilities
  Skills — Core competencies

VRIO Resource Analysis:
  Valuable — Is the resource valuable?
  Rare — Is it rare?
  Inimitable — Is it hard to imitate?
  Organized — Is there a system to exploit it?
  → All four Yes = Sustainable competitive advantage (S)
  → Any No = Weakness or temporary advantage (W)
```

### External Analysis (O/T) Framework

```
PESTLE:
  Political — Political/policy changes
  Economic — Economic conditions
  Social — Social/demographic changes
  Technological — Technological advances
  Legal — Laws/regulations
  Environmental — Environmental/ESG

Classify each factor as Opportunity (O) or Threat (T)
```

## Deliverable Template

```markdown
## TOWS Strategy Matrix

### SWOT Summary
| Strengths (S) | Weaknesses (W) |
| Opportunities (O) | Threats (T) |

### TOWS Strategies
| | S1 | S2 | S3 | W1 | W2 |
|---|---|---|---|---|---|
| O1 | SO-1 | | | WO-1 | |
| O2 | | SO-2 | | | WO-2 |
| T1 | ST-1 | | | | WT-1 |
| T2 | | ST-2 | | WT-2 | |

### Strategy Priorities
| Rank | Strategy | Type | Score | Execution Timing |
```
