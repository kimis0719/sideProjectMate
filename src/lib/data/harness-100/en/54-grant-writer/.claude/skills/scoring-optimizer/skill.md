---
name: scoring-optimizer
description: "A specialized skill for analyzing evaluation scores and developing optimization strategies for grant/funding applications. Used by compliance-checker and plan-writer agents when optimizing scores per evaluation criterion and preemptively preventing disqualification risks. Automatically applied in contexts such as 'score optimization', 'evaluation criteria analysis', 'bonus point strategy', 'disqualification prevention', 'review preparation'. However, actual reviewer contact and review result retrieval are outside the scope of this skill."
---

# Scoring Optimizer — Evaluation Score Optimization Tool

A specialized skill that enhances the score optimization capabilities of compliance-checker and plan-writer agents.

## Target Agents

- **compliance-checker** — Score analysis, disqualification risk assessment
- **plan-writer** — High-score item focused writing strategy

## Evaluation Score Analysis Framework

### Common Evaluation Structure (Government Funding Programs)

| Evaluation Area | Typical Score | Key Points |
|----------------|-------------|-----------|
| Technical Merit | 30-40 pts | Technical differentiation, innovativeness, IP ownership |
| Business Viability | 20-30 pts | Market size, revenue plan, commercialization strategy |
| Execution Capability | 15-25 pts | CEO experience, personnel, infrastructure |
| Plan Appropriateness | 10-20 pts | Implementation schedule, goal specificity |
| Policy Alignment | 5-10 pts | Government policy direction alignment |
| Bonus Points | Up to 5-10 pts | Women/disabled-owned enterprise, region, employment |

### 4-Step Score Analysis

```
1. Extract scoring table from announcement → Map scores per item
2. Identify high-score items → Top 3 items = 60-70% of total
3. Among lower items, identify "zero if not addressed" mandatory items
4. Check bonus point items → Prioritize easily obtainable bonus points
```

## High-Score Item Writing Strategies

### Technical Merit (Usually Highest Score)

| Criterion | High-Score Strategy | Failure Pattern |
|----------|-------------------|----|
| Technical Differentiation | Cite patents/papers, quantitative comparison vs. existing tech | Only using abstract "innovative" expressions |
| Technical Maturity | Specify TRL level, present prototype/PoC results | Staying at idea level |
| Technical Evidence | Include formulas/algorithms/architecture diagrams | Listing features without technical explanation |

### Business Viability

| Criterion | High-Score Strategy | Failure Pattern |
|----------|-------------------|----|
| Market Size | Step-wise TAM→SAM→SOM calculation with sources | Unsupported market size claims |
| Revenue Plan | Bottom-up estimation, specific sales channels | Top-down only estimation |
| Competitive Analysis | Positioning matrix, quantitative comparison tables | Claiming "no competitors" |

### Execution Capability

| Criterion | High-Score Strategy | Failure Pattern |
|----------|-------------------|----|
| CEO Capability | Specific listing of relevant experience years, awards/certifications | Summary resume only |
| Team Composition | Name + degree + experience for key personnel | Abstract "we have excellent talent" |
| Infrastructure | Specific equipment, facility, partnership lists | General descriptions |

## Disqualification Risk Checklist

### Eligibility Requirements (Non-compliance = Immediate Disqualification)

- [ ] Company size criteria met (revenue, employees, capital)
- [ ] Industry restriction verified (industry classification codes)
- [ ] Years since establishment requirement
- [ ] Duplicate funding restriction verified
- [ ] No tax delinquencies
- [ ] No fraudulent funding history

### Format Requirements (Non-compliance = Disqualification or Deduction)

- [ ] Page limit compliance
- [ ] Designated form used
- [ ] All required attachments included
- [ ] Signatures/seals present
- [ ] Submission deadline met

## Score Simulation Tool

### Estimated Score Calculation Matrix

```markdown
| Evaluation Item | Max Score | Self-Assessment | Estimated Score | Improvable? | Strategy |
|----------------|----------|----------------|----------------|------------|----------|
| Technical Differentiation | 15 | 8/10 | 12 | Yes | Add patent filing evidence |
| Market Analysis | 10 | 6/10 | 6 | Yes | Strengthen market data |
| CEO Capability | 10 | 9/10 | 9 | Difficult | - |
| Budget Appropriateness | 5 | 7/10 | 3.5 | Yes | Strengthen calculation basis |
| **Total** | **100** | | **73.5** | | Target: 80+ |
```

### Improvement ROI Analysis

Improve items with the highest score improvement relative to effort first:
```
Improvement ROI = (Expected Score Improvement) / (Required Effort)
```

## Bonus Point Acquisition Guide

| Bonus Item | Typical Score | Acquisition Difficulty | Preparation Required |
|-----------|-------------|----------------------|--------------------|
| Women-owned Enterprise | 2-3 pts | Automatic | Women's enterprise certificate |
| Social Enterprise | 2-3 pts | Medium | Certification |
| Employment Excellence | 1-3 pts | Medium | Employment increase documentation |
| Regional Location | 1-2 pts | Automatic | Business registration |
| Green Technology | 1-3 pts | High | Green technology certification |

**Strategy: Always claim automatically obtainable bonus points, and prepare for medium-difficulty bonus points in advance.**
