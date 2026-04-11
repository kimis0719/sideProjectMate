---
name: rice-prioritizer
description: "A methodology for systematically determining feature priorities using the RICE framework. Used for 'RICE analysis,' 'feature prioritization,' 'backlog prioritization,' 'feature scoring,' and 'prioritization frameworks' when deciding on product feature priorities. Note: Automatic Jira/Linear ticket creation and real-time dashboard building are outside the scope of this skill."
---

# RICE Prioritizer — Feature Prioritization Framework

A skill that enhances the feature prioritization decisions of strategist and prd-writer.

## Target Agents

- **strategist** — Determines roadmap initiative priorities
- **prd-writer** — Justifies feature priorities within the PRD using RICE

## RICE Score Formula

```
RICE Score = (Reach x Impact x Confidence) / Effort
```

### Reach

```
Definition: The number of users/events this feature will affect within a given period

Measurement criteria:
  - Number of affected users per quarter
  - Number of events triggered per month
  - Number of customer requests

Examples:
  Search improvement: 10,000/quarter (80% of all users)
  Dark mode: 3,000/quarter (survey respondents)
  CSV export: 500/quarter (enterprise only)

Note: Estimates should be data-driven (GA, surveys, CS tickets)
```

### Impact

```
Definition: The magnitude of impact on individual users

Scoring scale (Intercom method):
  3 = Massive — Major improvement in conversion/retention
  2 = High — Meaningful improvement
  1 = Medium — Moderate improvement
  0.5 = Low — Minor improvement
  0.25 = Minimal — Barely noticeable

Evaluation criteria:
  - Impact on core metrics (conversion, retention, NPS)
  - Severity of user pain
  - Contribution to differentiation
```

### Confidence

```
Definition: Level of confidence in the Reach and Impact estimates

Scoring scale:
  100% = High — Data-driven (A/B tests, quantitative analysis)
  80% = Medium — Qualitative research (interviews, surveys)
  50% = Low — Intuition, limited data
  20% = Moonshot — Pure hypothesis

Note: If Confidence is 50% or below, conduct a validation experiment first
```

### Effort

```
Definition: Person-months required for implementation

Calculation method:
  1. Engineering: Development + Code Review + QA
  2. Design: Wireframes + UI + Usability Testing
  3. Other: PM coordination, documentation, launch

Unit: person-month (minimum 0.5)

Examples:
  Search improvement: 2 PM (Backend 1, Frontend 0.5, QA 0.5)
  Dark mode: 1.5 PM
  CSV export: 0.5 PM
```

## RICE Calculation Example

```
| Feature | Reach | Impact | Confidence | Effort | Score |
|---------|-------|--------|------------|--------|-------|
| Search improvement | 10000 | 2 | 80% | 2 | 8000 |
| Dark mode | 3000 | 1 | 80% | 1.5 | 1600 |
| CSV export | 500 | 2 | 100% | 0.5 | 2000 |
| AI recommendations | 8000 | 3 | 50% | 4 | 3000 |

Priority: Search > AI Recommendations > CSV > Dark Mode
```

## Supplementary Frameworks

### RICE + Strategic Alignment

```
Adjusted RICE = RICE Score x Strategic Weight

Strategic Weight:
  1.5: Directly tied to a core strategic initiative
  1.0: Indirectly related
  0.7: Maintenance work unrelated to strategy

→ Corrects for items that are strategically important but have low RICE scores
```

### ICE (Simplified Version)

```
ICE = Impact x Confidence x Ease

Impact: 1-10
Confidence: 1-10
Ease: 1-10 (inverse of Effort)

Use case: Quick decisions, small teams
```

### MoSCoW (Categorical)

```
Must have — Cannot launch without it
Should have — Important but workaround exists
Could have — Nice to have but not essential
Won't have — Excluded from this release

Use case: Scope decisions, stakeholder communication
```

## Priority Matrix Visualization

```
High Impact
     │
     │  Quick Wins    │  Strategic
     │  (High priority)│  (Planned investment)
     │────────────────┼────────────────
     │  Fill-ins      │  Avoid
     │  (When time    │  (Deprioritize)
     │   permits)     │
     └──────────────────────────── High Effort
```

## Deliverable Template

```markdown
## Feature Priority Analysis

### RICE Scoreboard
| # | Feature | R | I | C | E | Score | Rank |
|---|---------|---|---|---|---|-------|------|

### Roadmap Integration
- Now (This Sprint): [Feature 1, 2]
- Next (Next Quarter): [Feature 3, 4]
- Later (Future): [Feature 5, 6]

### Key Assumptions and Risks
- [Assumption 1]: Validation method
- [Risk 1]: Mitigation plan
```
